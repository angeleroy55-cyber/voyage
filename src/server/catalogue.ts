import "server-only";
import { prisma } from "@/server/prisma";
import { BRAND, CONTINENTS, continentOf } from "@/lib/data";
import {
  LAST_MINUTE_DAYS,
  SUBTYPE_ORDER,
  subtypeBlurb,
  subtypeLabel,
} from "@/lib/constants";
import { seasonRange, upcomingSeason } from "@/lib/seasons";
import { withMediaFallback } from "@/lib/media";
import type {
  CategoryAccent,
  CategoryId,
  Destination,
  Offer,
  Post,
  Review,
} from "@/lib/types";
import { listHeroSlides } from "@/server/hero-slides";

/**
 * Lecture du catalogue pour le site public.
 *
 * Les fonctions rendent exactement les formes déjà consommées par les
 * composants (`Offer`, `Destination`, `Review`…), pour que le passage du
 * catalogue statique à la base ne demande aucune réécriture d'affichage.
 */

type OfferRow = {
  slug: string;
  reference: string;
  subtype: string;
  title: string;
  destination: string;
  country: string;
  region: string;
  continent: string;
  departureCity: string;
  days: number;
  nights: number;
  stars: number;
  board: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviewsCount: number;
  departureDate: Date | null;
  dates: string;
  description: string;
  tags: string[];
  amenities: string[];
  highlights: string[];
  included: string[];
  category: { slug: string; label: string; accent: string; showDiscountPercent: boolean };
  images: { url: string; credit: string; creditUrl: string }[];
};

function toOffer(row: OfferRow): Offer {
  const urls = row.images.map((image) => image.url);
  return {
    slug: row.slug,
    reference: row.reference,
    category: row.category.slug as CategoryId,
    categoryLabel: row.category.label,
    categoryAccent: row.category.accent as CategoryAccent,
    // L'affichage du taux de remise se règle par catégorie, jamais offre par
    // offre : la carte porte donc le réglage de sa catégorie propriétaire.
    showDiscountPercent: row.category.showDiscountPercent,
    subtype: row.subtype,
    title: row.title,
    destination: row.destination,
    country: row.country,
    region: row.region,
    continent: row.continent || continentOf(row.country),
    // Conservé pour le repli : une offre créée au back-office sans visuel
    // affiche un placeholder déterministe plutôt qu'un cadre vide.
    imageSeed: row.slug,
    image: urls[0],
    images: urls,
    // Seuls les visuels dont la licence l'exige portent un crédit : la liste
    // est donc souvent vide, et la fiche n'affiche alors aucune mention.
    imageCredits: row.images
      .filter((image) => image.credit)
      .map((image) => ({ text: image.credit, href: image.creditUrl })),
    days: row.days || row.nights + 1,
    nights: row.nights,
    stars: row.stars,
    board: row.board as Offer["board"],
    departureCity: row.departureCity,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    rating: row.rating,
    reviews: row.reviewsCount,
    // Sérialisée en `AAAA-MM-JJ` : la carte est un composant client, et une
    // `Date` traversant la frontière serveur perdrait son fuseau au passage.
    departureDate: row.departureDate ? isoDay(row.departureDate) : undefined,
    dates: row.dates,
    tags: row.tags,
    amenities: row.amenities,
    description: row.description,
    highlights: row.highlights,
    included: row.included,
  };
}

/** Jour civil local, au format `AAAA-MM-JJ`. */
function isoDay(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

const OFFER_SELECT = {
  slug: true,
  reference: true,
  subtype: true,
  title: true,
  destination: true,
  country: true,
  region: true,
  continent: true,
  departureCity: true,
  days: true,
  nights: true,
  stars: true,
  board: true,
  price: true,
  oldPrice: true,
  rating: true,
  reviewsCount: true,
  departureDate: true,
  dates: true,
  description: true,
  tags: true,
  amenities: true,
  highlights: true,
  included: true,
  category: {
    select: { slug: true, label: true, accent: true, showDiscountPercent: true },
  },
  images: {
    select: { url: true, credit: true, creditUrl: true },
    orderBy: { position: "asc" },
  },
} as const;

export async function getOffers(categorySlug?: string): Promise<Offer[]> {
  const rows = await prisma.offer.findMany({
    where: {
      status: "published",
      // Désactiver une catégorie au back-office doit suffire à retirer ses
      // offres du site, sans avoir à les dépublier une par une.
      category: { active: true, ...(categorySlug ? { slug: categorySlug } : {}) },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    select: OFFER_SELECT,
  });
  return rows.map(toOffer);
}

/**
 * Bornes du listing « Dernière minute » : d'aujourd'hui à J+21.
 *
 * Le seuil est calculé à chaque lecture, jamais stocké : une offre ne peut donc
 * pas rester affichée comme urgente après sa date de départ, ni y entrer sans
 * que personne ne la republie.
 */
function lastMinuteWindow(): { gte: Date; lte: Date } {
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + LAST_MINUTE_DAYS);
  return { gte: debut, lte: fin };
}

/**
 * Offres d'une catégorie `dynamique`.
 *
 * Ces catégories ne possèdent aucune offre : elles traversent le catalogue
 * selon leur règle. Une même offre nourrit donc Bons Plans, Dernière Minute et
 * sa catégorie de rattachement sans être dupliquée, et garde une seule adresse,
 * celle de sa catégorie propriétaire. C'est la règle anti-cannibalisation du
 * cahier : jamais deux URLs pour un même contenu.
 */
export async function getRuleOffers(rule: string, take?: number): Promise<Offer[]> {
  const commun = { status: "published", category: { active: true } } as const;

  switch (rule) {
    case "derniere-minute": {
      const rows = await prisma.offer.findMany({
        where: { ...commun, departureDate: lastMinuteWindow() },
        // Le départ le plus proche d'abord : c'est l'urgence qui classe.
        orderBy: { departureDate: "asc" },
        take,
        select: OFFER_SELECT,
      });
      return rows.map(toOffer);
    }
    case "tout-compris": {
      const rows = await prisma.offer.findMany({
        where: { ...commun, board: "Tout compris" },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        take,
        select: OFFER_SELECT,
      });
      return rows.map(toOffer);
    }
    case "france": {
      const rows = await prisma.offer.findMany({
        where: { ...commun, country: "France" },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        take,
        select: OFFER_SELECT,
      });
      return rows.map(toOffer);
    }
    case "promos":
    default:
      return getBestDeals(take);
  }
}

/**
 * Bandeaux d'accroche de la page d'accueil.
 *
 * Ils sont construits depuis le catalogue et non écrits à la main : l'image est
 * celle d'une offre réelle, le prix est celui qu'on trouvera en cliquant, et la
 * période mise en avant suit le calendrier. Un bandeau rédigé en dur annonce
 * tôt ou tard un prix qui n'existe plus, ou une saison passée.
 *
 * L'accroche tient en cinq mots au plus. Au-delà, elle n'est pas lue : sur une
 * image, on retient une promesse, pas une phrase.
 */
export type HeroSlide = {
  id: string;
  /** Surtitre : l'urgence ou le contexte, en trois ou quatre mots. */
  kicker: string;
  /** Promesse principale, cinq mots au plus. */
  title: string;
  /** Prix d'appel réel, déjà remisé. */
  fromPrice: number;
  /** Ce que le prix achète : « 8 jours, tout compris ». */
  detail: string;
  href: string;
  cta: string;
  image: string;
  alt: string;
};

export async function getCatalogueHeroSlides(): Promise<HeroSlide[]> {
  const saison = upcomingSeason();
  const { gte, lte } = seasonRange(saison);

  const commun = { status: "published", category: { active: true } } as const;
  const parPrix = [{ price: "asc" as const }];

  const [saisonniere, derniereMinute, croisiere, circuit] = await Promise.all([
    prisma.offer.findFirst({
      where: { ...commun, departureDate: { gte, lte } },
      orderBy: parPrix,
      select: OFFER_SELECT,
    }),
    prisma.offer.findFirst({
      where: { ...commun, departureDate: lastMinuteWindow() },
      orderBy: parPrix,
      select: OFFER_SELECT,
    }),
    prisma.offer.findFirst({
      where: { ...commun, category: { slug: "croisieres", active: true } },
      orderBy: parPrix,
      select: OFFER_SELECT,
    }),
    prisma.offer.findFirst({
      where: { ...commun, category: { slug: "circuits", active: true } },
      orderBy: parPrix,
      select: OFFER_SELECT,
    }),
  ]);

  // La plus forte remise du catalogue, calculée en mémoire : la comparaison de
  // deux colonnes d'une même ligne échappe au filtre de Prisma.
  const promo = (await getBestDeals(1))[0] ?? null;

  const slides: (HeroSlide | null)[] = [
    saisonniere &&
      construireSlide(toOffer(saisonniere), {
        id: `saison-${saison.id}`,
        kicker: "Prochaine période à réserver",
        title: saison.label,
        href: `/bons-plans-promos?saison=${saison.id}`,
        cta: "Voir les départs",
      }),
    promo &&
      construireSlide(promo, {
        id: "promo",
        kicker: "Vente flash en cours",
        title: `Jusqu'à ${discountOf(promo)} % de remise`,
        href: "/bons-plans-promos",
        cta: "Voir les bons plans",
      }),
    derniereMinute &&
      construireSlide(toOffer(derniereMinute), {
        id: "derniere-minute",
        kicker: "Départ sous trois semaines",
        title: "Dernière minute",
        href: "/derniere-minute",
        cta: "Partir maintenant",
      }),
    croisiere &&
      construireSlide(toOffer(croisiere), {
        id: "croisieres",
        kicker: "Pension complète incluse",
        title: "Croisières au départ d'Europe",
        href: "/croisieres",
        cta: "Découvrir les croisières",
      }),
    circuit &&
      construireSlide(toOffer(circuit), {
        id: "circuits",
        kicker: "Guide francophone",
        title: "Circuits accompagnés",
        href: "/circuits",
        cta: "Choisir un circuit",
      }),
  ];

  // Cinq bandeaux au plus : au-delà, les derniers ne sont jamais vus.
  return slides.filter((slide): slide is HeroSlide => slide !== null).slice(0, 5);
}

/** Remise d'une offre, arrondie, pour l'accroche d'un bandeau. */
function discountOf(offer: Offer): number {
  if (!offer.oldPrice || offer.oldPrice <= offer.price) return 0;
  return Math.round(((offer.oldPrice - offer.price) / offer.oldPrice) * 100);
}

function construireSlide(
  offer: Offer,
  base: { id: string; kicker: string; title: string; href: string; cta: string },
): HeroSlide {
  const nuits = offer.nights > 0 ? `${offer.days ?? offer.nights + 1} jours` : "aller-retour";
  return {
    ...base,
    fromPrice: offer.price,
    detail: `${offer.destination}, ${nuits}`,
    image: withMediaFallback(offer.image),
    alt: `${offer.destination}, ${offer.country}`,
  };
}

export async function getFeaturedOffers(take = 8): Promise<Offer[]> {
  const rows = await prisma.offer.findMany({
    where: { status: "published", featured: true },
    orderBy: { position: "asc" },
    take,
    select: OFFER_SELECT,
  });
  return rows.map(toOffer);
}

/**
 * Meilleures remises, la plus forte d'abord.
 *
 * Le tri se fait en mémoire : la remise se déduit de deux colonnes de la même
 * ligne, ce que le filtre de Prisma ne sait pas exprimer. Sans `take`, la liste
 * complète est rendue, pour que la page Bons Plans n'écarte pas d'offres en
 * silence ; les carrousels de l'accueil, eux, en demandent huit.
 */
export async function getBestDeals(take?: number): Promise<Offer[]> {
  const offers = await getOffers();
  const deals = offers
    .filter((offer) => offer.oldPrice && offer.oldPrice > offer.price)
    .sort(
      (a, b) =>
        (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!,
    );
  return take === undefined ? deals : deals.slice(0, take);
}

export async function getOfferBySlug(slug: string): Promise<Offer | null> {
  const row = await prisma.offer.findFirst({
    where: { slug, status: "published" },
    select: OFFER_SELECT,
  });
  return row ? toOffer(row) : null;
}

/**
 * Demande relue pour la page de confirmation, atteignable avec la seule
 * référence. Les coordonnées n'en font donc pas partie : l'adresse est masquée,
 * juste assez pour que le client reconnaisse la sienne. Le dossier complet reste
 * dans l'espace client, derrière la session.
 */
export async function getBookingConfirmation(reference: string) {
  const row = await prisma.booking.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      travellers: true,
      insurance: true,
      totalPrice: true,
      instalments: true,
      paymentMethod: true,
      departureDate: true,
      returnDate: true,
      customerEmail: true,
      customerId: true,
      offer: {
        select: {
          slug: true,
          // Quatrième endroit imposé par le cahier : la confirmation. Le
          // client repart avec deux numéros, celui de son dossier et celui de
          // l'offre, et le service client retrouve les deux.
          reference: true,
          title: true,
          destination: true,
          country: true,
        },
      },
    },
  });
  if (!row) return null;

  const [user, domain] = row.customerEmail.split("@");
  return {
    ...row,
    customerEmail: domain ? `${user.slice(0, 2)}${"•".repeat(4)}@${domain}` : "",
  };
}

export async function getPublishedOfferSlugs(): Promise<string[]> {
  const rows = await prisma.offer.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}

export async function getDestinations(onlyFeatured = false): Promise<Destination[]> {
  const rows = await prisma.destination.findMany({
    where: onlyFeatured ? { featured: true } : {},
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return rows.map(toDestination);
}

function toDestination(row: {
  slug: string;
  name: string;
  country: string;
  continent: string;
  region: string;
  blurb: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCreditUrl: string;
  fromPrice: number;
  offersCount: number;
}): Destination {
  return {
    slug: row.slug,
    name: row.name,
    country: row.country,
    continent: row.continent || continentOf(row.country),
    region: row.region,
    blurb: row.blurb,
    imageSeed: row.slug,
    // Le visuel vient de la base (Cloudinary) ; à défaut, un placeholder local
    // plutôt qu'un service d'images distant.
    image: withMediaFallback(row.imageUrl),
    imageAlt: row.imageAlt || row.name,
    imageCredit: row.imageCredit,
    imageCreditUrl: row.imageCreditUrl,
    fromPrice: row.fromPrice,
    offersCount: row.offersCount,
  };
}

/**
 * Hub Destinations : continent, puis destinations, dans l'ordre du cahier.
 *
 * Les continents vides ne sont pas rendus : une rubrique « Océanie » sans une
 * seule offre derrière déçoit plus qu'elle ne promet. L'ordre suit celui de
 * `CONTINENTS`, l'Europe d'abord, la cible étant française à plus de la moitié.
 */
export async function getDestinationTree(): Promise<
  { id: string; label: string; destinations: Destination[] }[]
> {
  const rows = await prisma.destination.findMany({
    orderBy: [{ offersCount: "desc" }, { name: "asc" }],
  });
  const destinations = rows.map(toDestination);

  return CONTINENTS.map((continent) => ({
    id: continent.id,
    label: continent.label,
    destinations: destinations.filter((d) => d.continent === continent.label),
  })).filter((continent) => continent.destinations.length > 0);
}

/** Une destination par son slug, pour sa page dédiée. */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const row = await prisma.destination.findUnique({ where: { slug } });
  return row ? toDestination(row) : null;
}

export async function getReviews(take = 6): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => ({
    author: row.author,
    city: row.city,
    score: row.score,
    date: row.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    trip: row.trip,
    text: row.text,
  }));
}

/** Avis publiés rattachés à une offre précise, pour sa fiche produit. */
export async function getOfferReviews(slug: string, take = 8): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { status: "published", offer: { slug } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => ({
    author: row.author,
    city: row.city,
    score: row.score,
    date: row.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    trip: row.trip,
    text: row.text,
  }));
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findFirst({ where: { slug, status: "published" } });
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}

export async function getPosts(take = 4): Promise<Post[]> {
  const rows = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    readingTime: row.readingTime,
    imageSeed: row.slug,
    image: withMediaFallback(row.imageUrl),
    imageAlt: row.imageAlt || row.title,
  }));
}

/**
 * Bandeaux de l'accueil : le back-office d'abord, le catalogue à défaut.
 *
 * Un bandeau composé dans `/admin/hero` l'emporte toujours : quand l'équipe
 * prend la main sur l'accroche, une génération automatique ne doit pas la
 * recouvrir. Tant qu'aucun n'est actif, les bandeaux sont construits depuis le
 * catalogue, avec la photo d'une offre réelle et son prix du jour — l'accueil
 * n'est donc jamais vide, et n'annonce jamais un tarif qui n'existe plus.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const composes = await listHeroSlides();
  if (composes.length > 0) {
    return composes.map((slide) => ({
      id: slide.id,
      kicker: slide.kicker,
      title: slide.title,
      // Un bandeau rédigé à la main porte un texte libre, pas un prix d'appel :
      // le carrousel n'affiche alors ni montant ni mention « par personne ».
      fromPrice: 0,
      detail: slide.text,
      href: slide.href,
      cta: slide.cta,
      image: slide.image,
      alt: slide.imageAlt,
    }));
  }

  return getCatalogueHeroSlides();
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({ where: { slug, active: true } });
}

/** Forme attendue par le moteur de recherche et la navigation (composants client). */
export type SearchCategory = {
  id: string;
  label: string;
  title: string;
  icon: string;
  blurb: string;
  accent: string;
  form: string[];
};

/**
 * Onglets du moteur de recherche.
 *
 * Seules les catégories `catalogue` y figurent : on ne cherche pas dans « Bons
 * Plans », qui est une sélection de prix, ni dans « Destinations », qui est un
 * hub. Y mettre les dix entrées du menu donnerait des onglets qui cherchent
 * dans les mêmes offres sous deux angles différents.
 */
export async function getSearchCategories(): Promise<SearchCategory[]> {
  const rows = await getCategories();
  return rows
    .filter((row) => row.kind === "catalogue")
    .map((row) => ({
      id: row.slug,
      label: row.label,
      title: row.title || row.label,
      icon: row.icon,
      blurb: row.blurb,
      accent: row.accent,
      // Stocké en une seule colonne au format « origin,destination,dates » pour
      // qu'ajouter un champ ne demande pas de table supplémentaire.
      form: row.formFields.split(",").map((field) => field.trim()).filter(Boolean),
    }));
}

/** Entrée de menu, telle que la consomment l'en-tête et le pied de page. */
export type NavCategory = {
  id: string;
  label: string;
  title: string;
  icon: string;
  blurb: string;
  href: string;
  /** Formules réellement proposées dans cette catégorie, avec leur volume. */
  subcategories: NavSubcategory[];
};

export type NavSubcategory = {
  id: string;
  label: string;
  blurb: string;
  href: string;
  count: number;
};

/**
 * Sous-catégories du menu, déduites des offres publiées.
 *
 * Elles ne sont pas déclarées à la main : le menu liste ce que le catalogue
 * contient vraiment, avec le nombre d'offres derrière. Une formule qui n'a plus
 * d'offre disparaît d'elle-même, et personne ne clique sur une page vide.
 *
 * Une sous-catégorie n'a jamais d'URL propre : c'est un filtre sur la page de
 * sa catégorie, `/sejours?formule=tout_compris`. Le cahier l'impose, pour que
 * « Vol + Hôtel » ne se mette pas à concurrencer « Séjours » sur les moteurs.
 */
async function subcategoriesByCategory(): Promise<Map<string, NavSubcategory[]>> {
  const lignes = await prisma.offer.groupBy({
    by: ["categoryId", "subtype"],
    where: { status: "published", category: { active: true }, subtype: { not: "" } },
    _count: { _all: true },
  });

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const slugParId = new Map(categories.map((c) => [c.id, c.slug]));

  const parCategorie = new Map<string, NavSubcategory[]>();
  for (const ligne of lignes) {
    const slug = slugParId.get(ligne.categoryId);
    const label = subtypeLabel(ligne.subtype);
    // Un sous-type inconnu des constantes n'est pas rendu : il viendrait d'une
    // saisie libre, et afficherait un intitulé brut dans le menu.
    if (!slug || !label) continue;
    const liste = parCategorie.get(slug) ?? [];
    liste.push({
      id: ligne.subtype,
      label,
      blurb: subtypeBlurb(ligne.subtype),
      href: `/${slug}?formule=${ligne.subtype}`,
      count: ligne._count._all,
    });
    parCategorie.set(slug, liste);
  }

  for (const liste of parCategorie.values()) {
    liste.sort(
      (a, b) => SUBTYPE_ORDER.indexOf(a.id) - SUBTYPE_ORDER.indexOf(b.id),
    );
  }
  return parCategorie;
}

/**
 * Navigation principale et débordement.
 *
 * Le menu s'arrête à dix entrées : au-delà, le choix ralentit et la conversion
 * baisse. Les catégories marquées `isOverflow` passent donc sous « Voir plus de
 * voyages », sans rien perdre de leur visibilité pour les moteurs, qui suivent
 * les liens dans les deux cas.
 */
export async function getNavigation(): Promise<{
  main: NavCategory[];
  overflow: NavCategory[];
}> {
  const [rows, sousCategories] = await Promise.all([
    getCategories(),
    subcategoriesByCategory(),
  ]);
  const toNav = (row: (typeof rows)[number]): NavCategory => ({
    id: row.slug,
    label: row.label,
    title: row.title || row.label,
    icon: row.icon,
    blurb: row.blurb,
    href: `/${row.slug}`,
    subcategories: sousCategories.get(row.slug) ?? [],
  });
  return {
    main: rows.filter((row) => !row.isOverflow).slice(0, 10).map(toNav),
    overflow: rows.filter((row) => row.isOverflow).map(toNav),
  };
}

/**
 * Réglages consommés par l'en-tête et le pied de page, avec repli sur les
 * valeurs de marque si la clé n'a jamais été renseignée au back-office.
 */
export async function getSiteSettings() {
  const settings = await getSettings();
  return {
    // Repli sur les constantes de marque plutôt que sur des littéraux
    // recopiés : un réglage vidé au back-office ne doit pas ressusciter un
    // ancien numéro resté ici.
    name: settings["site.name"] || BRAND.name,
    tagline: settings["site.tagline"] || BRAND.tagline,
    phone: settings["site.phone"] || BRAND.phone,
    // Contrairement aux autres, la clé WhatsApp n'a pas de repli de marque :
    // un bouton qui ouvre une conversation sur un numéro non surveillé coûte
    // plus cher qu'un bouton absent. Vide, il ne s'affiche pas.
    whatsapp: settings["site.whatsapp"] ?? BRAND.whatsapp,
    email: settings["site.email"] || BRAND.email,
  };
}

/**
 * Coordonnées du virement bancaire.
 *
 * Aucune valeur de repli : sans IBAN renseigné au back-office, le virement
 * n'est tout simplement pas proposé. Mieux vaut un moyen de paiement absent
 * qu'un RIB erroné, qui envoie l'argent d'un client on ne sait où.
 *
 * Cette fonction est appelée sur la confirmation d'un dossier réglé par
 * virement, jamais sur une page publique : un IBAN affiché en clair sur un
 * site ouvert se retrouve dans les campagnes de faux virements.
 */
export async function getBankDetails(): Promise<{
  holder: string;
  iban: string;
  bic: string;
} | null> {
  const settings = await getSettings();
  const iban = (settings["payment.iban"] ?? "").trim();
  if (!iban) return null;
  return {
    holder: (settings["payment.holder"] ?? "").trim(),
    iban,
    bic: (settings["payment.bic"] ?? "").trim(),
  };
}

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

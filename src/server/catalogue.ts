import "server-only";
import { prisma } from "@/server/prisma";
import { BRAND } from "@/lib/data";
import { withMediaFallback } from "@/lib/media";
import type { CategoryId, Destination, HeroSlide, Offer, Post, Review } from "@/lib/types";

/**
 * Lecture du catalogue pour le site public.
 *
 * Les fonctions rendent exactement les formes déjà consommées par les
 * composants (`Offer`, `Destination`, `Review`…), pour que le passage du
 * catalogue statique à la base ne demande aucune réécriture d'affichage.
 */

type OfferRow = {
  slug: string;
  title: string;
  destination: string;
  country: string;
  region: string;
  departureCity: string;
  nights: number;
  stars: number;
  board: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviewsCount: number;
  dates: string;
  description: string;
  tags: string[];
  amenities: string[];
  highlights: string[];
  included: string[];
  category: { slug: string };
  images: { url: string }[];
};

function toOffer(row: OfferRow): Offer {
  const urls = row.images.map((image) => image.url);
  return {
    slug: row.slug,
    category: row.category.slug as CategoryId,
    title: row.title,
    destination: row.destination,
    country: row.country,
    region: row.region,
    // Conservé pour le repli : une offre créée au back-office sans visuel
    // affiche un placeholder déterministe plutôt qu'un cadre vide.
    imageSeed: row.slug,
    image: urls[0],
    images: urls,
    nights: row.nights,
    stars: row.stars,
    board: row.board as Offer["board"],
    departureCity: row.departureCity,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    rating: row.rating,
    reviews: row.reviewsCount,
    dates: row.dates,
    tags: row.tags,
    amenities: row.amenities,
    description: row.description,
    highlights: row.highlights,
    included: row.included,
  };
}

const OFFER_SELECT = {
  slug: true,
  title: true,
  destination: true,
  country: true,
  region: true,
  departureCity: true,
  nights: true,
  stars: true,
  board: true,
  price: true,
  oldPrice: true,
  rating: true,
  reviewsCount: true,
  dates: true,
  description: true,
  tags: true,
  amenities: true,
  highlights: true,
  included: true,
  category: { select: { slug: true } },
  images: { select: { url: true }, orderBy: { position: "asc" } },
} as const;

export async function getOffers(categorySlug?: string): Promise<Offer[]> {
  const rows = await prisma.offer.findMany({
    where: {
      status: "published",
      // Désactiver un type de voyage au back-office doit suffire à retirer ses
      // offres du site, sans avoir à les dépublier une par une.
      category: { active: true, ...(categorySlug ? { slug: categorySlug } : {}) },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    select: OFFER_SELECT,
  });
  return rows.map(toOffer);
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

/** Meilleures remises : le tri se fait en mémoire, la remise étant calculée. */
export async function getBestDeals(take = 8): Promise<Offer[]> {
  const offers = await getOffers();
  return offers
    .filter((offer) => offer.oldPrice && offer.oldPrice > offer.price)
    .sort(
      (a, b) =>
        (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!,
    )
    .slice(0, take);
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
      offer: { select: { slug: true, title: true, destination: true, country: true } },
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
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    country: row.region || row.country,
    imageSeed: row.slug,
    image: withMediaFallback(row.imageUrl),
    imageAlt: row.imageAlt || row.name,
    fromPrice: row.fromPrice,
    offersCount: row.offersCount,
  }));
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

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const rows = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    kicker: row.kicker,
    title: row.title,
    text: row.text,
    href: row.href,
    cta: row.cta,
    image: withMediaFallback(row.imageUrl),
    imageAlt: row.imageAlt || row.title,
    position: row.position,
  }));
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

/** Forme attendue par le moteur de recherche et la navigation (composants client). */
export type SearchCategory = {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  form: string[];
};

export async function getSearchCategories(): Promise<SearchCategory[]> {
  const rows = await getCategories();
  return rows.map((row) => ({
    id: row.slug,
    label: row.label,
    icon: row.icon,
    blurb: row.blurb,
    // Stocké en une seule colonne au format « origin,destination,dates » pour
    // qu'ajouter un champ ne demande pas de table supplémentaire.
    form: row.formFields.split(",").map((field) => field.trim()).filter(Boolean),
  }));
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
    email: settings["site.email"] || BRAND.email,
  };
}

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

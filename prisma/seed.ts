/**
 * Remplit la base à partir du catalogue source (src/lib/catalogue-source.ts).
 *
 *   npm run db:seed
 *
 * Le script est idempotent : il peut être relancé sans créer de doublons. Les
 * enregistrements existants sont mis à jour, sauf le mot de passe de
 * l'administrateur, qui n'est jamais réécrit une fois le compte créé, et les
 * numéros de référence des offres, qui ne sont jamais réattribués.
 *
 * Aucun appel réseau ici : les photographies sont résolues en amont par
 * `npm run photos`, qui écrit src/lib/media/photos.json. Deux installations du
 * projet produisent donc exactement le même catalogue.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { CATEGORIES, POSTS, REVIEWS, BRAND, continentOf } from "../src/lib/data";
import {
  DESTINATIONS,
  OFFERS,
  REFERENCE_PRICE_SOURCE,
} from "../src/lib/catalogue-source";
import { creditFor, photoFor, photoQueryFor, photosFor } from "../src/lib/media/photos";
import { photo } from "../src/lib/format";
import {
  OFFER_REFERENCE_COUNTER,
  OFFER_REFERENCE_START,
  offerReference,
} from "../src/lib/reference";
import { hashPassword } from "../src/server/auth";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL est absente.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});

const HERO_SLIDES = [
  {
    kicker: "Ventes flash jusqu'à dimanche",
    title: "Une semaine au soleil à partir de 419 €",
    text: "Séjours tout compris en Méditerranée, vol et transferts inclus.",
    href: "/sejours",
    cta: "Voir les séjours",
    imageSeed: "hero-mediterranee",
    imageAlt: "Séjour en Méditerranée",
  },
  {
    kicker: "Croisières",
    title: "Embarquez pour 8 jours en pension complète",
    text: "Méditerranée, Canaries ou fjords : cabine extérieure sans supplément.",
    href: "/croisieres",
    cta: "Découvrir les croisières",
    imageSeed: "hero-croisiere",
    imageAlt: "Croisière au large",
  },
  {
    kicker: "Circuits accompagnés",
    title: "Le Japon, l'Islande ou le Pérou avec un guide francophone",
    text: "Itinéraires clés en main, groupes limités, entrées des sites incluses.",
    href: "/circuits",
    cta: "Choisir un circuit",
    imageSeed: "hero-circuits",
    imageAlt: "Circuit accompagné à l'étranger",
  },
];

/**
 * Date de départ à J+N, fixée à midi.
 *
 * Elle est calculée au moment du seed et non figée dans le catalogue : le badge
 * « Dernière minute » se déclenche à moins de 21 jours du départ, donc des
 * dates écrites en dur cesseraient de le déclencher dès le lendemain. Midi
 * plutôt que minuit : le décalage horaire ne fait alors jamais basculer la date
 * affichée d'un jour.
 */
function departureFrom(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Vrai une seule fois par catégorie, à la première offre rencontrée.
 *
 * Sert à la mise en avant sur l'accueil : le carrousel montre alors un séjour,
 * un circuit, une croisière, un vol, plutôt que les six premières lignes du
 * catalogue, toutes de la même famille.
 */
const categoriesDejaMisesEnAvant = new Set<string>();
function premiereDeSaCategorie(category: string): boolean {
  if (categoriesDejaMisesEnAvant.has(category)) return false;
  categoriesDejaMisesEnAvant.add(category);
  return true;
}

/**
 * Reprise de l'ancienne arborescence vers celle du cahier de catégorisation.
 *
 * Les catégories sont renommées plutôt que recréées : les offres gardent leur
 * rattachement, leur slug et leurs avis. Deux fusions demandent un traitement
 * particulier, Camping et Escapades devenant une seule catégorie.
 *
 * Sans effet sur une base déjà à jour ou toute neuve.
 */
async function migrateLegacyCategories() {
  const renames: [from: string, to: string][] = [
    ["vol-hotel", "sejours"],
    ["voitures", "location-voiture"],
    ["campings", "camping-escapades"],
  ];

  for (const [from, to] of renames) {
    const ancienne = await prisma.category.findUnique({ where: { slug: from } });
    if (!ancienne) continue;
    const cible = await prisma.category.findUnique({ where: { slug: to } });
    if (cible) {
      // La cible existe déjà : on déplace les offres au lieu de renommer, sinon
      // le slug unique refuserait la mise à jour.
      await prisma.offer.updateMany({
        where: { categoryId: ancienne.id },
        data: { categoryId: cible.id },
      });
      await prisma.category.delete({ where: { id: ancienne.id } });
    } else {
      await prisma.category.update({ where: { id: ancienne.id }, data: { slug: to } });
    }
    console.log(`  ${from} → ${to}`);
  }

  // Escapades rejoint Camping & Escapades, qui existe forcément à ce stade :
  // soit renommé ci-dessus, soit créé par l'upsert qui suit.
  const escapades = await prisma.category.findUnique({ where: { slug: "escapades" } });
  if (escapades) {
    const cible = await prisma.category.upsert({
      where: { slug: "camping-escapades" },
      update: {},
      create: {
        slug: "camping-escapades",
        label: "Camping & Escapades",
        icon: "tent",
        formFields: "destination,dates,travellers",
      },
    });
    await prisma.offer.updateMany({
      where: { categoryId: escapades.id },
      data: { categoryId: cible.id },
    });
    await prisma.category.delete({ where: { id: escapades.id } });
    console.log("  escapades → camping-escapades");
  }
}

async function main() {
  console.log("Reprise de l'arborescence…");
  await migrateLegacyCategories();

  console.log("Catégories…");
  for (const [index, category] of CATEGORIES.entries()) {
    const data = {
      label: category.label,
      title: category.title ?? "",
      icon: category.icon,
      blurb: category.blurb,
      kind: category.kind,
      rule: category.rule ?? "",
      isOverflow: category.isOverflow ?? false,
      showDiscountPercent: category.showDiscountPercent ?? false,
      accent: category.accent ?? "navy",
      formFields: category.form.join(","),
      position: index,
    };
    await prisma.category.upsert({
      where: { slug: category.id },
      update: data,
      create: { slug: category.id, ...data },
    });
  }

  console.log("Destinations…");
  for (const [index, destination] of DESTINATIONS.entries()) {
    const existing = await prisma.destination.findUnique({
      where: { slug: destination.slug },
      select: {
        imageUrl: true,
        imageId: true,
        imageAlt: true,
        imageCredit: true,
        imageCreditUrl: true,
      },
    });
    const visuel = photoFor(destination.photo);
    // Le back-office peut avoir remplacé le visuel : le seed ne réécrit jamais
    // une image posée par l'équipe, il ne comble que ce qui manque. Le crédit
    // suit l'image qu'il accompagne, jamais une autre.
    //
    // Repli sur un visuel neutre si la recherche d'images n'a rien rendu :
    // une destination sans photo passe mieux avec un cadre coloré qu'avec un
    // trou dans la grille.
    const media = existing?.imageUrl
      ? {
          imageUrl: existing.imageUrl,
          imageId: existing.imageId,
          imageAlt: existing.imageAlt || destination.name,
          imageCredit: existing.imageCredit,
          imageCreditUrl: existing.imageCreditUrl,
        }
      : {
          imageUrl: visuel?.url ?? photo(destination.slug, 800, 600),
          imageId: "",
          imageAlt: destination.name,
          imageCredit: visuel ? creditFor(visuel) : "",
          imageCreditUrl: visuel?.page ?? "",
        };

    const data = {
      name: destination.name,
      country: destination.country,
      continent: continentOf(destination.country),
      region: destination.region,
      blurb: destination.blurb,
      ...media,
      featured: destination.featured ?? false,
      origin: "catalogue",
      position: index,
      // `fromPrice` et `offersCount` ne sont pas repris du catalogue : ils sont
      // recalculés en fin de seed depuis les offres réellement publiées. Un
      // compteur éditorial qui annonce 1 800 offres devant une page qui en
      // montre huit coûte plus de crédibilité qu'il n'en apporte.
    };
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      update: data,
      create: { slug: destination.slug, ...data },
    });
  }

  const categoriesBySlug = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  console.log("Offres…");

  // Les numéros de référence sont réservés en un seul appel, pour les seules
  // offres qui n'en ont pas encore : relancer le seed ne renumérote donc rien,
  // et le compteur ne redescend jamais.
  const dejaEnBase = new Map(
    (
      await prisma.offer.findMany({ select: { slug: true, reference: true } })
    ).map((o) => [o.slug, o.reference]),
  );
  const aNumeroter = OFFERS.filter((o) => !dejaEnBase.get(o.slug));
  const numeros = new Map<string, string>();
  if (aNumeroter.length > 0) {
    const compteur = await prisma.counter.upsert({
      where: { key: OFFER_REFERENCE_COUNTER },
      create: { key: OFFER_REFERENCE_COUNTER, value: OFFER_REFERENCE_START + aNumeroter.length },
      update: { value: { increment: aNumeroter.length } },
      select: { value: true },
    });
    const premier = compteur.value - aNumeroter.length + 1;
    aNumeroter.forEach((offer, rang) => {
      numeros.set(offer.slug, offerReference(premier + rang));
    });
    console.log(`  ${aNumeroter.length} référence(s) attribuée(s).`);
  }

  // Rattachement d'une offre à une destination du hub : la ville d'abord, le
  // pays à défaut. C'est ce lien qui alimente « 12 offres au Maroc » et le prix
  // d'appel de chaque page destination.
  const destinationsEnBase = await prisma.destination.findMany({
    select: { id: true, name: true, country: true },
  });
  const parVille = new Map(destinationsEnBase.map((d) => [d.name.toLowerCase(), d.id]));
  const parPays = new Map<string, string>();
  for (const d of destinationsEnBase) {
    // Une destination pays porte le nom du pays ; les destinations villes ne
    // doivent pas prendre la place du pays dans cet index.
    if (d.name.toLowerCase() === d.country.toLowerCase()) {
      parPays.set(d.country.toLowerCase(), d.id);
    }
  }
  function destinationPour(offer: (typeof OFFERS)[number]): string | null {
    return (
      parVille.get(offer.destination.toLowerCase()) ??
      parPays.get(offer.country.toLowerCase()) ??
      null
    );
  }

  for (const [index, offer] of OFFERS.entries()) {
    const categoryId = categoriesBySlug.get(offer.category);
    if (!categoryId) continue;

    const data = {
      categoryId,
      subtype: offer.subtype ?? "",
      destinationId: destinationPour(offer),
      title: offer.title,
      destination: offer.destination,
      country: offer.country,
      region: offer.region,
      continent: offer.continent ?? "",
      departureCity: offer.departureCity,
      days: offer.days ?? offer.nights + 1,
      nights: offer.nights,
      stars: offer.stars,
      board: offer.board,
      price: offer.price,
      oldPrice: offer.oldPrice ?? null,
      referencePriceSource: offer.oldPrice ? REFERENCE_PRICE_SOURCE : "",
      rating: offer.rating,
      reviewsCount: offer.reviews,
      departureDate: departureFrom(offer.departureInDays),
      dates: offer.dates,
      description: offer.description,
      tags: offer.tags,
      amenities: offer.amenities,
      highlights: offer.highlights,
      included: offer.included,
      status: "published",
      origin: "catalogue",
      // Mise en avant : une offre par catégorie du catalogue, la première
      // rencontrée. L'accueil montre ainsi la largeur de l'offre plutôt que
      // six séjours balnéaires à la suite.
      featured: premiereDeSaCategorie(offer.category),
      position: index,
    };

    const reference = dejaEnBase.get(offer.slug) || numeros.get(offer.slug);
    if (!reference) continue;

    const saved = await prisma.offer.upsert({
      where: { slug: offer.slug },
      update: data,
      create: { slug: offer.slug, reference, ...data },
    });

    // La galerie est réalignée sur le catalogue source à chaque passage : sans
    // cela, une amélioration de la sélection de photos ne serait jamais reprise
    // sur les offres déjà en base.
    //
    // Seuls les visuels que le seed a lui-même posés sont remplacés, reconnus à
    // leur hébergeur. Un fichier téléversé depuis le back-office, sur Cloudinary
    // ou dans /uploads, n'est jamais touché : il l'emporte sur le catalogue.
    await prisma.offerImage.deleteMany({
      where: {
        offerId: saved.id,
        OR: [
          { url: { startsWith: "https://upload.wikimedia.org/" } },
          { url: { startsWith: "https://picsum.photos/" } },
        ],
      },
    });

    const restantes = await prisma.offerImage.count({ where: { offerId: saved.id } });
    if (restantes === 0) {
      const visuels = photosFor(photoQueryFor(offer), 5);
      await prisma.offerImage.createMany({
        data:
          visuels.length > 0
            ? visuels.map((visuel, i) => ({
                offerId: saved.id,
                url: visuel.url,
                // L'alt décrit ce que la photo montre vraiment, le lieu, et non
                // le produit : c'est une vue de la destination, pas de l'hôtel.
                alt: `${offer.destination}, ${offer.country}`,
                credit: creditFor(visuel),
                creditUrl: visuel.page,
                position: i,
              }))
            : Array.from({ length: 3 }, (_, i) => ({
                offerId: saved.id,
                url: photo(`${offer.slug}${i === 0 ? "" : `-${i}`}`, 800, 600),
                alt: `${offer.destination}, ${offer.country}`,
                position: i,
              })),
      });
    }
  }

  // Offres du catalogue qui n'y figurent plus : elles sont retirées, sinon la
  // base garderait indéfiniment les lignes d'anciennes versions. Seules celles
  // marquées `catalogue` sont concernées : une offre saisie au back-office
  // survit à tous les `db:seed`.
  const slugsSource = new Set(OFFERS.map((o) => o.slug));
  const perimees = await prisma.offer.findMany({
    where: { origin: "catalogue" },
    select: { id: true, slug: true, images: { select: { publicId: true } } },
  });
  const aRetirer = perimees.filter((o) => !slugsSource.has(o.slug));
  if (aRetirer.length > 0) {
    // Les réservations passent en `offerId: null` (SetNull) : l'historique du
    // client reste lisible, avec le montant et la référence de son dossier.
    await prisma.offer.deleteMany({ where: { id: { in: aRetirer.map((o) => o.id) } } });
    console.log(`  ${aRetirer.length} offre(s) hors catalogue retirée(s).`);
  }

  // Destinations du catalogue qui n'y figurent plus, et qui ne portent aucune
  // offre. La condition sur les offres est une sécurité : une destination
  // encore rattachée à des ventes reste, même retirée du catalogue source.
  const slugsDestinations = new Set(DESTINATIONS.map((d) => d.slug));
  const destinationsPerimees = await prisma.destination.findMany({
    where: { origin: "catalogue" },
    select: { id: true, slug: true, _count: { select: { offers: true } } },
  });
  const destinationsARetirer = destinationsPerimees.filter(
    (d) => !slugsDestinations.has(d.slug) && d._count.offers === 0,
  );
  if (destinationsARetirer.length > 0) {
    await prisma.destination.deleteMany({
      where: { id: { in: destinationsARetirer.map((d) => d.id) } },
    });
    console.log(`  ${destinationsARetirer.length} destination(s) hors catalogue retirée(s).`);
  }

  console.log("Compteurs des destinations…");
  // Nombre d'offres et prix d'appel recalculés depuis les offres publiées, pas
  // saisis à la main : la page destination annonce alors ce qu'elle contient.
  const destinationsARecalculer = await prisma.destination.findMany({ select: { id: true } });
  for (const { id } of destinationsARecalculer) {
    const stats = await prisma.offer.aggregate({
      where: { destinationId: id, status: "published" },
      _count: { _all: true },
      _min: { price: true },
    });
    await prisma.destination.update({
      where: { id },
      data: {
        offersCount: stats._count._all,
        fromPrice: stats._min.price ?? 0,
      },
    });
  }

  console.log("Avis…");
  const offersBySlug = await prisma.offer.findMany({ select: { id: true } });
  for (const [index, review] of REVIEWS.entries()) {
    const exists = await prisma.review.findFirst({
      where: { author: review.author, trip: review.trip },
    });
    if (exists) continue;
    await prisma.review.create({
      data: {
        author: review.author,
        city: review.city,
        score: review.score,
        text: review.text,
        trip: review.trip,
        status: "published",
        offerId: offersBySlug[index % offersBySlug.length]?.id ?? null,
      },
    });
  }

  console.log("Articles…");
  for (const post of POSTS) {
    const existing = await prisma.post.findUnique({
      where: { slug: post.slug },
      select: { imageUrl: true, imageId: true, imageAlt: true },
    });
    const seededImageUrl = existing?.imageUrl || photo(post.imageSeed, 800, 500);
    const seededImageId = existing?.imageId || "";
    const seededImageAlt = existing?.imageAlt || post.title;

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readingTime: post.readingTime,
        imageUrl: seededImageUrl,
        imageId: seededImageId,
        imageAlt: seededImageAlt,
        status: "published",
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readingTime: post.readingTime,
        imageUrl: seededImageUrl,
        imageId: seededImageId,
        imageAlt: seededImageAlt,
        status: "published",
      },
    });
  }

  console.log("Hero…");
  const heroCount = await prisma.heroSlide.count();
  if (heroCount === 0) {
    await prisma.heroSlide.createMany({
      data: HERO_SLIDES.map((slide, index) => ({
        kicker: slide.kicker,
        title: slide.title,
        text: slide.text,
        href: slide.href,
        cta: slide.cta,
        imageUrl: photo(slide.imageSeed, 1600, 700),
        imageAlt: slide.imageAlt,
        position: index,
        active: true,
      })),
    });
  }

  console.log("Réglages…");
  const settings: Record<string, string> = {
    "site.name": BRAND.name,
    "site.tagline": BRAND.tagline,
    "site.phone": BRAND.phone,
    "site.whatsapp": BRAND.whatsapp,
    "site.email": BRAND.email,
    "hero.title": "Où partez-vous ?",
    "hero.subtitle":
      "Vols, hôtels, croisières, circuits et campings : comparés et réservés en une seule fois.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("Espace client (compte de démonstration)…");
  await seedDemoCustomer();

  console.log("Administrateur…");
  const email = process.env.ADMIN_EMAIL ?? "admin@gosejour.fr";
  const password = process.env.ADMIN_PASSWORD ?? "gosejour2026";
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin) {
    console.log(`  compte déjà présent : ${email} (mot de passe inchangé)`);
  } else {
    await prisma.adminUser.create({
      data: {
        email,
        name: "Administrateur",
        passwordHash: hashPassword(password),
        role: "owner",
      },
    });
    console.log(`  compte créé : ${email}`);
  }

  const counts = {
    catégories: await prisma.category.count(),
    destinations: await prisma.destination.count(),
    offres: await prisma.offer.count(),
    images: await prisma.offerImage.count(),
    avis: await prisma.review.count(),
    articles: await prisma.post.count(),
  };
  console.log("Terminé :", counts);
}

/** Date décalée de `days` par rapport à aujourd'hui. */
function shift(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Compte client de démonstration et son historique.
 *
 * Il donne à l'espace client de quoi montrer tous ses états : un séjour
 * confirmé à venir avec paiement fractionné en cours, une demande en attente,
 * un voyage passé et une annulation. Comme le reste du seed, la fonction est
 * idempotente : relancée, elle met à jour au lieu de dupliquer.
 */
async function seedDemoCustomer() {
  const email = process.env.DEMO_CUSTOMER_EMAIL ?? "camille.durand@example.fr";
  const password = process.env.DEMO_CUSTOMER_PASSWORD ?? "gosejour2026";

  const customer = await prisma.customer.upsert({
    where: { email },
    update: { firstName: "Camille", lastName: "Durand", city: "Lyon", loyaltyPoints: 2460 },
    create: {
      email,
      firstName: "Camille",
      lastName: "Durand",
      phone: "06 12 34 56 78",
      city: "Lyon",
      passwordHash: hashPassword(password),
      newsletter: true,
      loyaltyPoints: 2460,
    },
  });

  // Les réservations pointent vers des offres du catalogue de démonstration ;
  // si l'une manque, la ligne est simplement ignorée.
  const wanted = [
    {
      reference: "GS-CRETE01",
      slug: "crete-heraklion",
      status: "confirmed",
      travellers: 2,
      insurance: true,
      instalments: 4,
      paymentMethod: "visa",
      paidRatio: 0.5,
      departure: shift(38),
      nights: 7,
    },
    {
      reference: "GS-MARRA02",
      slug: "marrakech-palmeraie",
      status: "pending",
      travellers: 2,
      insurance: false,
      instalments: 1,
      paymentMethod: "cb",
      paidRatio: 0,
      departure: shift(96),
      nights: 7,
    },
    {
      reference: "GS-LISBO03",
      slug: "lisbonne-alfama",
      status: "completed",
      travellers: 2,
      insurance: false,
      instalments: 1,
      paymentMethod: "paypal",
      paidRatio: 1,
      departure: shift(-124),
      nights: 4,
    },
    {
      reference: "GS-FJORD04",
      slug: "fjords-norvege",
      status: "cancelled",
      travellers: 2,
      insurance: true,
      instalments: 4,
      paymentMethod: "sepa",
      paidRatio: 0,
      departure: shift(-40),
      nights: 10,
    },
  ];

  for (const item of wanted) {
    const offer = await prisma.offer.findUnique({
      where: { slug: item.slug },
      select: { id: true, price: true },
    });
    if (!offer) continue;

    const insuranceCost = item.insurance ? Math.round(offer.price * 0.06) : 0;
    const totalPrice = item.travellers * (offer.price + insuranceCost);
    const returnDate = new Date(item.departure);
    returnDate.setDate(returnDate.getDate() + item.nights);

    const data = {
      offerId: offer.id,
      customerId: customer.id,
      customerName: "Camille Durand",
      customerEmail: email,
      customerPhone: "06 12 34 56 78",
      travellers: item.travellers,
      insurance: item.insurance,
      totalPrice,
      paidAmount: Math.round(totalPrice * item.paidRatio),
      instalments: item.instalments,
      paymentMethod: item.paymentMethod,
      departureDate: item.departure,
      returnDate,
      status: item.status,
    };

    await prisma.booking.upsert({
      where: { reference: item.reference },
      update: data,
      create: { reference: item.reference, ...data },
    });
  }

  // Quelques favoris, pour que la page ne soit pas vide à la première visite.
  for (const slug of ["japon-tokyo-kyoto-osaka", "punta-cana-bavaro", "escapade-prague"]) {
    const offer = await prisma.offer.findUnique({ where: { slug }, select: { id: true } });
    if (!offer) continue;
    await prisma.favourite.upsert({
      where: { customerId_offerId: { customerId: customer.id, offerId: offer.id } },
      update: {},
      create: { customerId: customer.id, offerId: offer.id },
    });
  }

  console.log(`  compte client : ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

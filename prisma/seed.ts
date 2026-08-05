/**
 * Remplit la base à partir du catalogue de démonstration (src/lib/data.ts).
 *
 *   npm run db:seed
 *
 * Le script est idempotent : il peut être relancé sans créer de doublons. Les
 * enregistrements existants sont mis à jour, sauf le mot de passe de
 * l'administrateur, qui n'est jamais réécrit une fois le compte créé.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import {
  CATEGORIES,
  DESTINATIONS,
  OFFERS,
  POSTS,
  REVIEWS,
  BRAND,
} from "../src/lib/data";
import { photo } from "../src/lib/format";
import { hashPassword } from "../src/server/auth";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL est absente.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});

async function main() {
  console.log("Catégories…");
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.id },
      update: {
        label: category.label,
        icon: category.icon,
        blurb: category.blurb,
        formFields: category.form.join(","),
        position: index,
      },
      create: {
        slug: category.id,
        label: category.label,
        icon: category.icon,
        blurb: category.blurb,
        formFields: category.form.join(","),
        position: index,
      },
    });
  }

  console.log("Destinations…");
  for (const [index, destination] of DESTINATIONS.entries()) {
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      update: {
        name: destination.name,
        region: destination.country,
        imageUrl: photo(destination.imageSeed, 800, 600),
        fromPrice: destination.fromPrice,
        offersCount: destination.offersCount,
        featured: index < 4,
        position: index,
      },
      create: {
        slug: destination.slug,
        name: destination.name,
        country: destination.name,
        region: destination.country,
        imageUrl: photo(destination.imageSeed, 800, 600),
        fromPrice: destination.fromPrice,
        offersCount: destination.offersCount,
        featured: index < 4,
        position: index,
      },
    });
  }

  const categoriesBySlug = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  console.log("Offres…");
  for (const [index, offer] of OFFERS.entries()) {
    const categoryId = categoriesBySlug.get(offer.category);
    if (!categoryId) continue;

    const data = {
      categoryId,
      title: offer.title,
      destination: offer.destination,
      country: offer.country,
      region: offer.region,
      departureCity: offer.departureCity,
      nights: offer.nights,
      stars: offer.stars,
      board: offer.board,
      price: offer.price,
      oldPrice: offer.oldPrice ?? null,
      rating: offer.rating,
      reviewsCount: offer.reviews,
      dates: offer.dates,
      description: offer.description,
      tags: offer.tags,
      amenities: offer.amenities,
      highlights: offer.highlights,
      included: offer.included,
      status: "published",
      featured: index < 6,
      position: index,
    };

    const saved = await prisma.offer.upsert({
      where: { slug: offer.slug },
      update: data,
      create: { slug: offer.slug, ...data },
    });

    // La galerie est régénérée à chaque passage pour rester alignée sur le
    // catalogue source ; les visuels téléversés depuis l'admin vivent, eux,
    // uniquement en base.
    const existing = await prisma.offerImage.count({ where: { offerId: saved.id } });
    if (existing === 0) {
      await prisma.offerImage.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          offerId: saved.id,
          url: photo(`${offer.imageSeed}${i === 0 ? "" : `-${i}`}`, 800, 600),
          alt: `${offer.title} — photo ${i + 1}`,
          position: i,
        })),
      });
    }
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
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readingTime: post.readingTime,
        imageUrl: photo(post.imageSeed, 800, 500),
        status: "published",
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readingTime: post.readingTime,
        imageUrl: photo(post.imageSeed, 800, 500),
        status: "published",
      },
    });
  }

  console.log("Réglages…");
  const settings: Record<string, string> = {
    "site.name": BRAND.name,
    "site.tagline": BRAND.tagline,
    "site.phone": BRAND.phone,
    "site.email": BRAND.email,
    "hero.title": "Où partez-vous ?",
    "hero.subtitle":
      "Vols, hôtels, croisières, circuits et campings — comparés et réservés en une seule fois.",
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
 * idempotente — relancée, elle met à jour au lieu de dupliquer.
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
  for (const slug of ["japon-essentiel", "punta-cana-bavaro", "escapade-prague"]) {
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

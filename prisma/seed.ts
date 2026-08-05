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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

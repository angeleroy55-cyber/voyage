import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  cloudinaryConfigured,
  uploadLocalImage,
  uploadRemoteImage,
} from "../src/server/media";
import { slugify } from "../src/lib/slug";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL est absente.");
if (!cloudinaryConfigured()) throw new Error("Cloudinary n'est pas configuré.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});

type Counters = { migrated: number; skipped: number; failed: number };

function isCloudinaryUrl(source: string): boolean {
  return source.includes("res.cloudinary.com");
}

async function migrateSource(input: {
  sourceUrl: string;
  folder: string;
  publicId: string;
}) {
  if (!input.sourceUrl) throw new Error("URL source absente.");
  if (isCloudinaryUrl(input.sourceUrl)) return null;

  if (input.sourceUrl.startsWith("/uploads/")) {
    return uploadLocalImage({
      absolutePath: path.join(process.cwd(), "public", input.sourceUrl),
      folder: input.folder,
      publicId: input.publicId,
    });
  }

  return uploadRemoteImage({
    sourceUrl: input.sourceUrl,
    folder: input.folder,
    publicId: input.publicId,
  });
}

async function migrateDestinations(counters: Counters) {
  const rows = await prisma.destination.findMany();
  for (const row of rows) {
    try {
      if (!row.imageUrl || isCloudinaryUrl(row.imageUrl) || row.imageId) {
        counters.skipped++;
        continue;
      }
      const stored = await migrateSource({
        sourceUrl: row.imageUrl,
        folder: "gosejour/destinations",
        publicId: row.slug,
      });
      if (!stored) {
        counters.skipped++;
        continue;
      }
      await prisma.destination.update({
        where: { id: row.id },
        data: { imageUrl: stored.url, imageId: stored.publicId },
      });
      counters.migrated++;
      console.log(`destination:${row.slug} -> ok`);
    } catch (error) {
      counters.failed++;
      console.error(`destination:${row.slug} -> erreur`, error);
    }
  }
}

async function migratePosts(counters: Counters) {
  const rows = await prisma.post.findMany();
  for (const row of rows) {
    try {
      if (!row.imageUrl || isCloudinaryUrl(row.imageUrl) || row.imageId) {
        counters.skipped++;
        continue;
      }
      const stored = await migrateSource({
        sourceUrl: row.imageUrl,
        folder: "gosejour/posts",
        publicId: row.slug,
      });
      if (!stored) {
        counters.skipped++;
        continue;
      }
      await prisma.post.update({
        where: { id: row.id },
        data: { imageUrl: stored.url, imageId: stored.publicId },
      });
      counters.migrated++;
      console.log(`post:${row.slug} -> ok`);
    } catch (error) {
      counters.failed++;
      console.error(`post:${row.slug} -> erreur`, error);
    }
  }
}

async function migrateOfferImages(counters: Counters) {
  const rows = await prisma.offerImage.findMany({
    include: { offer: { select: { slug: true } } },
    orderBy: [{ offerId: "asc" }, { position: "asc" }],
  });
  for (const row of rows) {
    try {
      if (!row.url || isCloudinaryUrl(row.url) || row.publicId) {
        counters.skipped++;
        continue;
      }
      const stored = await migrateSource({
        sourceUrl: row.url,
        folder: `gosejour/offers/${row.offer.slug}`,
        publicId: `${slugify(row.offer.slug) || "offer"}-${row.position + 1}`,
      });
      if (!stored) {
        counters.skipped++;
        continue;
      }
      await prisma.offerImage.update({
        where: { id: row.id },
        data: { url: stored.url, publicId: stored.publicId },
      });
      counters.migrated++;
      console.log(`offer:${row.offer.slug}#${row.position} -> ok`);
    } catch (error) {
      counters.failed++;
      console.error(`offer-image:${row.id} -> erreur`, error);
    }
  }
}

async function migrateHeroSlides(counters: Counters) {
  const rows = await prisma.heroSlide.findMany({ orderBy: { position: "asc" } });
  for (const row of rows) {
    try {
      if (!row.imageUrl || isCloudinaryUrl(row.imageUrl) || row.imageId) {
        counters.skipped++;
        continue;
      }
      const stored = await migrateSource({
        sourceUrl: row.imageUrl,
        folder: "gosejour/hero",
        publicId: `${row.position + 1}-${slugify(row.title) || "slide"}`,
      });
      if (!stored) {
        counters.skipped++;
        continue;
      }
      await prisma.heroSlide.update({
        where: { id: row.id },
        data: { imageUrl: stored.url, imageId: stored.publicId },
      });
      counters.migrated++;
      console.log(`hero:${row.position} -> ok`);
    } catch (error) {
      counters.failed++;
      console.error(`hero:${row.id} -> erreur`, error);
    }
  }
}

const counters: Counters = { migrated: 0, skipped: 0, failed: 0 };

await migrateDestinations(counters);
await migratePosts(counters);
await migrateOfferImages(counters);
await migrateHeroSlides(counters);

console.log(counters);
await prisma.$disconnect();

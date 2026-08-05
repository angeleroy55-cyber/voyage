import "server-only";
import { prisma } from "@/server/prisma";
import { photo } from "@/lib/format";
import type { CategoryId, Destination, Offer, Post, Review } from "@/lib/types";

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
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
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
    image: row.imageUrl || photo(row.slug, 800, 600),
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
    image: row.imageUrl || photo(row.slug, 800, 500),
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

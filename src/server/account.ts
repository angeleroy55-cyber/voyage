import "server-only";
import { prisma } from "@/server/prisma";
import { photo } from "@/lib/format";

/**
 * Lecture de l'espace client.
 *
 * Toutes les requêtes sont bornées par `customerId` : c'est le seul endroit où
 * le rattachement est exprimé, ce qui évite d'avoir à le vérifier dans chaque
 * page. Les formes renvoyées sont déjà celles attendues à l'affichage : les
 * pages ne manipulent jamais de ligne Prisma brute.
 */

const BOOKING_INCLUDE = {
  offer: {
    select: {
      slug: true,
      title: true,
      destination: true,
      country: true,
      nights: true,
      board: true,
      stars: true,
      departureCity: true,
      category: { select: { slug: true, label: true } },
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  },
} as const;

type BookingRow = Awaited<
  ReturnType<typeof prisma.booking.findMany<{ include: typeof BOOKING_INCLUDE }>>
>[number];

export type AccountBooking = ReturnType<typeof toBooking>;

/** Échéance du paiement fractionné. */
export type Instalment = {
  index: number;
  amount: number;
  dueDate: Date;
  paid: boolean;
};

function toBooking(row: BookingRow) {
  const offer = row.offer;
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    travellers: row.travellers,
    insurance: row.insurance,
    totalPrice: row.totalPrice,
    paidAmount: row.paidAmount,
    instalments: row.instalments,
    paymentMethod: row.paymentMethod,
    notes: row.notes,
    createdAt: row.createdAt,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    offer: offer
      ? {
          slug: offer.slug,
          title: offer.title,
          destination: offer.destination,
          country: offer.country,
          nights: offer.nights,
          board: offer.board,
          stars: offer.stars,
          departureCity: offer.departureCity,
          category: offer.category.slug,
          categoryLabel: offer.category.label,
          image: offer.images[0]?.url || photo(offer.slug, 600, 400),
        }
      : null,
    /** Reste à régler, jamais négatif même si un avoir dépasse le total. */
    remaining: Math.max(0, row.totalPrice - row.paidAmount),
    schedule: schedule(row),
  };
}

/**
 * Échéancier du règlement.
 *
 * Les mensualités sont calculées à partir de la date de commande, la dernière
 * absorbant l'arrondi pour que la somme retombe exactement sur le total.
 */
function schedule(row: BookingRow): Instalment[] {
  const count = Math.max(1, row.instalments);
  const base = Math.floor(row.totalPrice / count);
  let paidLeft = row.paidAmount;

  return Array.from({ length: count }, (_, index) => {
    const amount = index === count - 1 ? row.totalPrice - base * (count - 1) : base;
    const dueDate = new Date(row.createdAt);
    dueDate.setMonth(dueDate.getMonth() + index);

    const paid = paidLeft >= amount;
    if (paid) paidLeft -= amount;

    return { index: index + 1, amount, dueDate, paid };
  });
}

export async function getCustomer(customerId: string) {
  return prisma.customer.findUnique({ where: { id: customerId } });
}

export async function getBookings(customerId: string): Promise<AccountBooking[]> {
  const rows = await prisma.booking.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: BOOKING_INCLUDE,
  });
  return rows.map(toBooking);
}

export async function getBooking(
  customerId: string,
  reference: string,
): Promise<AccountBooking | null> {
  const row = await prisma.booking.findFirst({
    where: { reference, customerId },
    include: BOOKING_INCLUDE,
  });
  return row ? toBooking(row) : null;
}

export async function getFavourites(customerId: string) {
  const rows = await prisma.favourite.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      offer: {
        select: {
          slug: true,
          title: true,
          destination: true,
          country: true,
          price: true,
          oldPrice: true,
          rating: true,
          reviewsCount: true,
          nights: true,
          stars: true,
          board: true,
          status: true,
          category: { select: { slug: true } },
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
  });

  return rows.map((row) => ({
    addedAt: row.createdAt,
    offer: {
      slug: row.offer.slug,
      title: row.offer.title,
      destination: row.offer.destination,
      country: row.offer.country,
      price: row.offer.price,
      oldPrice: row.offer.oldPrice ?? undefined,
      rating: row.offer.rating,
      reviews: row.offer.reviewsCount,
      nights: row.offer.nights,
      stars: row.offer.stars,
      board: row.offer.board,
      category: row.offer.category.slug,
      image: row.offer.images[0]?.url || photo(row.offer.slug, 600, 400),
      /** Une offre dépubliée reste visible en favori, mais n'est plus réservable. */
      available: row.offer.status === "published",
    },
  }));
}

export async function getFavouriteSlugs(customerId: string): Promise<string[]> {
  const rows = await prisma.favourite.findMany({
    where: { customerId },
    select: { offer: { select: { slug: true } } },
  });
  return rows.map((row) => row.offer.slug);
}

/** Chiffres d'en-tête du tableau de bord. */
export async function getAccountSummary(customerId: string) {
  const bookings = await getBookings(customerId);
  const now = Date.now();

  const active = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = active
    .filter((b) => b.status !== "completed")
    .filter((b) => !b.departureDate || b.departureDate.getTime() >= now)
    .sort(
      (a, b) =>
        (a.departureDate?.getTime() ?? Infinity) - (b.departureDate?.getTime() ?? Infinity),
    );

  const [favourites, customer] = await Promise.all([
    prisma.favourite.count({ where: { customerId } }),
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { loyaltyPoints: true },
    }),
  ]);

  return {
    bookings,
    upcoming,
    nextTrip: upcoming[0] ?? null,
    counts: {
      total: bookings.length,
      upcoming: upcoming.length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      favourites,
    },
    /** Montant encore dû sur l'ensemble des séjours non annulés. */
    outstanding: active.reduce((total, booking) => total + booking.remaining, 0),
    spent: active.reduce((total, booking) => total + booking.paidAmount, 0),
    loyaltyPoints: customer?.loyaltyPoints ?? 0,
  };
}

/** Nombre de jours entiers d'ici à une date, négatif si elle est passée. */
export function daysUntil(date: Date): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

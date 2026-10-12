/**
 * Reprise des données pour le calendrier (octobre 2026), idempotente.
 *
 *   npx tsx scripts/backfill-calendar.mts           # simulation, n'écrit rien
 *   npx tsx scripts/backfill-calendar.mts --ecrire  # applique
 *
 * 1. `Offer.season` : renseignée pour les offres du catalogue source qui ont
 *    une saison (SEASON_BY_SLUG) et dont la colonne est encore vide. Une
 *    saison saisie au back-office n'est jamais écrasée.
 * 2. `Offer.departureDate` dépassée, ou non proposée par le calendrier : recalée avec la même logique que
 *    `refreshPastDepartures` (src/server/departures.ts), que le site applique
 *    ensuite tout seul à la lecture du catalogue.
 *
 * Aucune donnée client n'est lue ni écrite ici : seulement des offres.
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEPARTURE_OFFSETS, SEASON_BY_SLUG } from "../src/lib/catalogue-source";
import { isBookable, resolveBookingRules, startOfToday, toIsoDay } from "../src/lib/booking-rules";
import { nextDepartureFor } from "../src/lib/departures";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const write = process.argv.includes("--ecrire");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }),
});

const CALENDAR_FIELDS = {
  bookingLeadDays: true,
  bookingWindowMonths: true,
  excludedWeekdays: true,
  discountMinPct: true,
  discountMaxPct: true,
} as const;

try {
  // 1. Saisons.
  let seasons = 0;
  for (const [slug, season] of Object.entries(SEASON_BY_SLUG)) {
    const where = { slug, origin: "catalogue", season: "" };
    if (write) {
      const { count } = await prisma.offer.updateMany({ where, data: { season } });
      seasons += count;
    } else {
      seasons += await prisma.offer.count({ where });
    }
  }
  console.log(`Saisons à renseigner : ${seasons}`);

  // 2. Dates dépassées, ou que le calendrier de l'offre ne propose pas
  //    (au-delà de sa fenêtre, jour exclu, hors saison) : ces dernières ne
  //    sont déjà plus affichées, on leur rend une vraie prochaine date.
  const today = startOfToday();
  const all = await prisma.offer.findMany({
    select: {
      id: true,
      slug: true,
      position: true,
      nights: true,
      season: true,
      price: true,
      oldPrice: true,
      departureDate: true,
      ...CALENDAR_FIELDS,
      category: { select: { slug: true, ...CALENDAR_FIELDS } },
    },
  });

  const rulesOfRow = (offer: (typeof all)[number]) => {
    // En simulation, la saison n'est pas encore en base : on la prend dans le
    // catalogue source pour montrer la date qui sera réellement écrite.
    const season = offer.season || (write ? "" : (SEASON_BY_SLUG[offer.slug] ?? ""));
    return resolveBookingRules({
      categorySlug: offer.category.slug,
      category: offer.category,
      offer: { ...offer, season },
    });
  };
  const stale = all.filter(
    (offer) => !offer.departureDate || !isBookable(toIsoDay(offer.departureDate), rulesOfRow(offer), today),
  );
  const past = stale.filter((offer) => offer.departureDate && offer.departureDate < today).length;
  console.log(
    `Dates à recaler : ${stale.length} (dont ${past} dépassées, ${stale.length - past} non proposées par le calendrier)`,
  );

  for (const offer of stale) {
    const rules = rulesOfRow(offer);
    const next = nextDepartureFor({ rules, position: offer.position, offsets: DEPARTURE_OFFSETS, today });
    if (write) {
      await prisma.offer.update({ where: { id: offer.id }, data: { departureDate: next } });
    }
    if (stale.indexOf(offer) < 8) {
      console.log(
        `  ${offer.slug} : ${offer.departureDate ? toIsoDay(offer.departureDate) : "-"} → ${next ? toIsoDay(next) : "aucune"}`,
      );
    }
  }
  console.log(write ? "Écritures appliquées." : "Simulation : rien n'a été écrit (ajouter --ecrire).");
} finally {
  await prisma.$disconnect();
}

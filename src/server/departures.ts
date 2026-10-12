import "server-only";
import { prisma } from "@/server/prisma";
import { resolveBookingRules, startOfToday } from "@/lib/booking-rules";
import { nextDepartureFor } from "@/lib/departures";
import { DEPARTURE_OFFSETS } from "@/lib/catalogue-source";

/**
 * Remise à jour des dates de départ dépassées.
 *
 * `Offer.departureDate` est une date figée au moment du seed ou de la saisie :
 * sans intervention, elle finit par passer, et l'offre s'affiche « Départ le
 * 12/07/2026 », sort des filtres de saison et des listings Dernière Minute
 * alors que son calendrier propose des dizaines de dates. Plutôt qu'une tâche
 * planifiée à installer à part, la remise à jour se fait à la lecture du
 * catalogue, au plus une fois toutes les 6 heures par processus : une seule
 * requête indexée (`status, departureDate`) quand rien n'est à faire.
 *
 * L'affichage ne dépend pas de ce rattrapage pour être juste : le lecteur du
 * catalogue écarte déjà toute date passée (`upcomingDepartureIso`). Ceci sert
 * à rendre à l'offre une vraie prochaine date, et ses badges.
 */

const INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastRun = 0;
let running: Promise<number> | null = null;

const CALENDAR_FIELDS = {
  bookingLeadDays: true,
  bookingWindowMonths: true,
  excludedWeekdays: true,
  discountMinPct: true,
  discountMaxPct: true,
} as const;

/** Recale toutes les dates dépassées ; rend le nombre d'offres mises à jour. */
export async function refreshPastDepartures(today: Date = startOfToday()): Promise<number> {
  const stale = await prisma.offer.findMany({
    where: { departureDate: { lt: today } },
    select: {
      id: true,
      position: true,
      nights: true,
      season: true,
      price: true,
      oldPrice: true,
      ...CALENDAR_FIELDS,
      category: { select: { slug: true, ...CALENDAR_FIELDS } },
    },
  });

  for (const offer of stale) {
    const rules = resolveBookingRules({
      categorySlug: offer.category.slug,
      category: offer.category,
      offer,
    });
    const departureDate = nextDepartureFor({
      rules,
      position: offer.position,
      offsets: DEPARTURE_OFFSETS,
      today,
    });
    await prisma.offer.update({ where: { id: offer.id }, data: { departureDate } });
  }
  return stale.length;
}

/**
 * Version appelée à la lecture : limitée dans le temps, jamais bloquante en
 * cas d'erreur (une base momentanément en lecture seule ne doit pas faire
 * tomber la page d'accueil).
 */
export async function ensureFreshDepartures(): Promise<void> {
  if (Date.now() - lastRun < INTERVAL_MS) return;
  if (!running) {
    lastRun = Date.now();
    running = refreshPastDepartures()
      .catch((error) => {
        console.error("Remise à jour des dates de départ impossible :", error);
        return 0;
      })
      .finally(() => {
        running = null;
      });
  }
  await running;
}

import {
  DEFAULT_DISCOUNT_MAX_PCT,
  DEFAULT_DISCOUNT_MIN_PCT,
  leadDaysFor,
  type PriceBand,
} from "@/lib/pricing";
import { inSeason, seasonById, seasonRange } from "@/lib/seasons";

/**
 * Règles de réservation d'une offre : quelles dates le calendrier propose, et
 * dans quelle fourchette de prix.
 *
 * Module pur (aucun accès base) : il est importé à la fois par le serveur, qui
 * résout les règles une fois à partir de la base et refuse une date hors règle
 * dans `createBooking`, et par le calendrier côté client, qui grise les mêmes
 * dates. Les deux côtés appellent les mêmes fonctions.
 *
 * Résolution, de la plus précise à la plus générale :
 *   réglage de l'offre  >  réglage de la catégorie  >  défaut du code ci-dessous.
 *
 * Fenêtre de réservation par défaut (aujourd'hui + délai minimum → + N mois) :
 *   - circuits, croisières : 12 mois. Ce sont les voyages qu'on prépare le
 *     plus tôt (congés à poser, départs de groupe, cabines limitées).
 *   - séjours, hôtels, vols : 9 mois, soit à peu près l'ouverture des
 *     programmes de vols des compagnies.
 *   - camping & escapades, parcs de loisirs, location de voiture : 6 mois.
 *   - long-courrier (9 nuits et plus) : +3 mois sur la valeur de la catégorie,
 *     plafonné à 12 mois, car ces voyages se réservent plus longtemps à l'avance.
 *     Ne s'applique pas quand l'offre a sa propre fenêtre.
 *   - offre saisonnière (`Offer.season`, ex. ski, Noël) : seules les dates de
 *     la saison sont proposées, et la fenêtre s'étend jusqu'à la fin de la
 *     prochaine occurrence de la saison (12 mois au plus) : un séjour d'été
 *     doit pouvoir se réserver dès l'automne.
 *
 * Disponibilité : aucun jour de semaine exclu par défaut. Au back-office, au
 * plus 3 jours de semaine peuvent être exclus : il reste alors 4 jours de
 * départ par semaine, soit au moins 16 dates sur tout mois complet, ce qui
 * respecte la règle « au moins 15 jours disponibles sur 30-31 ». Exception
 * assumée : le premier mois (délai minimum déjà écoulé) et les mois en bord de
 * saison d'une offre saisonnière.
 */

export const WINDOW_MIN_MONTHS = 3;
export const WINDOW_MAX_MONTHS = 12;
/** Plafond absolu, pour une offre saisonnière dont la saison est lointaine. */
export const SEASONAL_WINDOW_MAX_MONTHS = 12;
export const LEAD_MAX_DAYS = 30;
export const MAX_EXCLUDED_WEEKDAYS = 3;
/**
 * Bornes de la fourchette de remise réglable au back-office. Plus larges que
 * la politique par défaut (4 à 11 %) pour laisser la marge d'une vente flash
 * ou, à l'inverse, d'un tarif quasi aligné sur le marché.
 */
export const DISCOUNT_LIMIT_MIN_PCT = 3;
export const DISCOUNT_LIMIT_MAX_PCT = 20;
/** Seuil « long-courrier » en nuits. */
const LONG_HAUL_NIGHTS = 9;
const LONG_HAUL_EXTRA_MONTHS = 3;

export const CATEGORY_WINDOW_DEFAULTS: Record<string, number> = {
  circuits: 12,
  croisieres: 12,
  sejours: 9,
  hotels: 9,
  vols: 9,
  "camping-escapades": 6,
  "parcs-loisirs": 6,
  "location-voiture": 6,
};
const FALLBACK_WINDOW_MONTHS = 9;

/** Libellés des jours, index JavaScript (0 = dimanche). */
export const WEEKDAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

/** Réglages tels que stockés en base, sur `Category` comme sur `Offer`. */
export type CalendarSettings = {
  bookingLeadDays: number | null;
  bookingWindowMonths: number | null;
  excludedWeekdays: string | null;
  discountMinPct: number | null;
  discountMaxPct: number | null;
};

/** Règles résolues pour une offre : sérialisables, transmises au client. */
export type BookingRules = {
  leadDays: number;
  windowMonths: number;
  excludedWeekdays: number[];
  discountMinPct: number;
  discountMaxPct: number;
  /** Identifiant de saison (src/lib/seasons.ts), vide si vendue toute l'année. */
  season: string;
  /** Prix de référence concurrentiel, pour la fourchette de prix. */
  referencePrice: number | null;
  /** Prix plancher absolu (`Offer.priceFloor`), `null` si l'offre n'en a pas. */
  priceFloor: number | null;
};

/** « 1,3 » → [1, 3] : valeurs 0-6 seulement, sans doublon, 3 au plus. */
export function parseWeekdays(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const days = [
    ...new Set(
      raw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort();
  return days.slice(0, MAX_EXCLUDED_WEEKDAYS);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Fenêtre par défaut d'une catégorie (avant surcharge). */
export function defaultWindowMonths(categorySlug: string): number {
  return CATEGORY_WINDOW_DEFAULTS[categorySlug] ?? FALLBACK_WINDOW_MONTHS;
}

export function resolveBookingRules(input: {
  categorySlug: string;
  category: Partial<CalendarSettings> | null;
  offer: Partial<CalendarSettings> & {
    nights: number;
    season?: string | null;
    price: number;
    oldPrice: number | null;
    priceFloor?: number | null;
  };
}): BookingRules {
  const { categorySlug, category, offer } = input;

  const leadDays = clampInt(
    offer.bookingLeadDays ?? category?.bookingLeadDays ?? leadDaysFor(categorySlug),
    0,
    LEAD_MAX_DAYS,
  );

  let windowMonths: number;
  if (offer.bookingWindowMonths != null) {
    windowMonths = offer.bookingWindowMonths;
  } else {
    windowMonths = category?.bookingWindowMonths ?? defaultWindowMonths(categorySlug);
    if (offer.nights >= LONG_HAUL_NIGHTS) windowMonths += LONG_HAUL_EXTRA_MONTHS;
  }
  windowMonths = clampInt(windowMonths, WINDOW_MIN_MONTHS, WINDOW_MAX_MONTHS);

  // `null` sur l'offre = hérite ; chaîne vide = « aucun jour exclu » explicite.
  const weekdaysRaw =
    offer.excludedWeekdays != null ? offer.excludedWeekdays : (category?.excludedWeekdays ?? "");

  let discountMinPct = clampInt(
    offer.discountMinPct ?? category?.discountMinPct ?? DEFAULT_DISCOUNT_MIN_PCT,
    DISCOUNT_LIMIT_MIN_PCT,
    DISCOUNT_LIMIT_MAX_PCT,
  );
  let discountMaxPct = clampInt(
    offer.discountMaxPct ?? category?.discountMaxPct ?? DEFAULT_DISCOUNT_MAX_PCT,
    DISCOUNT_LIMIT_MIN_PCT,
    DISCOUNT_LIMIT_MAX_PCT,
  );
  if (discountMinPct > discountMaxPct) [discountMinPct, discountMaxPct] = [discountMaxPct, discountMinPct];

  return {
    leadDays,
    windowMonths,
    excludedWeekdays: parseWeekdays(weekdaysRaw),
    discountMinPct,
    discountMaxPct,
    season: offer.season && seasonById(offer.season) ? offer.season : "",
    // Une référence inférieure ou égale au prix n'est pas une référence
    // exploitable : la fourchette n'aurait aucun sens.
    referencePrice: offer.oldPrice && offer.oldPrice > 0 ? offer.oldPrice : null,
    priceFloor: offer.priceFloor && offer.priceFloor > 0 ? offer.priceFloor : null,
  };
}

/**
 * Règles d'une offre déjà chargée : celles résolues par le serveur, sinon les
 * défauts de sa catégorie (cas d'une offre construite hors base).
 */
export function rulesOf(offer: {
  category: string;
  nights: number;
  price: number;
  oldPrice?: number;
  season?: string;
  rules?: BookingRules;
}): BookingRules {
  return (
    offer.rules ??
    resolveBookingRules({
      categorySlug: offer.category,
      category: null,
      offer: {
        nights: offer.nights,
        season: offer.season,
        price: offer.price,
        oldPrice: offer.oldPrice ?? null,
      },
    })
  );
}

/** Paramètres à passer à `priceForDate` pour cette offre. */
export function priceBandOf(rules: BookingRules): PriceBand {
  return {
    referencePrice: rules.referencePrice,
    discountMinPct: rules.discountMinPct,
    discountMaxPct: rules.discountMaxPct,
    floorPrice: rules.priceFloor,
  };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Jour civil local au format `AAAA-MM-JJ`. */
export function toIsoDay(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Première et dernière date proposables, bornes incluses.
 *
 * `today` est passé en paramètre plutôt que lu ici, pour que le calendrier et
 * le serveur puissent raisonner sur la même journée de référence.
 */
export function bookingWindow(rules: BookingRules, today: Date = startOfToday()) {
  const first = new Date(today);
  first.setDate(first.getDate() + rules.leadDays);

  const last = new Date(today);
  last.setMonth(last.getMonth() + rules.windowMonths);

  const season = seasonById(rules.season);
  if (season) {
    // Occurrence de la saison en cours ou à venir au premier jour réservable.
    // Si elle a déjà commencé, elle peut s'achever dans quelques jours : on
    // vise alors aussi l'occurrence suivante, pour qu'une offre d'arrière-
    // saison reste réservable pour l'an prochain au lieu de n'offrir que deux
    // dates. Le tout reste plafonné à 12 mois.
    let { gte, lte } = seasonRange(season, first);
    if (gte < first) {
      const after = new Date(lte);
      after.setDate(after.getDate() + 1);
      ({ gte, lte } = seasonRange(season, after));
    }
    const cap = new Date(today);
    cap.setMonth(cap.getMonth() + SEASONAL_WINDOW_MAX_MONTHS);
    const seasonEnd = new Date(lte);
    seasonEnd.setHours(0, 0, 0, 0);
    if (seasonEnd > last) last.setTime(Math.min(seasonEnd.getTime(), cap.getTime()));
  }
  last.setHours(0, 0, 0, 0);
  return { first, last };
}

/** Raison pour laquelle une date n'est pas proposée, `null` si elle l'est. */
export function unavailableReason(
  iso: string,
  rules: BookingRules,
  today: Date = startOfToday(),
): "format" | "trop-tot" | "trop-tard" | "jour-exclu" | "hors-saison" | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "format";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "format";

  const { first, last } = bookingWindow(rules, today);
  if (date < first) return "trop-tot";
  if (date > last) return "trop-tard";
  if (rules.excludedWeekdays.includes(date.getDay())) return "jour-exclu";
  const season = seasonById(rules.season);
  if (season && !inSeason(new Date(`${iso}T12:00:00`), season)) return "hors-saison";
  return null;
}

export function isBookable(iso: string, rules: BookingRules, today?: Date): boolean {
  return unavailableReason(iso, rules, today) === null;
}

/** Première date réservable à partir de `from` (ou du premier jour ouvert). */
export function firstBookableDate(
  rules: BookingRules,
  today: Date = startOfToday(),
  from?: Date,
): string | null {
  const { first, last } = bookingWindow(rules, today);
  const cursor = new Date(from && from > first ? from : first);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    const iso = toIsoDay(cursor);
    if (isBookable(iso, rules, today)) return iso;
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** Nombre de dates proposées dans un mois donné (aperçu du back-office). */
export function bookableDaysInMonth(
  rules: BookingRules,
  year: number,
  month: number,
  today: Date = startOfToday(),
): number {
  const days = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (isBookable(toIsoDay(new Date(year, month, d)), rules, today)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Libellés par type de produit
// ---------------------------------------------------------------------------

/**
 * Libellés du calendrier selon le produit : on ne « part » pas en location de
 * voiture, on prend le véhicule ; on n'a pas de « départ » d'hôtel, on arrive.
 * Le mécanisme de dates est le même partout, seul le vocabulaire change.
 */
export function calendarLabels(category: string) {
  switch (category) {
    case "location-voiture":
      return {
        pick: "Choisissez votre jour de prise en charge",
        date: "Prise en charge",
        end: "Restitution le",
        cta: "Choisissez un jour",
        min: "Prise en charge possible à partir du",
      };
    case "hotels":
      return {
        pick: "Choisissez votre date d'arrivée",
        date: "Arrivée",
        end: "Départ de l'hôtel le",
        cta: "Choisissez une date",
        min: "Arrivées possibles à partir du",
      };
    case "vols":
      return {
        pick: "Choisissez votre date de vol aller",
        date: "Vol aller",
        end: "",
        cta: "Choisissez une date",
        min: "Vols possibles à partir du",
      };
    default:
      return {
        pick: "Choisissez votre date de départ",
        date: "Départ",
        end: "Retour le",
        cta: "Choisissez une date",
        min: "Départs disponibles à partir du",
      };
  }
}

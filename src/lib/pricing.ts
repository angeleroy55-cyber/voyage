import { SEASONS, inSeason } from "@/lib/seasons";

/**
 * Variation de prix par date de départ.
 *
 * Il n'existe aucun flux tarifaire fournisseur donnant un prix réellement
 * différent par jour pour ces offres : une seule valeur (`Offer.price`) est
 * connue en base. Afficher un prix différent sur chaque date du calendrier
 * sans règle, ou avec des montants choisis au hasard pour « faire vrai »,
 * serait exactement le type de donnée inventée que ce projet interdit (même
 * problème que les faux avis et les fausses statistiques déjà corrigés).
 *
 * La variation ci-dessous est donc une vraie règle commerciale, appliquée
 * identiquement à toutes les offres et documentée ici en clair, pas un
 * nombre choisi pour ressembler à un tarif réel :
 *   - Départ vendredi, samedi ou dimanche (forte demande) : +5 %.
 *   - Départ dans les dix prochains jours : -5 %, cohérent avec le
 *     positionnement affiché ailleurs sur le site ("Dernière minute" =
 *     meilleures affaires, pas un supplément).
 *   - Les deux peuvent se cumuler (vendredi dans les dix jours, etc.).
 *   - Sinon, le prix catalogue s'applique tel quel.
 *
 * Extension « saison et fourchette concurrentielle » (paramètre `band` de
 * `priceForDate`, utilisé par toutes les pages depuis octobre 2026) :
 *   3. Saison de la date de départ (fenêtres de src/lib/seasons.ts) :
 *        haute demande  (grandes vacances, Noël, Pâques)        : +4 %
 *        demande normale (Toussaint, hiver/ski, ponts de mai)    :  0 %
 *        basse demande  (été indien, soleil d'hiver nov.-déc.)  : -4 %
 *      Les pourcentages s'additionnent à ceux du week-end et de la dernière
 *      minute : facteur = 1 + week-end + saison - dernière minute.
 *   4. Fourchette par rapport au prix de référence concurrentiel
 *      (`Offer.oldPrice`, relevé tracé dans `referencePriceSource`) : le prix
 *      du jour est ramené entre
 *        plafond  = référence × (1 - remise minimale)   → toujours au moins
 *                   5 % (réglable) moins cher que la référence ;
 *        plancher = référence × (1 - remise maximale)   → jamais plus de 20 %
 *                   (réglable) sous la référence, pour garder la marge…
 *      … sauf si le prix catalogue est lui-même déjà plus bas que ce plancher
 *      (vente flash décidée par l'équipe, ex. -28 %) : le plancher descend
 *      alors au prix catalogue, pour ne jamais afficher sur le calendrier un
 *      prix supérieur à la promotion annoncée sur la carte de l'offre.
 *      Les remises minimale et maximale se règlent par catégorie et par offre
 *      au back-office (/admin/calendrier), 5 % et 20 % par défaut.
 *   Sans prix de référence connu, seule l'étape 3 s'ajoute à la règle d'origine.
 *
 * Le prix affiché au client (`BookingBox`, `CheckoutForm`) et le prix
 * réellement enregistré (`createBooking`, serveur) utilisent tous les deux
 * cette même fonction, avec les mêmes paramètres résolus côté serveur
 * (`resolveBookingRules`, src/lib/booking-rules.ts) : impossible d'afficher
 * un montant et d'en facturer un autre.
 */

const WEEKEND_SURCHARGE = 0.05;
const LAST_MINUTE_DISCOUNT = 0.05;
const LAST_MINUTE_WINDOW_DAYS = 10;

/** Niveau de demande de chaque saison commerciale, et son effet sur le prix. */
export const SEASON_DEMAND: Record<string, { level: "haute" | "normale" | "basse"; adjustment: number }> = {
  ete: { level: "haute", adjustment: 0.04 },
  noel: { level: "haute", adjustment: 0.04 },
  paques: { level: "haute", adjustment: 0.04 },
  toussaint: { level: "normale", adjustment: 0 },
  ski: { level: "normale", adjustment: 0 },
  "pont-de-mai": { level: "normale", adjustment: 0 },
  "ete-indien": { level: "basse", adjustment: -0.04 },
  "soleil-hiver": { level: "basse", adjustment: -0.04 },
};

/** Remises par défaut par rapport au prix de référence, en pourcentage. */
export const DEFAULT_DISCOUNT_MIN_PCT = 5;
export const DEFAULT_DISCOUNT_MAX_PCT = 20;

/** Paramètres de l'extension saison + fourchette concurrentielle. */
export type PriceBand = {
  /** Prix de référence concurrentiel (`Offer.oldPrice`), s'il est connu. */
  referencePrice?: number | null;
  discountMinPct: number;
  discountMaxPct: number;
};

/**
 * Délai minimum avant un départ, par catégorie.
 *
 * Deux jours francs pour les séjours (délai d'émission des billets et de
 * confirmation hôtelière) ; aucun délai supplémentaire pour les circuits et
 * croisières, dont les départs sont déjà des dates précises et plus
 * espacées. C'est la valeur par défaut : elle peut être surchargée par
 * catégorie ou par offre au back-office (voir `resolveBookingRules`).
 */
export function leadDaysFor(category: string): number {
  return category === "sejours" ? 2 : 0;
}

/** Nombre de jours entre aujourd'hui (minuit local) et une date `AAAA-MM-JJ`. */
function daysFromToday(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Saison commerciale d'une date `AAAA-MM-JJ` (les fenêtres couvrent l'année). */
export function seasonDemandFor(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  const season = SEASONS.find((s) => inSeason(date, s));
  const demand = (season && SEASON_DEMAND[season.id]) || { level: "normale" as const, adjustment: 0 };
  return { seasonLabel: season?.label ?? "", ...demand };
}

/** Détail du calcul, pour pouvoir l'expliquer au client (infobulle du calendrier). */
export type PriceDetails = {
  price: number;
  weekend: boolean;
  lastMinute: boolean;
  seasonLabel: string;
  seasonLevel: "haute" | "normale" | "basse" | null;
  /** Le prix a été ramené dans la fourchette concurrentielle. */
  clamped: "plafond" | "plancher" | null;
};

export function priceDetailsForDate(
  basePrice: number,
  departureIso: string,
  band?: PriceBand,
): PriceDetails {
  const none: PriceDetails = {
    price: basePrice,
    weekend: false,
    lastMinute: false,
    seasonLabel: "",
    seasonLevel: null,
    clamped: null,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureIso)) return none;

  const day = new Date(`${departureIso}T12:00:00`).getDay(); // 0 = dimanche
  const isWeekend = day === 0 || day === 5 || day === 6;
  const isLastMinute =
    daysFromToday(departureIso) >= 0 && daysFromToday(departureIso) <= LAST_MINUTE_WINDOW_DAYS;

  let factor = 1;
  if (isWeekend) factor += WEEKEND_SURCHARGE;
  if (isLastMinute) factor -= LAST_MINUTE_DISCOUNT;

  // Règle d'origine, inchangée quand aucune extension n'est demandée.
  if (!band) {
    return {
      ...none,
      price: Math.max(1, Math.round(basePrice * factor)),
      weekend: isWeekend,
      lastMinute: isLastMinute,
    };
  }

  const demand = seasonDemandFor(departureIso);
  factor += demand.adjustment;
  let price = Math.max(1, Math.round(basePrice * factor));
  let clamped: PriceDetails["clamped"] = null;

  const ref = band.referencePrice ?? 0;
  if (ref > 0) {
    // Plafond arrondi à l'euro inférieur, plancher à l'euro supérieur : les
    // arrondis vont toujours dans le sens de la promesse faite au client.
    const ceiling = Math.floor(ref * (1 - band.discountMinPct / 100));
    const floor = Math.min(Math.ceil(ref * (1 - band.discountMaxPct / 100)), basePrice);
    if (price > ceiling) {
      price = ceiling;
      clamped = "plafond";
    } else if (price < floor) {
      price = floor;
      clamped = "plancher";
    }
  }

  return {
    price: Math.max(1, price),
    weekend: isWeekend,
    lastMinute: isLastMinute,
    seasonLabel: demand.seasonLabel,
    seasonLevel: demand.level,
    clamped,
  };
}

/**
 * Prix pour une date de départ donnée, arrondi à l'euro.
 *
 * Sans `band` : règle d'origine (week-end, dernière minute). Avec `band` :
 * règle d'origine + saison + fourchette concurrentielle, voir plus haut.
 */
export function priceForDate(basePrice: number, departureIso: string, band?: PriceBand): number {
  return priceDetailsForDate(basePrice, departureIso, band).price;
}

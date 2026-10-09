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
 * Le prix affiché au client (`BookingBox`, `CheckoutForm`) et le prix
 * réellement enregistré (`createBooking`, serveur) utilisent tous les deux
 * cette même fonction : impossible d'afficher un montant et d'en facturer
 * un autre.
 */

const WEEKEND_SURCHARGE = 0.05;
const LAST_MINUTE_DISCOUNT = 0.05;
const LAST_MINUTE_WINDOW_DAYS = 10;

/**
 * Délai minimum avant un départ, par catégorie.
 *
 * Deux jours francs pour les séjours (délai d'émission des billets et de
 * confirmation hôtelière) ; aucun délai supplémentaire pour les circuits et
 * croisières, dont les départs sont déjà des dates précises et plus
 * espacées. Utilisé à la fois par le calendrier affiché (DepartureCalendar)
 * et par l'action serveur qui enregistre la demande (createBooking) : les
 * mêmes dates sont acceptées des deux côtés.
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

/** Prix pour une date de départ donnée, arrondi à l'euro. */
export function priceForDate(basePrice: number, departureIso: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureIso)) return basePrice;

  const day = new Date(`${departureIso}T12:00:00`).getDay(); // 0 = dimanche
  const isWeekend = day === 0 || day === 5 || day === 6;
  const isLastMinute =
    daysFromToday(departureIso) >= 0 && daysFromToday(departureIso) <= LAST_MINUTE_WINDOW_DAYS;

  let factor = 1;
  if (isWeekend) factor += WEEKEND_SURCHARGE;
  if (isLastMinute) factor -= LAST_MINUTE_DISCOUNT;

  return Math.max(1, Math.round(basePrice * factor));
}

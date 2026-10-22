/**
 * Jours de départ proposés par le calendrier d'une offre.
 *
 * Un calendrier où chaque jour du mois est réservable ne ressemble à aucun
 * programme de vols : les compagnies et les tour-opérateurs ne partent pas tous
 * les jours vers toutes les destinations. Chaque offre propose donc quatre jours
 * de départ par semaine, soit 16 à 19 dates sur un mois complet : la fourchette
 * « 15 à 20 dates par mois » demandée, ni les 30 jours du mois, ni trois dates
 * rares.
 *
 * Les jours se règlent par route, pas par offre : toutes les offres d'une même
 * ville de départ vers un même pays partagent le même motif, comme elles
 * partageraient les mêmes vols. Le motif est déterministe (empreinte de la
 * route) : deux installations du projet produisent le même calendrier.
 *
 * Ce n'est pas un flux de disponibilités en temps réel : aucune API de vols
 * n'alimente le site. C'est la règle commerciale des dates proposées, la
 * disponibilité réelle restant confirmée par un conseiller avant tout paiement.
 * Un réglage saisi au back-office (offre ou catégorie) l'emporte toujours : le
 * seed ne pose ces jours que sur une offre qui n'en a pas.
 */

/** Jours de départ proposés (0 = dimanche), quatre par semaine. */
const PATTERNS: number[][] = [
  [1, 3, 5, 6], // lundi, mercredi, vendredi, samedi
  [2, 4, 6, 0], // mardi, jeudi, samedi, dimanche
  [1, 4, 5, 6], // lundi, jeudi, vendredi, samedi
  [3, 5, 6, 0], // mercredi, vendredi, samedi, dimanche
  [2, 3, 5, 6], // mardi, mercredi, vendredi, samedi
  [1, 2, 4, 6], // lundi, mardi, jeudi, samedi
  [4, 5, 6, 0], // jeudi, vendredi, samedi, dimanche
  [1, 3, 4, 0], // lundi, mercredi, jeudi, dimanche
  [2, 5, 6, 0], // mardi, vendredi, samedi, dimanche
  [1, 3, 6, 0], // lundi, mercredi, samedi, dimanche
];

/** Motifs « week-end » : escapades et city-breaks partent surtout du jeudi au dimanche. */
const WEEKEND_PATTERNS = [PATTERNS[6], PATTERNS[2], PATTERNS[3], PATTERNS[8]];

/** Empreinte FNV-1a 32 bits : stable d'une machine à l'autre. */
function fingerprint(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Nettoie une clé pour que « Paris » et « paris » donnent le même motif. */
function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Jours de la semaine (0 = dimanche) où l'offre propose un départ. */
export function departureWeekdaysFor(input: {
  departureCity: string;
  country: string;
  /** Escapade ou city-break de quelques nuits : départs plutôt en fin de semaine. */
  weekend?: boolean;
}): number[] {
  const key = normalise(`${input.departureCity}|${input.country}`);
  const pool = input.weekend ? WEEKEND_PATTERNS : PATTERNS;
  return pool[fingerprint(key) % pool.length];
}

/**
 * Valeur de `Offer.excludedWeekdays` : les trois jours sans départ, au format
 * lu par `parseWeekdays` (« 0,2,4 »). Au plus trois jours exclus, limite du
 * back-office (`MAX_EXCLUDED_WEEKDAYS`).
 */
export function excludedWeekdaysFor(input: {
  departureCity: string;
  country: string;
  weekend?: boolean;
}): string {
  const open = new Set(departureWeekdaysFor(input));
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => !open.has(d)).join(",");
}

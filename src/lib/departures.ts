import { seasonById, seasonRange } from "@/lib/seasons";
import {
  bookingWindow,
  firstBookableDate,
  startOfToday,
  type BookingRules,
} from "@/lib/booking-rules";

/**
 * Calcul de la date de départ « ferme » d'une offre (`Offer.departureDate`).
 *
 * Ces fonctions étaient privées au script de seed ; elles sont partagées ici
 * pour que la remise à jour automatique des dates dépassées
 * (src/server/departures.ts) suive exactement la même logique que l'import
 * du catalogue.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** En dessous de 7 jours restants, la saison en cours est jugée terminée. */
const MIN_SEASON_DAYS_LEFT = 7;

/**
 * Date de départ à J+N, fixée à midi.
 *
 * Elle est calculée au moment du seed et non figée dans le catalogue : le badge
 * « Dernière minute » se déclenche à moins de 21 jours du départ, donc des
 * dates écrites en dur cesseraient de le déclencher dès le lendemain. Midi
 * plutôt que minuit : le décalage horaire ne fait alors jamais basculer la date
 * affichée d'un jour.
 */
export function departureFrom(days: number, from: Date = new Date()): Date {
  const date = new Date(from);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Date de départ d'une offre saisonnière, tirée dans la fenêtre de sa saison.
 *
 * Un séjour au ski ne part pas en juillet et un marché de Noël pas en mai : la
 * date vise la prochaine occurrence de la période, pas un simple écart en jours.
 * Le décalage est déterministe, calculé sur le rang de l'offre : deux
 * installations du projet produisent le même catalogue, et les départs d'une
 * même saison s'échelonnent au lieu de tomber tous le même jour.
 *
 * Correctif d'octobre 2026 : quand la saison est déjà commencée, le tirage
 * part d'aujourd'hui et non du début de la saison (il pouvait tomber dans le
 * passé, une des causes des dates dépassées), et une saison qui s'achève dans
 * moins d'une semaine cède la place à son occurrence suivante.
 */
export function departureInSeason(seasonId: string, rang: number, from: Date = new Date()): Date | null {
  const saison = seasonById(seasonId);
  if (!saison) return null;

  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  let { gte, lte } = seasonRange(saison, today);
  let debut = gte < today ? today : gte;
  if ((lte.getTime() - debut.getTime()) / DAY_MS < MIN_SEASON_DAYS_LEFT) {
    const apres = new Date(lte);
    apres.setDate(apres.getDate() + 1);
    ({ gte, lte } = seasonRange(saison, apres));
    debut = gte;
  }

  const jours = Math.max(0, Math.round((lte.getTime() - debut.getTime()) / DAY_MS));
  const date = new Date(debut);
  date.setDate(date.getDate() + (jours > 0 ? (rang * 7) % jours : 0));
  date.setHours(12, 0, 0, 0);
  return date;
}

/**
 * Nouvelle date ferme pour une offre dont la date est dépassée.
 *
 * Même logique que le seed (saison si l'offre en a une, sinon écart en jours
 * de `DEPARTURE_OFFSETS` selon le rang de l'offre), puis deux ajustements :
 *   - l'écart est ramené dans la fenêtre de réservation de l'offre (modulo sa
 *     longueur) : un écart de 310 jours sur une offre ouverte à 6 mois
 *     donnerait sinon une date que le calendrier ne propose pas ;
 *   - la date est avancée au premier jour réellement réservable (jour de
 *     semaine exclu, saison), pour que « Prochain départ » soit toujours une
 *     date que le client peut cliquer.
 * Rend `null` si aucune date n'est réservable : la fiche affiche alors la
 * période commerciale (`dates`).
 */
export function nextDepartureFor(input: {
  rules: BookingRules;
  position: number;
  offsets: number[];
  today?: Date;
}): Date | null {
  const today = input.today ?? startOfToday();
  const { rules } = input;
  const { first, last } = bookingWindow(rules, today);

  let candidate: Date | null = rules.season ? departureInSeason(rules.season, input.position, today) : null;
  if (!candidate) {
    const offset = input.offsets.length ? input.offsets[Math.abs(input.position) % input.offsets.length] : 0;
    const span = Math.max(1, Math.round((last.getTime() - first.getTime()) / DAY_MS) + 1);
    candidate = new Date(first);
    candidate.setDate(candidate.getDate() + (offset % span));
  }
  candidate.setHours(0, 0, 0, 0);

  const iso = firstBookableDate(rules, today, candidate) ?? firstBookableDate(rules, today);
  return iso ? new Date(`${iso}T12:00:00`) : null;
}

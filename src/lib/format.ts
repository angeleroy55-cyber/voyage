import { LAST_MINUTE_DAYS } from "@/lib/constants";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function price(value: number): string {
  return eur.format(value);
}

export function ratingLabel(score: number): string {
  if (score >= 9) return "Exceptionnel";
  if (score >= 8.5) return "Excellent";
  if (score >= 8) return "Très bien";
  if (score >= 7) return "Bien";
  return "Correct";
}

export function discount(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/**
 * Économie en euros par rapport au prix de référence.
 *
 * C'est le chiffre affiché systématiquement sur la carte offre, là où le
 * pourcentage reste optionnel et réglé par catégorie : « 118 € de moins » se
 * comprend sans calcul, « 20 % » demande de connaître le prix de départ.
 */
export function savings(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return oldPrice - price;
}

/**
 * L'offre part-elle dans moins de `LAST_MINUTE_DAYS` jours ?
 *
 * Calculé à chaque affichage, jamais stocké : une offre ne peut donc pas rester
 * annoncée comme urgente après sa date de départ. La date arrive au format
 * `AAAA-MM-JJ` et est lue à midi, pour qu'aucun fuseau ne la fasse basculer.
 */
export function isLastMinute(departureDate: string | undefined): boolean {
  if (!departureDate) return false;
  const depart = new Date(`${departureDate}T12:00:00`);
  if (Number.isNaN(depart.getTime())) return false;

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const limite = new Date(aujourdhui);
  limite.setDate(limite.getDate() + LAST_MINUTE_DAYS);

  return depart >= aujourdhui && depart <= limite;
}

const jourCourt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Date de départ ferme, telle qu'elle ancre la décision sur une carte :
 * « Départ le 17/09/2026 ». Rend une chaîne vide sans date arrêtée, la carte
 * retombant alors sur la période commerciale de l'offre.
 */
export function departureLabel(departureDate: string | undefined): string {
  if (!departureDate) return "";
  const depart = new Date(`${departureDate}T12:00:00`);
  return Number.isNaN(depart.getTime()) ? "" : `Départ le ${jourCourt.format(depart)}`;
}

/**
 * Durée complète, au format du cahier : « 8 jours / 7 nuits ».
 *
 * Un vol n'a pas de nuitée, une location se compte en jours de mise à
 * disposition : les deux ont leur propre formulation, pour ne pas annoncer
 * « 0 nuit » sur un aller-retour.
 */
export function durationFull(
  category: string,
  days: number | undefined,
  nights: number,
): string {
  if (category === "vols") return "Aller-retour";
  if (category === "location-voiture") {
    const n = days || nights;
    return `${n} jour${n > 1 ? "s" : ""} de location`;
  }
  const j = days || nights + 1;
  if (nights <= 0) return `${j} jour${j > 1 ? "s" : ""}`;
  return `${j} jours / ${nights} nuit${nights > 1 ? "s" : ""}`;
}

export function photo(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

const longDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export function dateLabel(value: Date | string | null | undefined): string {
  if (!value) return "À définir";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "À définir" : longDate.format(date);
}

/**
 * Période d'un séjour, avec le mois écrit une seule fois quand les deux dates
 * tombent la même année : « 12 juil. au 19 juillet 2026 ».
 */
export function dateRange(start?: Date | null, end?: Date | null): string {
  if (!start) return "Dates à confirmer";
  if (!end) return longDate.format(start);
  return start.getFullYear() === end.getFullYear()
    ? `${shortDate.format(start)} au ${longDate.format(end)}`
    : `${longDate.format(start)} au ${longDate.format(end)}`;
}

export function durationLabel(nights: number, category: string): string {
  if (category === "vols") return "Aller-retour";
  if (category === "location-voiture") return `${nights} jours de location`;
  if (category === "croisieres" || category === "circuits") return `${nights} jours`;
  return `${nights} nuit${nights > 1 ? "s" : ""}`;
}

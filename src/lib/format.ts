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
 * tombent la même année : « 12 – 19 juillet 2026 ».
 */
export function dateRange(start?: Date | null, end?: Date | null): string {
  if (!start) return "Dates à confirmer";
  if (!end) return longDate.format(start);
  return start.getFullYear() === end.getFullYear()
    ? `${shortDate.format(start)} – ${longDate.format(end)}`
    : `${longDate.format(start)} – ${longDate.format(end)}`;
}

export function durationLabel(nights: number, category: string): string {
  if (category === "vols") return "Aller-retour";
  if (category === "voitures") return `${nights} jours de location`;
  if (category === "croisieres" || category === "circuits") return `${nights} jours`;
  return `${nights} nuit${nights > 1 ? "s" : ""}`;
}

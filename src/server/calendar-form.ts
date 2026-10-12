import "server-only";
import {
  DISCOUNT_LIMIT_MAX_PCT,
  DISCOUNT_LIMIT_MIN_PCT,
  LEAD_MAX_DAYS,
  MAX_EXCLUDED_WEEKDAYS,
  WINDOW_MAX_MONTHS,
  WINDOW_MIN_MONTHS,
  type CalendarSettings,
} from "@/lib/booking-rules";

/**
 * Lecture des réglages de calendrier et de prix saisis au back-office, sur la
 * page /admin/calendrier (catégorie) comme sur la fiche d'une offre.
 *
 * Un champ vide vaut `null` : « hériter » (de la catégorie pour une offre, du
 * défaut du code pour une catégorie). Toute valeur hors bornes est refusée
 * avec un message, plutôt que ramenée en silence dans les bornes : l'équipe
 * doit savoir que sa saisie n'a pas été prise telle quelle.
 */
export type CalendarFormResult =
  | { ok: true; data: CalendarSettings }
  | { ok: false; error: string };

function readOptionalInt(formData: FormData, name: string): number | null | "invalide" {
  const raw = String(formData.get(name) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : "invalide";
}

export const CALENDAR_ERRORS: Record<string, string> = {
  delai: `Le délai minimum doit être un nombre entier de jours, entre 0 et ${LEAD_MAX_DAYS}.`,
  fenetre: `La fenêtre de réservation doit être comprise entre ${WINDOW_MIN_MONTHS} et ${WINDOW_MAX_MONTHS} mois.`,
  jours: `Au plus ${MAX_EXCLUDED_WEEKDAYS} jours de semaine peuvent être exclus, pour garder au moins 15 dates de départ par mois.`,
  remise: `Les remises doivent être comprises entre ${DISCOUNT_LIMIT_MIN_PCT} et ${DISCOUNT_LIMIT_MAX_PCT} %.`,
  fourchette: "La remise minimale ne peut pas dépasser la remise maximale.",
};

/**
 * @param inheritWeekdays nom de la case « surcharger les jours exclus » : sur
 *   une offre, décochée, les jours de la catégorie s'appliquent (`null`).
 */
export function readCalendarSettings(
  formData: FormData,
  inheritWeekdays?: string,
): CalendarFormResult {
  const lead = readOptionalInt(formData, "bookingLeadDays");
  if (lead === "invalide" || (lead !== null && (lead < 0 || lead > LEAD_MAX_DAYS))) {
    return { ok: false, error: "delai" };
  }

  const window = readOptionalInt(formData, "bookingWindowMonths");
  if (
    window === "invalide" ||
    (window !== null && (window < WINDOW_MIN_MONTHS || window > WINDOW_MAX_MONTHS))
  ) {
    return { ok: false, error: "fenetre" };
  }

  const days = [
    ...new Set(
      formData
        .getAll("excludedWeekdays")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort();
  if (days.length > MAX_EXCLUDED_WEEKDAYS) return { ok: false, error: "jours" };
  const inherit = inheritWeekdays !== undefined && formData.get(inheritWeekdays) !== "on";

  const min = readOptionalInt(formData, "discountMinPct");
  const max = readOptionalInt(formData, "discountMaxPct");
  for (const v of [min, max]) {
    if (v === "invalide" || (v !== null && (v < DISCOUNT_LIMIT_MIN_PCT || v > DISCOUNT_LIMIT_MAX_PCT))) {
      return { ok: false, error: "remise" };
    }
  }
  if (typeof min === "number" && typeof max === "number" && min > max) {
    return { ok: false, error: "fourchette" };
  }

  return {
    ok: true,
    data: {
      bookingLeadDays: lead,
      bookingWindowMonths: window,
      excludedWeekdays: inherit ? null : days.join(","),
      discountMinPct: min as number | null,
      discountMaxPct: max as number | null,
    },
  };
}

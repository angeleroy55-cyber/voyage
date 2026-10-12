import {
  DISCOUNT_LIMIT_MAX_PCT,
  DISCOUNT_LIMIT_MIN_PCT,
  LEAD_MAX_DAYS,
  MAX_EXCLUDED_WEEKDAYS,
  parseWeekdays,
  WEEKDAY_LABELS,
  WINDOW_MAX_MONTHS,
  WINDOW_MIN_MONTHS,
  type CalendarSettings,
} from "@/lib/booking-rules";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

/** Lundi d'abord, comme sur le calendrier public ; valeurs JavaScript (0 = dimanche). */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * Champs de réglage du calendrier et de la fourchette de prix, partagés par
 * la page /admin/calendrier (catégorie) et la fiche d'une offre.
 *
 * Les champs vides héritent : `inherited` porte la valeur qui s'appliquera
 * alors, affichée en indication pour que personne ne règle à l'aveugle.
 */
export default function CalendarFields({
  values,
  inherited,
  inheritLabel,
  weekdaysOverrideName,
}: {
  values: Partial<CalendarSettings>;
  inherited: { leadDays: number; windowMonths: number; weekdays: number[]; min: number; max: number };
  /** « de la catégorie » ou « par défaut ». */
  inheritLabel: string;
  /** Sur une offre : nom de la case qui active la surcharge des jours exclus. */
  weekdaysOverrideName?: string;
}) {
  const ownDays = values.excludedWeekdays != null ? parseWeekdays(values.excludedWeekdays) : null;
  const checkedDays = ownDays ?? (weekdaysOverrideName ? inherited.weekdays : []);
  const weekdayText = (days: number[]) =>
    days.length ? days.map((d) => WEEKDAY_LABELS[d].toLowerCase()).join(", ") : "aucun";

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Délai minimum (jours)
        </span>
        <input
          type="number"
          name="bookingLeadDays"
          min={0}
          max={LEAD_MAX_DAYS}
          defaultValue={values.bookingLeadDays ?? ""}
          placeholder={String(inherited.leadDays)}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-navy-400">
          Vide : {inherited.leadDays} j {inheritLabel}
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Fenêtre (mois)
        </span>
        <input
          type="number"
          name="bookingWindowMonths"
          min={WINDOW_MIN_MONTHS}
          max={WINDOW_MAX_MONTHS}
          defaultValue={values.bookingWindowMonths ?? ""}
          placeholder={String(inherited.windowMonths)}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-navy-400">
          {WINDOW_MIN_MONTHS} à {WINDOW_MAX_MONTHS} mois. Vide : {inherited.windowMonths} mois{" "}
          {inheritLabel}
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Remise min. (%)
        </span>
        <input
          type="number"
          name="discountMinPct"
          min={DISCOUNT_LIMIT_MIN_PCT}
          max={DISCOUNT_LIMIT_MAX_PCT}
          defaultValue={values.discountMinPct ?? ""}
          placeholder={String(inherited.min)}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-navy-400">
          Vide : {inherited.min} % {inheritLabel}
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Remise max. (%)
        </span>
        <input
          type="number"
          name="discountMaxPct"
          min={DISCOUNT_LIMIT_MIN_PCT}
          max={DISCOUNT_LIMIT_MAX_PCT}
          defaultValue={values.discountMaxPct ?? ""}
          placeholder={String(inherited.max)}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-navy-400">
          Vide : {inherited.max} % {inheritLabel}
        </span>
      </label>

      <fieldset className="sm:col-span-4">
        <legend className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Jours sans départ ({MAX_EXCLUDED_WEEKDAYS} au plus)
        </legend>
        {weekdaysOverrideName && (
          <label className="mt-1.5 flex items-center gap-2 text-sm text-navy-700">
            <input
              type="checkbox"
              name={weekdaysOverrideName}
              defaultChecked={ownDays !== null}
              className="size-4 rounded border-navy-300 accent-gold-500"
            />
            Régler les jours pour cette offre (sinon : {weekdayText(inherited.weekdays)}{" "}
            {inheritLabel})
          </label>
        )}
        <div className="mt-1.5 flex flex-wrap gap-2">
          {WEEK_ORDER.map((d) => (
            <label
              key={d}
              className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-2.5 py-1.5 text-sm text-navy-700"
            >
              <input
                type="checkbox"
                name="excludedWeekdays"
                value={d}
                defaultChecked={checkedDays.includes(d)}
                className="size-4 rounded border-navy-300 accent-gold-500"
              />
              {WEEKDAY_LABELS[d]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

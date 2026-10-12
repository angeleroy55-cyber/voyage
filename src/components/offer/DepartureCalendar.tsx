"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { price } from "@/lib/format";
import { leadDaysFor, priceDetailsForDate, type PriceDetails } from "@/lib/pricing";
import {
  bookingWindow,
  calendarLabels,
  isBookable,
  priceBandOf,
  WEEKDAY_LABELS,
  type BookingRules,
} from "@/lib/booking-rules";
import { seasonById } from "@/lib/seasons";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/** Jour civil local au format `AAAA-MM-JJ`. */
function toIso(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Explication du prix d'une date, affichée en infobulle : la règle, pas un mystère. */
function explain(d: PriceDetails): string {
  const parts: string[] = [];
  if (d.weekend) parts.push("départ en fin de semaine +5 %");
  if (d.lastMinute) parts.push("dernière minute −5 %");
  if (d.seasonLevel === "haute") parts.push(`${d.seasonLabel} (haute saison) +4 %`);
  if (d.seasonLevel === "basse") parts.push(`${d.seasonLabel} (basse saison) −4 %`);
  if (d.clamped === "plafond") parts.push("plafonné sous le prix de référence");
  if (d.clamped === "plancher") parts.push("remise maximale atteinte");
  return parts.length ? parts.join(" · ") : "prix catalogue";
}

/**
 * Calendrier mensuel de dates de départ, prix affiché sur chaque jour.
 *
 * Même principe que la grille d'un comparateur de voyages : le client voit le
 * prix de chaque date avant de choisir, plutôt que de choisir une date à
 * l'aveugle puis d'attendre un devis. Le prix affiché n'est toutefois pas un
 * flux tarifaire fournisseur (GoSéjour n'en a pas pour ces offres) : c'est le
 * prix catalogue de l'offre, ajusté par une règle de date documentée et
 * identique pour tout le monde (voir `src/lib/pricing.ts`) — pas des
 * montants choisis au hasard pour ressembler à un vrai flux tarifaire.
 *
 * Les dates proposées viennent de `rules` (src/lib/booking-rules.ts : fenêtre
 * par catégorie/offre, jours exclus, saison), résolues côté serveur et
 * revérifiées par `createBooking`. Le calendrier ne dépend donc jamais de la
 * colonne figée `Offer.departureDate` : il calcule ses dates à la volée.
 * Sans `rules`, comportement d'origine (délai de la catégorie, 6 mois).
 */
export default function DepartureCalendar({
  basePrice,
  category,
  value,
  onChange,
  rules,
}: {
  basePrice: number;
  /** Conservé pour compatibilité d'appel ; la durée sert au retour, dans BookingBox. */
  nights?: number;
  category: string;
  value: string;
  onChange: (iso: string) => void;
  rules?: BookingRules;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const labels = calendarLabels(category);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { minSelectable, maxSelectable } = useMemo(() => {
    if (rules) {
      const { first, last } = bookingWindow(rules, today);
      return { minSelectable: first, maxSelectable: last };
    }
    const first = new Date(today);
    first.setDate(first.getDate() + leadDaysFor(category));
    const last = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    return { minSelectable: first, maxSelectable: last };
  }, [rules, today, category]);

  const leadDays = rules ? rules.leadDays : leadDaysFor(category);
  const band = useMemo(() => (rules ? priceBandOf(rules) : undefined), [rules]);

  // Dernier mois navigable : celui de la dernière date proposée.
  const maxOffset =
    (maxSelectable.getFullYear() - today.getFullYear()) * 12 +
    (maxSelectable.getMonth() - today.getMonth());

  const viewedMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [today, monthOffset]);

  const selectable = (iso: string, date: Date) =>
    rules ? isBookable(iso, rules, today) : date >= minSelectable && date <= maxSelectable;

  // Grille lundi → dimanche, cases vides avant le 1er et après le dernier jour
  // du mois, pour que les colonnes de jours de semaine restent alignées d'un
  // mois à l'autre.
  const cells = useMemo(() => {
    const year = viewedMonth.getFullYear();
    const month = viewedMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // getDay() : 0 = dimanche → ramené à 0 = lundi.
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

    const result: ({ iso: string; date: Date } | null)[] = Array.from(
      { length: leadingBlanks },
      () => null,
    );
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      result.push({ iso: toIso(d), date: d });
    }
    return result;
  }, [viewedMonth]);

  // Meilleur prix du mois affiché, parmi les dates sélectionnables : sert à
  // poser le repère « Meilleur prix », pas à en faire la seule date proposée.
  const bestIso = useMemo(() => {
    let best: { iso: string; p: number } | null = null;
    for (const cell of cells) {
      if (!cell) continue;
      const ok = rules
        ? isBookable(cell.iso, rules, today)
        : cell.date >= minSelectable && cell.date <= maxSelectable;
      if (!ok) continue;
      const p = priceDetailsForDate(basePrice, cell.iso, band).price;
      if (!best || p < best.p) best = { iso: cell.iso, p };
    }
    return best?.iso ?? null;
  }, [cells, rules, today, minSelectable, maxSelectable, basePrice, band]);

  const monthLabel = viewedMonth
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  const season = rules ? seasonById(rules.season) : null;
  const excluded = rules?.excludedWeekdays ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
          disabled={monthOffset === 0}
          aria-label="Mois précédent"
          className="rounded-lg p-1.5 text-navy-500 transition hover:bg-navy-50 disabled:opacity-30"
        >
          <Icon name="chevronLeft" className="size-4" />
        </button>
        <p className="text-sm font-extrabold text-navy-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => Math.min(maxOffset, m + 1))}
          disabled={monthOffset >= maxOffset}
          aria-label="Mois suivant"
          className="rounded-lg p-1.5 text-navy-500 transition hover:bg-navy-50 disabled:opacity-30"
        >
          <Icon name="chevronRight" className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-semibold uppercase text-navy-400">
            {w.slice(0, 3)}
          </span>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <span key={`blank-${i}`} />;

          const disabled = !selectable(cell.iso, cell.date);
          const details = priceDetailsForDate(basePrice, cell.iso, band);
          const datePrice = details.price;
          const off = Math.round(((basePrice - datePrice) / basePrice) * 100);
          const selected = cell.iso === value;
          const best = cell.iso === bestIso;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              aria-pressed={selected}
              title={disabled ? undefined : `${price(datePrice)} : ${explain(details)}`}
              className={`relative flex flex-col items-center rounded-lg border px-1 py-1.5 text-center transition ${
                disabled
                  ? "cursor-not-allowed border-transparent text-navy-200"
                  : selected
                    ? "border-navy-800 bg-navy-800 text-white"
                    : "border-navy-100 text-navy-800 hover:border-navy-400"
              }`}
            >
              <span className="text-xs font-bold leading-tight">{cell.date.getDate()}</span>
              {!disabled && (
                <>
                  <span className="text-[10px] font-semibold tabular-nums leading-tight">
                    {price(datePrice)}
                  </span>
                  {off > 0 && (
                    <span
                      className={`mt-0.5 rounded px-1 text-[9px] font-bold ${
                        selected ? "bg-white/20 text-white" : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      −{off} %
                    </span>
                  )}
                  {best && !selected && (
                    <span className="absolute -bottom-1.5 rounded-full bg-gold-400 px-1.5 py-px text-[8px] font-bold text-navy-900">
                      Top
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-navy-400">
        {leadDays > 0 && (
          <p>
            {labels.min}{" "}
            {minSelectable.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} (délai
            minimum de {leadDays} jours).
          </p>
        )}
        <p>
          Réservable jusqu&apos;au{" "}
          {maxSelectable.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          {season ? `, sur la période « ${season.label} »` : ""}.
          {excluded.length > 0 &&
            ` Pas de départ le ${excluded.map((d) => WEEKDAY_LABELS[d].toLowerCase()).join(", ")}.`}
        </p>
        <p>Prix variable selon la date (fin de semaine, saison, dernière minute) : survolez une date pour le détail.</p>
      </div>
    </div>
  );
}

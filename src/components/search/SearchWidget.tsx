"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { CATEGORIES, DEPARTURE_CITIES } from "@/lib/data";
import type { CategoryId } from "@/lib/types";

type Props = {
  initial?: CategoryId;
  compact?: boolean;
};

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function SearchWidget({ initial = "vol-hotel", compact = false }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<CategoryId>(initial);
  const [origin, setOrigin] = useState("Paris");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState(isoDate(30));
  const [end, setEnd] = useState(isoDate(37));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [travellersOpen, setTravellersOpen] = useState(false);
  const [flexible, setFlexible] = useState(false);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === active) ?? CATEGORIES[0],
    [active],
  );
  const fields = category.form;

  const travellersLabel = `${adults} adulte${adults > 1 ? "s" : ""}${
    children > 0 ? `, ${children} enfant${children > 1 ? "s" : ""}` : ""
  }${fields.includes("travellers") && active !== "vols" ? `, ${rooms} ch.` : ""}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fields.includes("origin") && origin) params.set("depart", origin);
    if (destination.trim()) params.set("q", destination.trim());
    params.set("du", start);
    params.set("au", end);
    params.set("voyageurs", String(adults + children));
    if (flexible) params.set("flex", "1");
    router.push(`/recherche/${active}?${params.toString()}`);
  }

  return (
    <div
      className={`rounded-2xl bg-white ${
        compact ? "shadow-card" : "shadow-pop"
      } ring-1 ring-navy-100`}
    >
      {/* Tabs */}
      <div className="rail flex gap-1 overflow-x-auto border-b border-navy-100 px-2 pt-2">
        {CATEGORIES.map((c) => {
          const on = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-3 text-sm font-semibold transition ${
                on
                  ? "bg-white text-navy-900 shadow-[inset_0_-3px_0_var(--color-gold-500)]"
                  : "text-navy-500 hover:bg-navy-50 hover:text-navy-800"
              }`}
            >
              <Icon name={c.icon} className={`size-4.5 ${on ? "text-gold-600" : "text-navy-400"}`} />
              {c.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-12">
          {fields.includes("origin") && (
            <Field
              className="lg:col-span-3"
              icon="plane"
              label={active === "croisieres" ? "Port d'embarquement" : "Départ de"}
            >
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-[15px] font-semibold text-navy-900 outline-none"
              >
                {DEPARTURE_CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}

          {fields.includes("destination") && (
            <Field
              className={fields.includes("origin") ? "lg:col-span-3" : "lg:col-span-4"}
              icon="pin"
              label={active === "voitures" ? "Lieu de prise en charge" : "Destination"}
            >
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={
                  active === "croisieres"
                    ? "Méditerranée, Caraïbes…"
                    : active === "voitures"
                      ? "Aéroport, ville…"
                      : "Ville, région ou hôtel"
                }
                className="w-full bg-transparent text-[15px] font-semibold text-navy-900 placeholder:font-normal placeholder:text-navy-400 outline-none"
              />
            </Field>
          )}

          {fields.includes("dates") && (
            <>
              <Field className="lg:col-span-2" icon="calendar" label="Aller">
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-transparent text-[15px] font-semibold text-navy-900 outline-none"
                />
              </Field>
              <Field className="lg:col-span-2" icon="calendar" label="Retour">
                <input
                  type="date"
                  value={end}
                  min={start}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-transparent text-[15px] font-semibold text-navy-900 outline-none"
                />
              </Field>
            </>
          )}

          {fields.includes("travellers") && (
            <div className="relative lg:col-span-2">
              <button
                type="button"
                onClick={() => setTravellersOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-navy-200 px-3 py-2.5 text-left transition hover:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400"
                aria-expanded={travellersOpen}
              >
                <Icon name="users" className="size-5 shrink-0 text-navy-400" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-navy-500">
                    Voyageurs
                  </span>
                  <span className="block truncate text-[15px] font-semibold text-navy-900">
                    {travellersLabel}
                  </span>
                </span>
              </button>
              {travellersOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-navy-100 bg-white p-4 shadow-pop">
                  <Counter label="Adultes" hint="18 ans et plus" value={adults} min={1} max={9} onChange={setAdults} />
                  <Counter label="Enfants" hint="0 à 17 ans" value={children} min={0} max={8} onChange={setChildren} />
                  {active !== "vols" && (
                    <Counter label="Chambres" hint="" value={rooms} min={1} max={5} onChange={setRooms} />
                  )}
                  <button
                    type="button"
                    onClick={() => setTravellersOpen(false)}
                    className="mt-3 w-full rounded-lg bg-navy-700 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                  >
                    Valider
                  </button>
                </div>
              )}
            </div>
          )}

          {fields.includes("driver") && (
            <Field className="lg:col-span-4" icon="users" label="Âge du conducteur">
              <select className="w-full bg-transparent text-[15px] font-semibold text-navy-900 outline-none">
                <option>25 – 65 ans</option>
                <option>21 – 24 ans</option>
                <option>Plus de 65 ans</option>
              </select>
            </Field>
          )}

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 lg:col-span-2"
          >
            <Icon name="search" className="size-5" />
            Rechercher
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-600">
            <input
              type="checkbox"
              checked={flexible}
              onChange={(e) => setFlexible(e.target.checked)}
              className="size-4 rounded border-navy-300 accent-gold-500"
            />
            Mes dates sont flexibles (± 3 jours)
          </label>
          <p className="text-sm text-navy-500">{category.blurb}</p>
        </div>
      </form>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
  className = "",
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-xl border border-navy-200 px-3 py-2.5 transition focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-200 hover:border-navy-300 ${className}`}
    >
      <Icon name={icon} className="size-5 shrink-0 text-navy-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-navy-500">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span>
        <span className="block text-sm font-semibold text-navy-800">{label}</span>
        {hint && <span className="block text-xs text-navy-500">{hint}</span>}
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Retirer un ${label.toLowerCase()}`}
          className="size-8 rounded-full border border-navy-200 text-lg leading-none text-navy-700 transition hover:border-navy-400 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Ajouter un ${label.toLowerCase()}`}
          className="size-8 rounded-full border border-navy-200 text-lg leading-none text-navy-700 transition hover:border-navy-400 disabled:opacity-40"
        >
          +
        </button>
      </span>
    </div>
  );
}

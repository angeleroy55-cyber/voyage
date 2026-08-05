"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import OfferCard from "@/components/ui/OfferCard";
import { price } from "@/lib/format";
import type { Offer } from "@/lib/types";

type Sort = "recommande" | "prix" | "prix-desc" | "note" | "remise";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recommande", label: "Recommandés" },
  { id: "prix", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "note", label: "Meilleures notes" },
  { id: "remise", label: "Plus fortes remises" },
];

export default function ResultsView({
  offers,
  initialSort = "recommande",
  query = "",
}: {
  offers: Offer[];
  initialSort?: Sort;
  query?: string;
}) {
  const bounds = useMemo(() => {
    const prices = offers.map((o) => o.price);
    return { min: Math.min(...prices, 0), max: Math.max(...prices, 100) };
  }, [offers]);

  const [sort, setSort] = useState<Sort>(initialSort);
  const [maxPrice, setMaxPrice] = useState(bounds.max);
  const [stars, setStars] = useState<number[]>([]);
  const [boards, setBoards] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const boardOptions = useMemo(
    () => Array.from(new Set(offers.map((o) => o.board))),
    [offers],
  );
  const starOptions = useMemo(
    () => Array.from(new Set(offers.map((o) => o.stars).filter((s) => s > 0))).sort((a, b) => b - a),
    [offers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = offers.filter((o) => {
      if (o.price > maxPrice) return false;
      if (stars.length && !stars.includes(o.stars)) return false;
      if (boards.length && !boards.includes(o.board)) return false;
      if (o.rating < minRating) return false;
      if (
        q &&
        !`${o.title} ${o.destination} ${o.country} ${o.region}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "prix":
          return a.price - b.price;
        case "prix-desc":
          return b.price - a.price;
        case "note":
          return b.rating - a.rating;
        case "remise": {
          const ra = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
          const rb = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
          return rb - ra;
        }
        default:
          return b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10);
      }
    });
    return list;
  }, [offers, maxPrice, stars, boards, minRating, sort, query]);

  function toggle<T>(value: T, list: T[], set: (v: T[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function reset() {
    setMaxPrice(bounds.max);
    setStars([]);
    setBoards([]);
    setMinRating(0);
  }

  const active = stars.length + boards.length + (minRating > 0 ? 1 : 0) + (maxPrice < bounds.max ? 1 : 0);

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">Filtres</h2>
        {active > 0 && (
          <button onClick={reset} className="text-xs font-semibold text-gold-700 hover:underline">
            Tout effacer ({active})
          </button>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-navy-800">Budget maximum</legend>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-3 w-full accent-gold-500"
          aria-label="Budget maximum par personne"
        />
        <p className="mt-1 text-sm text-navy-600">
          Jusqu&apos;à <strong className="text-navy-900">{price(maxPrice)}</strong> par personne
        </p>
      </fieldset>

      {starOptions.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-navy-800">Catégorie</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {starOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s, stars, setStars)}
                aria-pressed={stars.includes(s)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  stars.includes(s)
                    ? "border-navy-700 bg-navy-700 text-white"
                    : "border-navy-200 text-navy-700 hover:border-navy-400"
                }`}
              >
                {s}
                <Icon name="star" className="size-3.5 fill-current" />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-navy-800">Restauration</legend>
        <div className="mt-2 space-y-1.5">
          {boardOptions.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={boards.includes(b)}
                onChange={() => toggle(b, boards, setBoards)}
                className="size-4 rounded border-navy-300 accent-gold-500"
              />
              {b}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-navy-800">Note des voyageurs</legend>
        <div className="mt-2 space-y-1.5">
          {[
            { v: 0, l: "Toutes les notes" },
            { v: 8, l: "8+ Très bien" },
            { v: 8.5, l: "8,5+ Excellent" },
            { v: 9, l: "9+ Exceptionnel" },
          ].map((r) => (
            <label key={r.v} className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-700">
              <input
                type="radio"
                name="rating"
                checked={minRating === r.v}
                onChange={() => setMinRating(r.v)}
                className="size-4 accent-gold-500"
              />
              {r.l}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          {filters}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy-600">
            <strong className="text-navy-900">{filtered.length}</strong> offre
            {filtered.length > 1 ? "s" : ""} correspondent à votre recherche
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm font-semibold text-navy-800 lg:hidden"
            >
              <Icon name="filter" className="size-4" />
              Filtres{active > 0 && ` (${active})`}
            </button>
            <label className="flex items-center gap-2 rounded-xl border border-navy-200 px-3 py-2.5 text-sm">
              <span className="text-navy-500">Trier par</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="cursor-pointer bg-transparent font-semibold text-navy-900 outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-navy-200 p-12 text-center">
            <p className="text-lg font-bold text-navy-900">Aucune offre avec ces critères</p>
            <p className="mt-1 text-sm text-navy-600">
              Élargissez votre budget ou retirez un filtre pour voir plus de résultats.
            </p>
            <button
              onClick={reset}
              className="mt-4 rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <OfferCard key={o.slug} offer={o} layout="row" />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-extrabold text-navy-900">Filtrer</span>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Fermer les filtres"
                className="rounded p-1.5 text-navy-600"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            {filters}
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-6 w-full rounded-xl bg-gold-400 py-3 text-sm font-bold text-navy-900"
            >
              Voir les {filtered.length} offres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import OfferCard from "@/components/ui/OfferCard";
import Reveal from "@/components/ui/Reveal";
import { price } from "@/lib/format";
import type { Offer } from "@/lib/types";

/**
 * Liste de résultats et son panneau de filtres.
 *
 * Deux principes gouvernent ce composant :
 *
 * 1. l'URL fait foi. Chaque critère y est écrit (`replace`, sans empiler
 *    d'entrées d'historique), si bien qu'une recherche filtrée se partage, se
 *    met en favori et survit à un rechargement ;
 * 2. les compteurs sont « à facettes ». Le nombre affiché en face d'une option
 *    est calculé en ignorant sa propre catégorie de filtre : cocher « 5 étoiles »
 *    ne fait donc pas tomber à zéro les compteurs des autres catégories.
 */

export type Sort = "recommande" | "prix" | "prix-desc" | "note" | "remise" | "duree";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recommande", label: "Recommandés" },
  { id: "prix", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "note", label: "Meilleures notes" },
  { id: "remise", label: "Plus fortes remises" },
  { id: "duree", label: "Durée du séjour" },
];

const DURATIONS = [
  { id: "court", label: "1 à 3 nuits", min: 1, max: 3 },
  { id: "moyen", label: "4 à 7 nuits", min: 4, max: 7 },
  { id: "long", label: "8 nuits et plus", min: 8, max: Infinity },
] as const;

const RATINGS = [
  { value: 0, label: "Toutes les notes" },
  { value: 8, label: "8+ Très bien" },
  { value: 8.5, label: "8,5+ Excellent" },
  { value: 9, label: "9+ Exceptionnel" },
];

const PAGE_SIZE = 8;

/** Critères repris de la barre de recherche, réécrits tels quels dans l'URL. */
export type CarriedParams = {
  du?: string;
  au?: string;
  depart?: string;
  voyageurs?: string;
  flex?: string;
};

export type InitialFilters = {
  q: string;
  sort: Sort;
  minPrice?: number;
  maxPrice?: number;
  stars: number[];
  boards: string[];
  cities: string[];
  durations: string[];
  tags: string[];
  minRating: number;
  dealsOnly: boolean;
};

type State = Omit<InitialFilters, "q">;

export default function ResultsView({
  offers,
  initial,
  query = "",
  carried = {},
}: {
  offers: Offer[];
  initial: InitialFilters;
  query?: string;
  carried?: CarriedParams;
}) {
  const router = useRouter();

  const bounds = useMemo(() => {
    const prices = offers.map((o) => o.price);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 1000,
    };
  }, [offers]);

  // Le pas du curseur s'adapte à l'amplitude du catalogue : 10 € sur des
  // escapades à 150 €, 50 € sur des circuits à 3 000 €.
  const step = bounds.max - bounds.min > 1500 ? 50 : 10;

  const [state, setState] = useState<State>(() => ({
    sort: initial.sort,
    minPrice: clamp(initial.minPrice ?? bounds.min, bounds.min, bounds.max),
    maxPrice: clamp(initial.maxPrice ?? bounds.max, bounds.min, bounds.max),
    stars: initial.stars,
    boards: initial.boards,
    cities: initial.cities,
    durations: initial.durations,
    tags: initial.tags,
    minRating: initial.minRating,
    dealsOnly: initial.dealsOnly,
  }));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const set = <K extends keyof State>(key: K, value: State[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const toggleStar = (value: number) => set("stars", toggleIn(state.stars, value));
  const toggleBoard = (value: string) => set("boards", toggleIn(state.boards, value));
  const toggleCity = (value: string) => set("cities", toggleIn(state.cities, value));
  const toggleDuration = (value: string) => set("durations", toggleIn(state.durations, value));
  const toggleTag = (value: string) => set("tags", toggleIn(state.tags, value));

  // ---- Options proposées, déduites du catalogue reçu -----------------------

  const options = useMemo(
    () => ({
      stars: unique(offers.map((o) => o.stars).filter((s) => s > 0)).sort((a, b) => b - a),
      boards: unique(offers.map((o) => o.board)),
      cities: unique(offers.map((o) => o.departureCity).filter(Boolean)),
      tags: unique(offers.flatMap((o) => o.tags)).slice(0, 12),
      // Une catégorie sans nuitée (vols, location) n'a pas de durée à filtrer.
      hasNights: offers.some((o) => o.nights > 0),
    }),
    [offers],
  );

  // ---- Filtrage ------------------------------------------------------------

  /**
   * Applique tous les critères sauf celui passé en `skip`, ce qui sert aussi
   * bien au résultat final (`skip` absent) qu'aux compteurs de facettes.
   */
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (skip?: keyof State) =>
      offers.filter((offer) => {
        if (
          q &&
          !`${offer.title} ${offer.destination} ${offer.country} ${offer.region}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }
        if (skip !== "minPrice" && skip !== "maxPrice") {
          if (offer.price < (state.minPrice ?? bounds.min)) return false;
          if (offer.price > (state.maxPrice ?? bounds.max)) return false;
        }
        if (skip !== "stars" && state.stars.length && !state.stars.includes(offer.stars)) {
          return false;
        }
        if (skip !== "boards" && state.boards.length && !state.boards.includes(offer.board)) {
          return false;
        }
        if (
          skip !== "cities" &&
          state.cities.length &&
          !state.cities.includes(offer.departureCity)
        ) {
          return false;
        }
        if (skip !== "durations" && state.durations.length) {
          const inBucket = state.durations.some((id) => {
            const bucket = DURATIONS.find((d) => d.id === id);
            return bucket ? offer.nights >= bucket.min && offer.nights <= bucket.max : false;
          });
          if (!inBucket) return false;
        }
        if (skip !== "tags" && state.tags.length) {
          if (!state.tags.some((tag) => offer.tags.includes(tag))) return false;
        }
        if (skip !== "minRating" && offer.rating < state.minRating) return false;
        if (skip !== "dealsOnly" && state.dealsOnly) {
          if (!offer.oldPrice || offer.oldPrice <= offer.price) return false;
        }
        return true;
      });
  }, [offers, query, state, bounds.min, bounds.max]);

  const filtered = useMemo(() => {
    const list = matching();
    return [...list].sort((a, b) => {
      switch (state.sort) {
        case "prix":
          return a.price - b.price;
        case "prix-desc":
          return b.price - a.price;
        case "note":
          return b.rating - a.rating;
        case "duree":
          return b.nights - a.nights;
        case "remise":
          return rate(b) - rate(a);
        default:
          // « Recommandés » : la note pondérée par le volume d'avis, pour
          // qu'un 9,8 sur douze avis ne passe pas devant un 9,1 sur trois mille.
          return (
            b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10)
          );
      }
    });
  }, [matching, state.sort]);

  /** Nombre d'offres restantes si l'on ajoutait cette valeur au filtre. */
  const countFor = useMemo(() => {
    return (facet: keyof State, predicate: (offer: Offer) => boolean) =>
      matching(facet).filter(predicate).length;
  }, [matching]);

  // ---- Synchronisation avec l'URL -----------------------------------------

  // Les critères issus de la barre de recherche (dates, ville, voyageurs) sont
  // figés à l'arrivée sur la page : les mémoriser évite que l'objet reçu en
  // prop, recréé à chaque rendu, ne relance la synchronisation en boucle.
  const carriedRef = useRef(carried);

  const first = useRef(true);
  useEffect(() => {
    // Le premier rendu reflète déjà l'URL : la réécrire ne ferait qu'ajouter
    // une navigation inutile au chargement.
    if (first.current) {
      first.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    for (const [key, value] of Object.entries(carriedRef.current)) {
      if (value) params.set(key, value);
    }
    if (state.sort !== "recommande") params.set("tri", state.sort);
    if (state.minPrice != null && state.minPrice > bounds.min) {
      params.set("prixMin", String(state.minPrice));
    }
    if (state.maxPrice != null && state.maxPrice < bounds.max) {
      params.set("prixMax", String(state.maxPrice));
    }
    if (state.stars.length) params.set("etoiles", state.stars.join(","));
    if (state.boards.length) params.set("pension", state.boards.join(","));
    if (state.cities.length) params.set("villes", state.cities.join(","));
    if (state.durations.length) params.set("duree", state.durations.join(","));
    if (state.tags.length) params.set("themes", state.tags.join(","));
    if (state.minRating > 0) params.set("note", String(state.minRating));
    if (state.dealsOnly) params.set("promo", "1");

    const search = params.toString();
    const path = window.location.pathname;
    // `replace` plutôt que `push` : filtrer n'est pas naviguer, et le bouton
    // « retour » doit ramener à la page précédente, pas dérouler à l'envers
    // chaque case cochée.
    router.replace(search ? `${path}?${search}` : path, { scroll: false });
    setVisible(PAGE_SIZE);
  }, [state, query, bounds.min, bounds.max, router]);

  // ---- Résumé des filtres actifs ------------------------------------------

  const chips: { label: string; clear: () => void }[] = [];
  if (state.minPrice != null && state.minPrice > bounds.min) {
    chips.push({ label: `À partir de ${price(state.minPrice)}`, clear: () => set("minPrice", bounds.min) });
  }
  if (state.maxPrice != null && state.maxPrice < bounds.max) {
    chips.push({ label: `Jusqu'à ${price(state.maxPrice)}`, clear: () => set("maxPrice", bounds.max) });
  }
  for (const s of state.stars) {
    chips.push({ label: `${s} étoiles`, clear: () => toggleStar(s) });
  }
  for (const b of state.boards) {
    chips.push({ label: b, clear: () => toggleBoard(b) });
  }
  for (const c of state.cities) {
    chips.push({ label: `Départ ${c}`, clear: () => toggleCity(c) });
  }
  for (const d of state.durations) {
    const bucket = DURATIONS.find((x) => x.id === d);
    if (bucket) chips.push({ label: bucket.label, clear: () => toggleDuration(d) });
  }
  for (const t of state.tags) {
    chips.push({ label: t, clear: () => toggleTag(t) });
  }
  if (state.minRating > 0) {
    chips.push({
      label: RATINGS.find((r) => r.value === state.minRating)?.label ?? `${state.minRating}+`,
      clear: () => set("minRating", 0),
    });
  }
  if (state.dealsOnly) {
    chips.push({ label: "En promotion", clear: () => set("dealsOnly", false) });
  }

  function reset() {
    setState({
      sort: state.sort,
      minPrice: bounds.min,
      maxPrice: bounds.max,
      stars: [],
      boards: [],
      cities: [],
      durations: [],
      tags: [],
      minRating: 0,
      dealsOnly: false,
    });
  }

  // ---- Panneau de filtres --------------------------------------------------

  const panel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">Filtres</h2>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-gold-700 transition hover:underline"
          >
            Tout effacer ({chips.length})
          </button>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-navy-800">Budget par personne</legend>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs text-navy-500">Minimum</span>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={state.minPrice ?? bounds.min}
              onChange={(e) =>
                // Les deux curseurs ne peuvent pas se croiser : le minimum est
                // borné par le maximum courant, et réciproquement.
                set("minPrice", Math.min(Number(e.target.value), state.maxPrice ?? bounds.max))
              }
              className="mt-1 w-full accent-gold-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-navy-500">Maximum</span>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={state.maxPrice ?? bounds.max}
              onChange={(e) =>
                set("maxPrice", Math.max(Number(e.target.value), state.minPrice ?? bounds.min))
              }
              className="mt-1 w-full accent-gold-500"
            />
          </label>
          <p className="text-sm text-navy-600">
            De <strong className="text-navy-900">{price(state.minPrice ?? bounds.min)}</strong> à{" "}
            <strong className="text-navy-900">{price(state.maxPrice ?? bounds.max)}</strong>
          </p>
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-gold-50 p-3 text-sm text-navy-800">
        <input
          type="checkbox"
          checked={state.dealsOnly}
          onChange={(e) => set("dealsOnly", e.target.checked)}
          className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
        />
        <span className="min-w-0 flex-1">
          <span className="font-semibold">Uniquement les promotions</span>
          <Count value={countFor("dealsOnly", (o) => Boolean(o.oldPrice && o.oldPrice > o.price))} />
        </span>
      </label>

      {options.stars.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-navy-800">Catégorie</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.stars.map((s) => {
              const on = state.stars.includes(s);
              const count = countFor("stars", (o) => o.stars === s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStar(s)}
                  aria-pressed={on}
                  disabled={count === 0 && !on}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    on
                      ? "border-navy-700 bg-navy-700 text-white"
                      : "border-navy-200 text-navy-700 hover:border-navy-400 disabled:opacity-40"
                  }`}
                >
                  {s}
                  <Icon name="star" className="size-3.5 fill-current" />
                  <span className={on ? "text-white" : "text-navy-400"}>({count})</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <CheckList
        legend="Restauration"
        values={options.boards}
        selected={state.boards}
        onToggle={(value) => toggleBoard(value)}
        count={(value) => countFor("boards", (o) => o.board === value)}
      />

      {options.hasNights && (
        <CheckList
          legend="Durée"
          values={DURATIONS.map((d) => d.id)}
          labels={Object.fromEntries(DURATIONS.map((d) => [d.id, d.label]))}
          selected={state.durations}
          onToggle={(value) => toggleDuration(value)}
          count={(value) => {
            const bucket = DURATIONS.find((d) => d.id === value);
            return bucket
              ? countFor("durations", (o) => o.nights >= bucket.min && o.nights <= bucket.max)
              : 0;
          }}
        />
      )}

      {options.cities.length > 1 && (
        <CheckList
          legend="Ville de départ"
          values={options.cities}
          selected={state.cities}
          onToggle={(value) => toggleCity(value)}
          count={(value) => countFor("cities", (o) => o.departureCity === value)}
        />
      )}

      <fieldset>
        <legend className="text-sm font-bold text-navy-800">Note des voyageurs</legend>
        <div className="mt-2 space-y-1.5">
          {RATINGS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-navy-700"
            >
              <input
                type="radio"
                name="rating"
                checked={state.minRating === r.value}
                onChange={() => set("minRating", r.value)}
                className="size-4 accent-gold-500"
              />
              <span className="flex-1">{r.label}</span>
              <Count value={countFor("minRating", (o) => o.rating >= r.value)} />
            </label>
          ))}
        </div>
      </fieldset>

      {options.tags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-navy-800">Thématiques</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.tags.map((tag) => {
              const on = state.tags.includes(tag);
              const count = countFor("tags", (o) => o.tags.includes(tag));
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={on}
                  disabled={count === 0 && !on}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    on
                      ? "border-gold-400 bg-gold-400 text-navy-900"
                      : "border-navy-200 text-navy-700 hover:border-navy-400 disabled:opacity-40"
                  }`}
                >
                  {tag} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );

  const shown = filtered.slice(0, visible);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy-600">
            <strong className="text-navy-900 tabular-nums">{filtered.length}</strong> offre
            {filtered.length > 1 ? "s" : ""} sur {offers.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400 lg:hidden"
            >
              <Icon name="filter" className="size-4" />
              Filtres
              {chips.length > 0 && (
                <span className="rounded-full bg-gold-400 px-1.5 text-xs font-bold text-navy-900">
                  {chips.length}
                </span>
              )}
            </button>
            <label className="flex items-center gap-2 rounded-xl border border-navy-200 px-3 py-2.5 text-sm transition focus-within:border-navy-400">
              <span className="text-navy-500">Trier par</span>
              <select
                value={state.sort}
                onChange={(e) => set("sort", e.target.value as Sort)}
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

        {chips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="animate-fade-up flex items-center gap-1.5 rounded-full border border-navy-200 bg-white py-1.5 pl-3 pr-2 text-xs font-semibold text-navy-700 transition hover:border-navy-400 hover:text-navy-900"
              >
                {chip.label}
                <Icon name="close" className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-gold-700 transition hover:underline"
            >
              Tout effacer
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border border-dashed border-navy-200 p-12 text-center">
            <p className="text-lg font-bold text-navy-900">Aucune offre avec ces critères</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
              Élargissez votre budget ou retirez un filtre : {offers.length} offres sont disponibles
              dans cette catégorie.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {shown.map((offer, index) => (
                <Reveal
                  key={offer.slug}
                  // Au-delà des premières cartes le décalage n'apporte rien :
                  // elles sont chargées d'un coup au clic sur « Voir plus ».
                  delay={Math.min(index, 4) * 60}
                >
                  <OfferCard offer={offer} layout="row" />
                </Reveal>
              ))}
            </div>

            {visible < filtered.length && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-xl border border-navy-200 px-6 py-3 text-sm font-bold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
                >
                  Voir {Math.min(PAGE_SIZE, filtered.length - visible)} offres de plus
                </button>
                <p className="mt-2 text-xs text-navy-500">
                  {visible} sur {filtered.length} affichées
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tiroir de filtres, sur mobile uniquement */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-overlay-in absolute inset-0 bg-navy-900/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="animate-sheet-in absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-extrabold text-navy-900">Filtrer</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fermer les filtres"
                className="rounded p-1.5 text-navy-600"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            {panel}
            <button
              type="button"
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

// ---- Sous-composants et utilitaires ---------------------------------------

function CheckList({
  legend,
  values,
  labels,
  selected,
  onToggle,
  count,
}: {
  legend: string;
  values: readonly string[];
  labels?: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
  count: (value: string) => number;
}) {
  if (values.length === 0) return null;
  return (
    <fieldset>
      <legend className="text-sm font-bold text-navy-800">{legend}</legend>
      <div className="mt-2 space-y-1.5">
        {values.map((value) => {
          const on = selected.includes(value);
          const total = count(value);
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2.5 text-sm transition ${
                total === 0 && !on ? "text-navy-400" : "text-navy-700 hover:text-navy-900"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(value)}
                disabled={total === 0 && !on}
                className="size-4 rounded border-navy-300 accent-gold-500"
              />
              <span className="flex-1">{labels?.[value] ?? value}</span>
              <Count value={total} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Count({ value }: { value: number }) {
  return <span className="text-xs tabular-nums text-navy-400">{value}</span>;
}

function unique<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

/** Ajoute ou retire une valeur d'une sélection multiple. */
function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Taux de remise, 0 si l'offre n'a pas de prix barré. */
function rate(offer: Offer): number {
  return offer.oldPrice && offer.oldPrice > offer.price
    ? (offer.oldPrice - offer.price) / offer.oldPrice
    : 0;
}

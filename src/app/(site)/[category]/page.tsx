import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ResultsView from "@/components/search/ResultsView";
import SearchWidget from "@/components/search/SearchWidget";
import Icon from "@/components/ui/Icon";
import {
  getCategories,
  getCategoryBySlug,
  getOffers,
  getRuleOffers,
  getSearchCategories,
} from "@/server/catalogue";
import { subtypeBlurb, subtypeLabel } from "@/lib/constants";
import { SEASONS, inSeason, seasonById } from "@/lib/seasons";
import type { InitialFilters, Sort } from "@/components/search/ResultsView";
import type { CategoryId, Offer } from "@/lib/types";

/**
 * Page de catégorie, à la racine : /sejours, /circuits, /bons-plans-promos…
 *
 * Le cahier de catégorisation fait du slug de catégorie une URL de premier
 * niveau, la structure de mots-clés étant le premier des trois piliers du
 * projet. Les anciennes adresses /recherche/[categorie] redirigent en 308
 * depuis `next.config.ts`.
 *
 * Un segment dynamique à la racine attrape tout ce qui n'est pas déjà une route
 * statique (/aide, /blog, /destinations…), qui restent prioritaires. Un slug
 * inconnu tombe donc ici, et rend un 404.
 */

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

const SORTS: readonly Sort[] = [
  "recommande",
  "prix",
  "prix-desc",
  "note",
  "remise",
  "duree",
];

/** Première valeur d'un paramètre, quel que soit le nombre d'occurrences. */
function text(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

/** Paramètre entier positif ; `undefined` si absent ou non numérique. */
function integer(value: string | string[] | undefined): number | undefined {
  const raw = text(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : undefined;
}

/** Liste séparée par des virgules : « Spa,Famille » donne ["Spa", "Famille"]. */
function list(value: string | string[] | undefined): string[] {
  const raw = text(value);
  if (!raw) return [];
  return Array.from(new Set(raw.split(",").map((item) => item.trim()).filter(Boolean)));
}

function readFilters(sp: Params): InitialFilters {
  const sortParam = text(sp.tri);
  const rating = Number(text(sp.note));

  return {
    q: text(sp.q) ?? "",
    sort: SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : "recommande",
    minPrice: integer(sp.prixMin),
    maxPrice: integer(sp.prixMax),
    stars: list(sp.etoiles)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5),
    boards: list(sp.pension),
    cities: list(sp.villes),
    durations: list(sp.duree).filter((d) => ["court", "moyen", "long"].includes(d)),
    tags: list(sp.themes),
    minRating: Number.isFinite(rating) && rating > 0 && rating <= 10 ? rating : 0,
    dealsOnly: text(sp.promo) === "1",
  };
}

export async function generateMetadata({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const found = await getCategoryBySlug(category);
  if (!found) return { title: "Page introuvable" };
  return { title: `${found.title || found.label} : nos offres`, description: found.blurb };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[category]">) {
  const { category } = await params;
  const sp = await searchParams;

  const found = await getCategoryBySlug(category);
  if (!found) notFound();
  // Le hub a sa propre page ; la route statique la sert avant d'arriver ici,
  // cette redirection ne couvre qu'un alias créé au back-office.
  if (found.kind === "hub") redirect("/destinations");

  const heading = found.title || found.label;

  const [toutesLesOffres, searchCategories, categories] = await Promise.all([
    found.kind === "dynamique"
      ? getRuleOffers(found.rule)
      : found.kind === "catalogue"
        ? getOffers(found.slug)
        : Promise.resolve([]),
    getSearchCategories(),
    getCategories(),
  ]);

  // L'URL porte l'intégralité des critères : elle est donc décodée ici, côté
  // serveur, pour que le premier rendu soit déjà filtré. Toute valeur douteuse
  // est écartée plutôt que corrigée : un paramètre bricolé à la main ne doit
  // pas pouvoir vider la page.
  const filters = readFilters(sp);
  const carried = {
    du: text(sp.du),
    au: text(sp.au),
    depart: text(sp.depart),
    voyageurs: text(sp.voyageurs),
    flex: text(sp.flex),
  };

  // Le moteur de recherche n'a d'onglet que pour les catégories du catalogue :
  // une page « Bons plans » ouvre donc sur l'onglet Séjours, le plus large.
  const activeTab = searchCategories.some((c) => c.id === found.slug)
    ? found.slug
    : (searchCategories[0]?.id ?? "sejours");

  // Formule et saison affinent la liste sans changer d'adresse : ce sont des
  // filtres, pas des pages. Le cahier l'impose pour ne pas créer deux URLs
  // décrivant le même catalogue sous deux angles.
  const formule = text(sp.formule);
  const saison = seasonById(text(sp.saison));

  const formules = compterFormules(toutesLesOffres);
  const offers = toutesLesOffres.filter((offre) => {
    if (formule && offre.subtype !== formule) return false;
    if (saison) {
      if (!offre.departureDate) return false;
      if (!inSeason(new Date(`${offre.departureDate}T12:00:00`), saison)) return false;
    }
    return true;
  });

  // Les saisons proposées sont celles qui ont réellement des départs : une
  // pastille « Noël » sans une seule offre derrière déçoit au premier clic.
  const saisons = SEASONS.map((s) => ({
    ...s,
    count: toutesLesOffres.filter(
      (offre) =>
        offre.departureDate &&
        inSeason(new Date(`${offre.departureDate}T12:00:00`), s),
    ).length,
  })).filter((s) => s.count > 0);

  // Partagée par la case « vide » ci-dessous et par « Autres façons de
  // voyager » en pied de page : les mêmes suggestions, à deux endroits.
  const autresCategories = categories.filter((c) => c.slug !== found.slug && c.kind !== "editorial");

  return (
    <>
      <div className="border-b border-navy-100 bg-navy-50/60 py-5">
        <div className="mx-auto max-w-page px-4">
          <nav
            aria-label="Fil d'Ariane"
            className="mb-3 flex items-center gap-1.5 text-xs text-navy-500"
          >
            <Link href="/" className="hover:text-gold-700">
              Accueil
            </Link>
            <Icon name="chevronRight" className="size-3" />
            <span className="font-semibold text-navy-800">{heading}</span>
          </nav>
          <SearchWidget
            categories={searchCategories}
            initial={activeTab as CategoryId}
            values={{ ...carried, q: filters.q }}
            compact
          />
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          {heading}
          {formule && <span className="text-navy-500"> · {subtypeLabel(formule)}</span>}
          {saison && <span className="text-navy-500"> · {saison.label}</span>}
          {filters.q && <span className="text-navy-500"> · « {filters.q} »</span>}
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {formule ? subtypeBlurb(formule) || found.blurb : saison ? saison.blurb : found.blurb}
        </p>

        {formules.length > 1 && (
          <FiltreRapide
            titre="Formule"
            base={`/${found.slug}`}
            actif={formule}
            parametre="formule"
            autres={saison ? { saison: saison.id } : {}}
            options={formules.map((f) => ({
              id: f.id,
              label: subtypeLabel(f.id),
              count: f.count,
            }))}
          />
        )}

        {saisons.length > 1 && (
          <FiltreRapide
            titre="Période de départ"
            base={`/${found.slug}`}
            actif={saison?.id}
            parametre="saison"
            autres={formule ? { formule } : {}}
            options={saisons.map((s) => ({ id: s.id, label: s.label, count: s.count }))}
          />
        )}

        <div className="mb-7" />

        {found.kind === "editorial" ? (
          <EditorialBlock label={heading} blurb={found.blurb} />
        ) : offers.length === 0 ? (
          // Une phrase seule laisse le visiteur sans suite : la case propose
          // tout de suite deux ou trois catégories voisines, plutôt que de
          // compter sur le bloc « Autres façons de voyager » plus bas.
          <div className="rounded-2xl border border-dashed border-navy-200 p-10 text-center">
            <p className="text-sm text-navy-500">
              Aucune offre publiée dans cette catégorie pour le moment.
            </p>
            {autresCategories.length > 0 && (
              <>
                <p className="mt-1 text-sm text-navy-500">
                  Le catalogue est mis à jour tous les jours : essayez plutôt l&apos;une de ces
                  catégories.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {autresCategories.slice(0, 3).map((c) => (
                    <Link
                      key={c.id}
                      href={`/${c.slug}`}
                      className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
                    >
                      <Icon name={c.icon} className="size-4" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <ResultsView
            offers={offers}
            initial={filters}
            query={filters.q}
            carried={carried}
          />
        )}

        <div className="mt-12 rounded-2xl border border-navy-100 bg-navy-50/60 p-6">
          <h2 className="text-base font-extrabold text-navy-900">Autres façons de voyager</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {autresCategories.map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
              >
                <Icon name={c.icon} className="size-4" />
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** Formules présentes dans une liste d'offres, dans l'ordre du menu. */
function compterFormules(offers: Offer[]): { id: string; count: number }[] {
  const compte = new Map<string, number>();
  for (const offre of offers) {
    if (!offre.subtype || !subtypeLabel(offre.subtype)) continue;
    compte.set(offre.subtype, (compte.get(offre.subtype) ?? 0) + 1);
  }
  return [...compte.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Bandeau de filtres rapides, rendu en liens et non en boutons.
 *
 * Chaque filtre est une adresse : elle se partage, se met en favori, et remonte
 * dans l'historique. Un filtre porté par du JavaScript seul perdrait ces trois
 * propriétés, et ne serait pas suivi par les moteurs.
 */
function FiltreRapide({
  titre,
  base,
  parametre,
  actif,
  autres,
  options,
}: {
  titre: string;
  base: string;
  parametre: string;
  actif?: string;
  autres: Record<string, string>;
  options: { id: string; label: string; count: number }[];
}) {
  const lien = (valeur?: string) => {
    const params = new URLSearchParams(autres);
    if (valeur) params.set(parametre, valeur);
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-navy-500">{titre}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={lien()}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
            actif
              ? "border-navy-200 bg-white text-navy-600 hover:border-gold-300"
              : "border-navy-900 bg-navy-900 text-white"
          }`}
        >
          Tout
        </Link>
        {options.map((option) => {
          const on = option.id === actif;
          return (
            <Link
              key={option.id}
              href={lien(option.id)}
              aria-current={on ? "true" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                on
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-navy-200 bg-white text-navy-600 hover:border-gold-300 hover:text-gold-700"
              }`}
            >
              {option.label}
              <span className={`ml-1.5 tabular-nums ${on ? "text-white/70" : "text-navy-400"}`}>
                {option.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Page de service, sans catalogue derrière : le sur-mesure, les groupes,
 * l'assurance. Elle renvoie vers un conseiller au lieu d'afficher une liste
 * vide, l'offre se construisant au téléphone.
 */
function EditorialBlock({ label, blurb }: { label: string; blurb: string }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-8 shadow-card">
      <h2 className="text-lg font-extrabold text-navy-900">{label}, comment ça marche</h2>
      <p className="mt-2 max-w-2xl text-sm text-navy-600">{blurb}</p>
      <p className="mt-4 max-w-2xl text-sm text-navy-600">
        Cette prestation se construit avec un conseiller : décrivez votre projet,
        nous revenons vers vous sous 48 heures avec une proposition chiffrée.
      </p>
      <Link
        href="/aide#contact"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
      >
        Parler à un conseiller
        <Icon name="chevronRight" className="size-4" />
      </Link>
    </div>
  );
}

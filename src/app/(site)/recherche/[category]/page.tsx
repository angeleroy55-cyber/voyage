import Link from "next/link";
import { notFound } from "next/navigation";
import ResultsView from "@/components/search/ResultsView";
import SearchWidget from "@/components/search/SearchWidget";
import Icon from "@/components/ui/Icon";
import { getCategories, getOffers, getSearchCategories } from "@/server/catalogue";
import type { InitialFilters, Sort } from "@/components/search/ResultsView";
import type { CategoryId } from "@/lib/types";

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

/** Liste séparée par des virgules : « Spa,Famille » → ["Spa", "Famille"]. */
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

export async function generateMetadata({ params }: PageProps<"/recherche/[category]">) {
  const { category } = await params;
  const found = (await getCategories()).find((c) => c.slug === category);
  if (!found) return { title: "Recherche" };
  return { title: `${found.label} — nos offres`, description: found.blurb };
}

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/recherche/[category]">) {
  const { category } = await params;
  const sp = await searchParams;

  const categories = await getCategories();
  const found = categories.find((c) => c.slug === category);
  if (!found) notFound();

  const [offers, searchCategories] = await Promise.all([
    getOffers(found.slug),
    getSearchCategories(),
  ]);

  // L'URL porte l'intégralité des critères : elle est donc décodée ici, côté
  // serveur, pour que le premier rendu soit déjà filtré. Toute valeur douteuse
  // est écartée plutôt que corrigée — un paramètre bricolé à la main ne doit
  // pas pouvoir vider la page.
  const filters = readFilters(sp);
  const carried = {
    du: text(sp.du),
    au: text(sp.au),
    depart: text(sp.depart),
    voyageurs: text(sp.voyageurs),
    flex: text(sp.flex),
  };

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
            <span className="font-semibold text-navy-800">{found.label}</span>
          </nav>
          <SearchWidget
            categories={searchCategories}
            initial={found.slug as CategoryId}
            values={{ ...carried, q: filters.q }}
            compact
          />
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          {found.label}
          {filters.q && <span className="text-navy-500"> — « {filters.q} »</span>}
        </h1>
        <p className="mb-7 mt-1 text-sm text-navy-600">{found.blurb}</p>

        {offers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy-200 p-12 text-center text-sm text-navy-500">
            Aucune offre publiée dans cette catégorie pour le moment.
          </p>
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
            {categories
              .filter((c) => c.slug !== found.slug)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/recherche/${c.slug}`}
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

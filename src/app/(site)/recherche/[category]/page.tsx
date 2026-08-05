import Link from "next/link";
import { notFound } from "next/navigation";
import ResultsView from "@/components/search/ResultsView";
import SearchWidget from "@/components/search/SearchWidget";
import Icon from "@/components/ui/Icon";
import { getCategories, getOffers } from "@/server/catalogue";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const offers = await getOffers(found.slug);

  const query = typeof sp.q === "string" ? sp.q : "";
  const allowedSorts = ["recommande", "prix", "prix-desc", "note", "remise"] as const;
  type Sort = (typeof allowedSorts)[number];
  const sortParam = typeof sp.tri === "string" ? sp.tri : "recommande";
  const sort: Sort = (allowedSorts as readonly string[]).includes(sortParam)
    ? (sortParam as Sort)
    : "recommande";

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
          <SearchWidget initial={found.slug as CategoryId} compact />
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          {found.label}
          {query && <span className="text-navy-500"> — « {query} »</span>}
        </h1>
        <p className="mb-7 mt-1 text-sm text-navy-600">{found.blurb}</p>

        {offers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy-200 p-12 text-center text-sm text-navy-500">
            Aucune offre publiée dans cette catégorie pour le moment.
          </p>
        ) : (
          <ResultsView offers={offers} initialSort={sort} query={query} />
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

import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getDestinations, getOffers, getSearchCategories } from "@/server/catalogue";
import { photo, price } from "@/lib/format";

export const metadata = { title: "Toutes les destinations" };
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const [destinations, offers, categories] = await Promise.all([
    getDestinations(),
    getOffers(),
    getSearchCategories(),
  ]);

  // Les pays sont regroupés par région à partir des offres réellement publiées :
  // une région disparaît d'elle-même quand plus aucune offre ne la concerne.
  const byRegion = offers.reduce<Record<string, Set<string>>>((acc, offer) => {
    if (!offer.region || !offer.country) return acc;
    (acc[offer.region] ??= new Set()).add(offer.country);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Destinations</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        Où voulez-vous partir&nbsp;?
      </h1>
      <p className="mt-1.5 text-sm text-navy-600">
        Parcourez nos destinations phares ou choisissez directement un type de voyage.
      </p>

      {destinations.length > 0 && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <Link
              key={destination.slug}
              href={`/recherche/vol-hotel?q=${encodeURIComponent(destination.name)}`}
              className="group relative aspect-4/3 overflow-hidden rounded-2xl"
            >
              <Image
                src={destination.image ?? photo(destination.imageSeed, 600, 450)}
                alt={destination.name}
                fill
                sizes="(max-width: 640px) 90vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy-900/85 via-navy-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-extrabold text-white">{destination.name}</p>
                <p className="text-xs text-navy-100">
                  {destination.offersCount.toLocaleString("fr-FR")} offres · dès{" "}
                  <span className="font-bold text-white">{price(destination.fromPrice)}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {Object.keys(byRegion).length > 0 && (
        <>
          <h2 className="mt-14 text-xl font-extrabold tracking-tight text-navy-900">Par région</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(byRegion)
              .sort(([a], [b]) => a.localeCompare(b, "fr"))
              .map(([region, countries]) => (
                <div key={region}>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">
                    {region}
                  </h3>
                  <ul className="mt-2.5 space-y-1.5">
                    {[...countries]
                      .sort((a, b) => a.localeCompare(b, "fr"))
                      .map((country) => (
                        <li key={country}>
                          <Link
                            href={`/recherche/vol-hotel?q=${encodeURIComponent(country)}`}
                            className="text-sm text-navy-600 transition hover:text-gold-700"
                          >
                            {country}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </>
      )}

      <h2 className="mt-14 text-xl font-extrabold tracking-tight text-navy-900">
        Par type de voyage
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/recherche/${category.id}`}
            className="group flex items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
              <Icon name={category.icon} className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-navy-900">{category.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-navy-600">
                {category.blurb}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

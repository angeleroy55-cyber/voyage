import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { CATEGORIES, DESTINATIONS, OFFERS } from "@/lib/data";
import { photo, price } from "@/lib/format";

export const metadata = { title: "Toutes les destinations" };

export default function DestinationsPage() {
  const byRegion = OFFERS.reduce<Record<string, Set<string>>>((acc, o) => {
    (acc[o.region] ??= new Set()).add(o.country);
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

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.slug}
            href={`/recherche/vol-hotel?q=${encodeURIComponent(d.name)}`}
            className="group relative aspect-4/3 overflow-hidden rounded-2xl"
          >
            <Image
              src={photo(d.imageSeed, 600, 450)}
              alt={d.name}
              fill
              sizes="(max-width: 640px) 90vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-navy-900/85 via-navy-900/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-lg font-extrabold text-white">{d.name}</p>
              <p className="text-xs text-navy-100">
                {d.offersCount.toLocaleString("fr-FR")} offres · dès{" "}
                <span className="font-bold text-white">{price(d.fromPrice)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 text-xl font-extrabold tracking-tight text-navy-900">Par région</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(byRegion)
          .sort(([a], [b]) => a.localeCompare(b, "fr"))
          .map(([region, countries]) => (
            <div key={region}>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">{region}</h3>
              <ul className="mt-2.5 space-y-1.5">
                {[...countries].sort((a, b) => a.localeCompare(b, "fr")).map((c) => (
                  <li key={c}>
                    <Link
                      href={`/recherche/vol-hotel?q=${encodeURIComponent(c)}`}
                      className="text-sm text-navy-600 transition hover:text-gold-700"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      <h2 className="mt-14 text-xl font-extrabold tracking-tight text-navy-900">Par type de voyage</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/recherche/${c.id}`}
            className="group flex items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
              <Icon name={c.icon} className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-navy-900">{c.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-navy-600">{c.blurb}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

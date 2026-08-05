import Image from "next/image";
import Link from "next/link";
import FavouriteButton from "@/components/account/FavouriteButton";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { discount, durationLabel, price } from "@/lib/format";
import { getFavourites } from "@/server/account";
import { requireCustomer } from "@/server/customer-session";

export const metadata = { title: "Mes favoris" };

export default async function FavouritesPage() {
  const session = await requireCustomer();
  const favourites = await getFavourites(session.sub);

  const cheapest = favourites.reduce(
    (min, item) => (item.offer.price < min ? item.offer.price : min),
    Infinity,
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Mes favoris</h1>
        <p className="mt-1 text-sm text-navy-600">
          {favourites.length > 0
            ? `${favourites.length} séjour${favourites.length > 1 ? "s" : ""} mis de côté, à partir de ${price(cheapest)} par personne.`
            : "Mettez des séjours de côté pour les comparer plus tard."}
        </p>
      </header>

      {favourites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-200 p-12 text-center">
          <Icon name="heart" className="mx-auto size-8 text-navy-300" />
          <p className="mt-3 text-lg font-bold text-navy-900">Aucun favori pour l&apos;instant</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
            Le cœur présent sur chaque offre permet de la retrouver ici, avec son prix suivi dans
            le temps.
          </p>
          <Link
            href="/recherche/vol-hotel"
            className="mt-4 inline-block rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
          >
            Parcourir les séjours
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favourites.map((item, index) => {
            const off = discount(item.offer.price, item.offer.oldPrice);
            return (
              <Reveal key={item.offer.slug} delay={Math.min(index, 5) * 60}>
                <article className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
                  <div className="relative aspect-16/10 overflow-hidden">
                    <Link href={`/offre/${item.offer.slug}`} className="absolute inset-0 block">
                      <Image
                        src={item.offer.image}
                        alt={`${item.offer.title}, ${item.offer.destination}`}
                        fill
                        sizes="(max-width: 640px) 90vw, 320px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </Link>
                    {off && (
                      <span className="absolute left-3 top-3 rounded-md bg-gold-400 px-2 py-1 text-xs font-bold text-navy-900">
                        −{off} %
                      </span>
                    )}
                    <div className="absolute right-3 top-3">
                      {/* Le retrait se fait sur place : la carte disparaît au
                          prochain rendu de la page. */}
                      <FavouriteButton slug={item.offer.slug} initial />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                      <Icon name="pin" className="size-3.5" />
                      {item.offer.destination}, {item.offer.country}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-navy-900">
                      <Link
                        href={`/offre/${item.offer.slug}`}
                        className="transition hover:text-gold-700"
                      >
                        {item.offer.title}
                      </Link>
                    </h2>

                    <div className="mt-2 flex items-center gap-2 text-xs text-navy-600">
                      <span className="rounded bg-navy-700 px-1.5 py-0.5 font-bold text-white tabular-nums">
                        {item.offer.rating.toFixed(1).replace(".", ",")}
                      </span>
                      <span>{item.offer.reviews.toLocaleString("fr-FR")} avis</span>
                      <span className="text-navy-400">·</span>
                      <span>{item.offer.board}</span>
                    </div>

                    {!item.offer.available && (
                      <p className="mt-3 rounded-lg bg-navy-50 px-2.5 py-1.5 text-[11px] font-semibold text-navy-600">
                        Séjour momentanément indisponible
                      </p>
                    )}

                    <div className="mt-auto flex items-end justify-between pt-4">
                      <span className="text-xs text-navy-500">
                        {durationLabel(item.offer.nights, item.offer.category)}
                      </span>
                      <span className="text-right">
                        {item.offer.oldPrice && (
                          <span className="block text-xs text-navy-400 line-through">
                            {price(item.offer.oldPrice)}
                          </span>
                        )}
                        <span className="block text-xl font-extrabold text-navy-900">
                          {price(item.offer.price)}
                        </span>
                        <span className="block text-[11px] text-navy-500">par personne</span>
                      </span>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

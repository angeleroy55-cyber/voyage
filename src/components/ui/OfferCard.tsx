import Image from "next/image";
import Link from "next/link";
import QuickView from "@/components/offer/QuickView";
import Icon from "@/components/ui/Icon";
import { discount, durationLabel, photo, price, ratingLabel } from "@/lib/format";
import type { Offer } from "@/lib/types";

export function Stars({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label={`${count} étoiles`}>
      {Array.from({ length: count }).map((_, i) => (
        <Icon key={i} name="star" className="size-3.5 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

export function RatingBadge({ score, reviews }: { score: number; reviews: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-navy-700 px-2 py-1 text-sm font-bold text-white tabular-nums">
        {score.toFixed(1).replace(".", ",")}
      </span>
      <span className="text-xs leading-tight text-navy-600">
        <span className="block font-semibold text-navy-800">{ratingLabel(score)}</span>
        {reviews.toLocaleString("fr-FR")} avis
      </span>
    </div>
  );
}

export default function OfferCard({ offer, layout = "grid" }: { offer: Offer; layout?: "grid" | "row" }) {
  const off = discount(offer.price, offer.oldPrice);

  if (layout === "row") {
    return (
      <article className="group hover-lift overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card sm:flex">
        {/* L'aperçu rapide est un bouton : il ne peut donc pas vivre dans le
            lien vers la fiche, d'où ce conteneur qui les porte côte à côte. */}
        <div className="relative overflow-hidden sm:w-80 sm:shrink-0">
          <Link href={`/offre/${offer.slug}`} className="block">
            {/* From sm up the wrapper is absolute, so the column takes its height from
                the text side and the zoom on hover stays clipped inside the image. */}
            <div className="relative aspect-16/10 sm:absolute sm:inset-0 sm:aspect-auto">
              <Image
                src={offer.image ?? photo(offer.imageSeed, 640, 400)}
                alt={`${offer.title}, ${offer.destination}`}
                fill
                sizes="(max-width: 640px) 100vw, 320px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            {off && (
              <span className="absolute left-3 top-3 z-10 rounded-md bg-gold-400 px-2 py-1 text-xs font-bold text-navy-900">
                −{off} %
              </span>
            )}
          </Link>
          <QuickView offer={offer} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
              <Icon name="pin" className="size-3.5" />
              {offer.destination}, {offer.country}
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug text-navy-900">
              <Link href={`/offre/${offer.slug}`} className="hover:text-gold-700">
                {offer.title}
              </Link>
            </h3>
            <Stars count={offer.stars} className="mt-1.5" />
            <p className="mt-2 line-clamp-2 text-sm text-navy-600">{offer.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {offer.amenities.slice(0, 4).map((a) => (
                <span key={a} className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-medium text-navy-600">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-row items-end justify-between gap-3 border-navy-100 sm:w-48 sm:flex-col sm:items-end sm:justify-between sm:border-l sm:pl-4">
            <RatingBadge score={offer.rating} reviews={offer.reviews} />
            <div className="text-right">
              <p className="text-xs text-navy-500">{durationLabel(offer.nights, offer.category)}</p>
              {offer.oldPrice && (
                <p className="text-sm text-navy-400 line-through">{price(offer.oldPrice)}</p>
              )}
              <p className="text-2xl font-extrabold text-navy-900">{price(offer.price)}</p>
              <p className="text-[11px] text-navy-500">par personne</p>
              <Link
                href={`/offre/${offer.slug}`}
                className="mt-2 inline-block rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
              >
                Voir l&apos;offre
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
      <div className="relative aspect-16/10 overflow-hidden">
        <Link href={`/offre/${offer.slug}`} className="absolute inset-0 block">
          <Image
            src={offer.image ?? photo(offer.imageSeed, 600, 375)}
            alt={`${offer.title}, ${offer.destination}`}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex justify-between p-3">
            {off ? (
              <span className="rounded-md bg-gold-400 px-2 py-1 text-xs font-bold text-navy-900">−{off} %</span>
            ) : (
              <span />
            )}
            {offer.tags[0] && (
              <span className="rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-navy-700">
                {offer.tags[0]}
              </span>
            )}
          </div>
        </Link>
        <QuickView offer={offer} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
          <Icon name="pin" className="size-3.5" />
          {offer.destination}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-navy-900">
          <Link href={`/offre/${offer.slug}`} className="hover:text-gold-700">
            {offer.title}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <Stars count={offer.stars} />
          <span className="text-xs text-navy-500">{offer.board}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-navy-600">
          <span className="rounded bg-navy-700 px-1.5 py-0.5 font-bold text-white tabular-nums">
            {offer.rating.toFixed(1).replace(".", ",")}
          </span>
          <span>{offer.reviews.toLocaleString("fr-FR")} avis</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="text-xs text-navy-500">{durationLabel(offer.nights, offer.category)}</span>
          <span className="text-right">
            {offer.oldPrice && (
              <span className="block text-xs text-navy-400 line-through">{price(offer.oldPrice)}</span>
            )}
            <span className="block text-xl font-extrabold text-navy-900">{price(offer.price)}</span>
            <span className="block text-[11px] text-navy-500">par personne</span>
          </span>
        </div>
      </div>
    </article>
  );
}

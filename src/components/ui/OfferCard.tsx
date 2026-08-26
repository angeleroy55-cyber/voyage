import Image from "next/image";
import Link from "next/link";
import QuickView from "@/components/offer/QuickView";
import Icon from "@/components/ui/Icon";
import { accentBadge } from "@/lib/constants";
import {
  departureLabel,
  discount,
  durationFull,
  isLastMinute,
  photo,
  price,
  ratingLabel,
  savings,
} from "@/lib/format";
import type { Offer } from "@/lib/types";

/**
 * Carte offre, telle que la spécifie la section 4.2 du cahier de
 * catégorisation. Elle sert partout : listings de catégorie, hub Destinations,
 * carrousels de l'accueil, résultats de recherche.
 *
 * Deux règles de prix y sont tenues sans exception.
 *
 * Le montant économisé est en euros, et il est toujours affiché dès qu'un prix
 * de référence existe : « 118 € de moins » se comprend sans calcul mental.
 *
 * Le taux de remise en pourcentage, lui, n'est pas systématique. Il s'active
 * catégorie par catégorie au back-office, et n'apparaît donc que là où la
 * remise est l'argument principal, Bons Plans et Dernière Minute.
 */

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

/**
 * Badge d'urgence, en haut à droite de l'image. Optionnel par construction :
 * l'afficher partout reviendrait à ne le signaler nulle part.
 *
 * « Dernière minute » n'est jamais saisi à la main, il se déduit de la date de
 * départ. Les autres viennent des étiquettes posées au back-office.
 */
function urgency(offer: Offer): { label: string; className: string } | null {
  if (isLastMinute(offer.departureDate)) {
    return { label: "Dernière minute", className: "bg-rose-600 text-white" };
  }
  if (offer.tags.includes("Vente flash")) {
    return { label: "Vente flash", className: "bg-rose-600 text-white" };
  }
  if (offer.tags.includes("Best-seller")) {
    return { label: "Meilleure vente", className: "bg-navy-900 text-white" };
  }
  if (offer.tags.includes("Coup de cœur")) {
    return { label: "Coup de cœur", className: "bg-gold-400 text-navy-900" };
  }
  return null;
}

/** Bloc de prix : référence barrée, prix GoSéjour, économie, mention par personne. */
function Price({ offer, size }: { offer: Offer; size: "sm" | "lg" }) {
  const economie = savings(offer.price, offer.oldPrice);
  const taux = offer.showDiscountPercent ? discount(offer.price, offer.oldPrice) : null;

  return (
    <div className="text-right">
      {offer.oldPrice && (
        <p className="text-sm text-navy-400 line-through">{price(offer.oldPrice)}</p>
      )}
      <p
        className={`font-extrabold text-navy-900 ${size === "lg" ? "text-2xl" : "text-xl"}`}
      >
        {price(offer.price)}
      </p>
      {economie !== null && (
        <p className="flex items-center justify-end gap-1.5 text-[13px] font-bold text-teal-600">
          <span>&minus;&nbsp;{price(economie)}</span>
          {taux !== null && (
            <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[11px] tabular-nums">
              &minus;{taux}&nbsp;%
            </span>
          )}
        </p>
      )}
      <p className="text-[11px] text-navy-500">par personne</p>
    </div>
  );
}

export default function OfferCard({
  offer,
  layout = "grid",
}: {
  offer: Offer;
  layout?: "grid" | "row";
}) {
  const badge = urgency(offer);
  const duree = durationFull(offer.category, offer.days, offer.nights);
  const depart = departureLabel(offer.departureDate);
  const image = offer.image ?? photo(offer.imageSeed, 800, 500);
  // L'alt décrit la photo pour un lecteur d'écran comme pour un moteur : le
  // produit, puis le lieu, dans cet ordre.
  const alt = `${offer.title}, ${offer.destination}, ${offer.country}`;

  if (layout === "row") {
    return (
      <article className="group hover-lift overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card sm:flex">
        {/* L'aperçu rapide est un bouton : il ne peut donc pas vivre dans le
            lien vers la fiche, d'où ce conteneur qui les porte côte à côte. */}
        <div className="relative overflow-hidden sm:w-80 sm:shrink-0">
          <Link href={`/offre/${offer.slug}`} className="block">
            {/* À partir de sm le conteneur est absolu : la colonne prend sa
                hauteur du texte, et le zoom au survol reste dans l'image. */}
            <div className="relative aspect-16/10 sm:absolute sm:inset-0 sm:aspect-auto">
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, 320px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-bold ${accentBadge(offer.categoryAccent)}`}
              >
                {offer.categoryLabel ?? "Offre"}
              </span>
              {badge && (
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
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
                <span
                  key={a}
                  className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-medium text-navy-600"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-row items-end justify-between gap-3 border-navy-100 sm:w-52 sm:flex-col sm:items-end sm:justify-between sm:border-l sm:pl-4">
            <RatingBadge score={offer.rating} reviews={offer.reviews} />
            <div className="text-right">
              <p className="text-xs font-semibold text-navy-700">{duree}</p>
              {depart && <p className="text-xs text-navy-500">{depart}</p>}
              {offer.departureCity && offer.category !== "hotels" && (
                <p className="text-xs text-navy-500">Départ de {offer.departureCity}</p>
              )}
              <div className="mt-2">
                <Price offer={offer} size="lg" />
              </div>
              <Link
                href={`/offre/${offer.slug}`}
                className="mt-2 inline-block rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
              >
                Réserver maintenant
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
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-bold ${accentBadge(offer.categoryAccent)}`}
            >
              {offer.categoryLabel ?? "Offre"}
            </span>
            {badge && (
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
        </Link>
        <QuickView offer={offer} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
          <Icon name="pin" className="size-3.5" />
          {offer.destination}, {offer.country}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-navy-900">
          <Link href={`/offre/${offer.slug}`} className="hover:text-gold-700">
            {offer.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-2">
          <Stars count={offer.stars} />
          {offer.stars > 0 && <span className="text-xs text-navy-500">{offer.board}</span>}
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-navy-600">
          <span className="rounded bg-navy-700 px-1.5 py-0.5 font-bold text-white tabular-nums">
            {offer.rating.toFixed(1).replace(".", ",")}
          </span>
          <span>{offer.reviews.toLocaleString("fr-FR")} avis</span>
        </div>

        <div className="mt-3 space-y-0.5 text-xs">
          <p className="font-semibold text-navy-700">{duree}</p>
          {depart && <p className="text-navy-500">{depart}</p>}
          {offer.departureCity && offer.category !== "hotels" && (
            <p className="text-navy-500">Départ de {offer.departureCity}</p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Link
            href={`/offre/${offer.slug}`}
            className="rounded-lg bg-gold-400 px-3.5 py-2 text-[13px] font-bold text-navy-900 transition hover:bg-gold-500"
          >
            Réserver
          </Link>
          <Price offer={offer} size="sm" />
        </div>
      </div>
    </article>
  );
}

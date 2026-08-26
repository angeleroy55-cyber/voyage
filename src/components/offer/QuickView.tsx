"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { discount, durationFull, photo, price, ratingLabel } from "@/lib/format";
import type { Offer } from "@/lib/types";

/**
 * Aperçu rapide d'une offre, ouvert depuis une carte de résultats.
 *
 * Il évite l'aller-retour vers la fiche complète quand le visiteur compare
 * plusieurs séjours : l'essentiel (visuels, note, inclus, prix) tient dans la
 * fenêtre, et le lien vers la fiche reste à un clic.
 */
export default function QuickView({ offer }: { offer: Offer }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const gallery =
    offer.images && offer.images.length > 0
      ? offer.images
      : [photo(offer.imageSeed, 900, 560), photo(`${offer.imageSeed}-2`, 900, 560), photo(`${offer.imageSeed}-3`, 900, 560)];

  const off = discount(offer.price, offer.oldPrice);
  const step = (delta: number) =>
    setIndex((current) => (current + delta + gallery.length) % gallery.length);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // Le bouton n'apparaît qu'au survol de la carte sur grand écran ; au
        // doigt il n'y a pas de survol, donc il reste visible sous `sm`.
        className="pointer-events-auto absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-bold text-navy-800 shadow-card backdrop-blur transition duration-200 hover:bg-white sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
      >
        <Icon name="search" className="size-3.5" />
        Aperçu
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={offer.title}
        hideTitle
        size="xl"
        sheetOnMobile
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {offer.oldPrice && (
                <span className="mr-2 text-sm text-navy-400 line-through">
                  {price(offer.oldPrice)}
                </span>
              )}
              <span className="text-2xl font-extrabold text-navy-900">{price(offer.price)}</span>
              <span className="ml-1 text-sm text-navy-500">/ pers.</span>
            </div>
            <Link
              href={`/offre/${offer.slug}`}
              className="rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
            >
              Voir l&apos;offre complète
            </Link>
          </div>
        }
      >
        {/* Deux colonnes qui ne débordent pas : chacune porte `min-w-0`, sans
            quoi une grille CSS refuse de réduire un enfant sous la largeur de
            son contenu et pousse la fenêtre au-delà de l'écran. */}
        <div className="grid gap-0 sm:grid-cols-2 sm:gap-6 sm:p-5">
          <div className="min-w-0">
            <div className="relative aspect-4/3 overflow-hidden sm:rounded-xl">
              <Image
                src={gallery[index]}
                alt={`${offer.title}, visuel ${index + 1} sur ${gallery.length}`}
                fill
                sizes="(max-width: 640px) 100vw, 420px"
                // Pas d'animation d'entrée ni de remontage à chaque visuel :
                // le décalage vertical de `fade-up` faisait sauter l'image à
                // chaque flèche, dans un cadre pourtant fixe.
                className="object-cover"
              />
              {off && (
                <span className="absolute left-3 top-3 rounded-md bg-gold-400 px-2 py-1 text-xs font-bold text-navy-900">
                  −{off} %
                </span>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Visuel précédent"
                    className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-800 shadow-card transition hover:bg-white"
                  >
                    <Icon name="chevronLeft" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Visuel suivant"
                    className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-800 shadow-card transition hover:bg-white"
                  >
                    <Icon name="chevronRight" className="size-4" />
                  </button>
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {gallery.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Visuel ${i + 1}`}
                        aria-current={i === index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0 px-5 pb-5 pt-5 sm:p-0">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
              <Icon name="pin" className="size-3.5" />
              {offer.destination}, {offer.country}
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-navy-900">
              {offer.title}
            </h2>
            {/* Le numéro de référence n'apparaît qu'ici, à l'ouverture de
                l'offre : la carte de listing reste lisible d'un coup d'œil, et
                le numéro sert au moment où l'on s'intéresse vraiment au séjour. */}
            <p className="mt-1.5 font-mono text-xs text-navy-500">
              Réf. <span className="font-semibold text-navy-700">{offer.reference}</span>
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="rounded-lg bg-navy-700 px-2 py-1 text-sm font-bold text-white tabular-nums">
                  {offer.rating.toFixed(1).replace(".", ",")}
                </span>
                <span className="text-xs leading-tight text-navy-600">
                  <span className="block font-semibold text-navy-800">
                    {ratingLabel(offer.rating)}
                  </span>
                  {offer.reviews.toLocaleString("fr-FR")} avis
                </span>
              </span>
              {offer.stars > 0 && (
                <span className="flex gap-0.5" aria-label={`${offer.stars} étoiles`}>
                  {Array.from({ length: offer.stars }).map((_, i) => (
                    <Icon key={i} name="star" className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-navy-100 py-4 text-sm">
              {[
                { label: "Durée", value: durationFull(offer.category, offer.days, offer.nights) },
                { label: "Formule", value: offer.board },
                { label: "Départ de", value: offer.departureCity },
                { label: "Disponibilité", value: offer.dates || "Toute l'année" },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs uppercase tracking-wide text-navy-500">{row.label}</dt>
                  <dd className="mt-0.5 font-semibold text-navy-900">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-navy-600">
              {offer.description}
            </p>

            {offer.included.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {offer.included.slice(0, 4).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-navy-700">
                    <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {offer.amenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {offer.amenities.slice(0, 6).map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-medium text-navy-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

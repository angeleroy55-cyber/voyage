"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { price } from "@/lib/format";
import type { HeroSlide } from "@/server/catalogue";

/**
 * Bandeaux d'accroche de la page d'accueil.
 *
 * Les visuels sont ceux d'offres réelles et les prix viennent du catalogue : ni
 * l'un ni l'autre n'est écrit en dur, donc rien n'annonce un tarif qui n'existe
 * plus. La composition suit ce qui marche sur les comparateurs : une image
 * plein cadre, une promesse courte, un prix d'appel, un bouton.
 *
 * L'accroche tient en cinq mots au plus, imposé à la source des données. Sur
 * une image, on retient une promesse, pas une phrase.
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [pause, setPause] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (dir: number) => {
      if (count === 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (pause || count < 2) return;
    const id = setInterval(() => go(1), 7000);
    return () => clearInterval(id);
  }, [go, pause, count]);

  if (count === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-pop"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      // Le défilement s'arrête aussi au clavier : sans cela, la diapositive
      // change sous le doigt de qui vient d'atteindre le bouton en tabulant.
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
    >
      <div className="relative aspect-16/10 sm:aspect-[21/8]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 1400px"
              className="object-cover"
            />
            {/* Dégradé depuis la gauche : le texte reste lisible quelle que
                soit la photo, sans la voiler entièrement. */}
            <div className="absolute inset-0 bg-linear-to-r from-navy-900/85 via-navy-900/55 to-navy-900/10" />

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-6 py-6 sm:px-10">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-300">
                  <Icon name="bolt" className="size-4" />
                  {slide.kicker}
                </p>
                <p className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  {slide.title}
                </p>
                {/* Un bandeau rédigé au back-office ne porte pas de prix : on
                    n'annonce alors rien plutôt qu'un « dès 0 € ». */}
                {slide.fromPrice > 0 && (
                  <p className="mt-3 flex flex-wrap items-baseline gap-2 text-white">
                    <span className="text-sm">dès</span>
                    <span className="text-3xl font-extrabold text-gold-300">
                      {price(slide.fromPrice)}
                    </span>
                    <span className="text-sm">par personne</span>
                  </p>
                )}
                {slide.detail && (
                  <p className="mt-1 text-sm text-white/90">{slide.detail}</p>
                )}
                <Link
                  href={slide.href}
                  tabIndex={i === index ? 0 : -1}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {slide.cta}
                  <Icon name="chevronRight" className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Bandeau précédent"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-800 shadow-card transition hover:bg-white"
          >
            <Icon name="chevronLeft" className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Bandeau suivant"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-800 shadow-card transition hover:bg-white"
          >
            <Icon name="chevronRight" className="size-5" />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={slide.title}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-white" : "w-2 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

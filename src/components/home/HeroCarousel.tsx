"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { photo } from "@/lib/format";

const SLIDES = [
  {
    seed: "hero-mediterranee",
    kicker: "Ventes flash jusqu'à dimanche",
    title: "Une semaine au soleil à partir de 419 €",
    text: "Séjours tout compris en Méditerranée, vol et transferts inclus.",
    href: "/sejours",
    cta: "Voir les séjours",
  },
  {
    seed: "hero-croisiere",
    kicker: "Croisières",
    title: "Embarquez pour 8 jours en pension complète",
    text: "Méditerranée, Canaries ou fjords : cabine extérieure sans supplément.",
    href: "/croisieres",
    cta: "Découvrir les croisières",
  },
  {
    seed: "hero-circuits",
    kicker: "Circuits accompagnés",
    title: "Le Japon, l'Islande ou le Pérou avec un guide francophone",
    text: "Itinéraires clés en main, groupes limités, entrées des sites incluses.",
    href: "/circuits",
    cta: "Choisir un circuit",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(() => go(1), 7000);
    return () => clearInterval(id);
  }, [go]);

  return (
    <section className="relative overflow-hidden rounded-2xl" aria-roledescription="carrousel">
      <div className="relative aspect-21/9 min-h-64 w-full">
        {SLIDES.map((s, i) => (
          <div
            key={s.seed}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={photo(s.seed, 1600, 700)}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 1280px) 100vw, 1216px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-navy-900/85 via-navy-900/55 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-6 sm:px-10">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-300">{s.kicker}</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm text-white sm:text-base">{s.text}</p>
                <Link
                  href={s.href}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
                >
                  {s.cta}
                  <Icon name="chevronRight" className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Offre précédente"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy-800 shadow transition hover:bg-white sm:block"
      >
        <Icon name="chevronLeft" className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Offre suivante"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy-800 shadow transition hover:bg-white sm:block"
      >
        <Icon name="chevronRight" className="size-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.seed}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Aller à l'offre ${i + 1} sur ${count}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

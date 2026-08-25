"use client";

import Image from "next/image";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Section from "@/components/ui/Section";

/**
 * Vidéos de présentation.
 *
 * Rien n'est chargé depuis YouTube tant que le visiteur n'a pas cliqué : la
 * carte n'affiche qu'une vignette, et le lecteur ne s'insère qu'au clic. Cela
 * évite trois iframes et leurs traceurs sur la page d'accueil, ce qui pèse sur
 * le temps de chargement et impose une bannière de consentement.
 *
 * Le domaine `youtube-nocookie.com` est utilisé plutôt que `youtube.com` :
 * il ne dépose pas de cookie publicitaire tant que la vidéo n'est pas lancée.
 */

export type Video = {
  /** Identifiant YouTube, la partie après `?v=` dans l'URL. */
  id: string;
  title: string;
  blurb: string;
};

export const VIDEOS: Video[] = [
  {
    id: "uOwwb5NlWyI",
    title: "Les avantages GO Prime",
    blurb: "Ce que change l'abonnement sur le prix de vos billets et de vos séjours.",
  },
  {
    id: "ZI5F1LP3Igs",
    title: "Cinq îles à découvrir",
    blurb: "Cinq destinations insulaires, leurs saisons et le budget à prévoir.",
  },
  {
    id: "UX63NFHtFKM",
    title: "1 000 € offerts sur GO Prime",
    blurb: "Le fonctionnement de l'offre, ses conditions et sa durée.",
  },
];

export default function VideoSection({ videos = VIDEOS }: { videos?: Video[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);

  return (
    <Section
      title="En vidéo"
      subtitle="Nos conseils et nos offres, expliqués en quelques minutes."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <article
            key={video.id}
            className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card"
          >
            <div className="relative aspect-video bg-navy-900">
              {ouverte === video.id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 size-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOuverte(video.id)}
                  className="group absolute inset-0 block cursor-pointer"
                  aria-label={`Lire la vidéo : ${video.title}`}
                >
                  <Image
                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 380px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-navy-900/25 transition group-hover:bg-navy-900/10" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-pop transition group-hover:scale-110">
                      {/* Triangle de lecture : un glyphe suffit, il n'a pas à
                          être annoncé deux fois au lecteur d'écran, le bouton
                          porte déjà son intitulé. */}
                      <svg viewBox="0 0 24 24" className="ml-1 size-6 fill-navy-900" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </button>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-[15px] font-bold text-navy-900">{video.title}</h3>
              <p className="mt-1 text-sm text-navy-600">{video.blurb}</p>
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy-500 transition hover:text-gold-700"
              >
                Voir sur YouTube
                <Icon name="chevronRight" className="size-3.5" />
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

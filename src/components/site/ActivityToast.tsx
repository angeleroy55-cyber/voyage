"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

export type ActivityEventDto = { label: string; createdAtIso: string };

const FIRST_DELAY_MS = 6_000;
const DISPLAY_MS = 7_000;
const GAP_MS = 14_000;

/** « il y a 2 h 30 », calculé côté client pour rester à jour pendant la visite. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `il y a ${hours} h ${rest}` : `il y a ${hours} h`;
}

/**
 * Bandeau d'activité récente, en bas à gauche (le bouton WhatsApp occupe déjà
 * le bas à droite). Fait défiler des évènements réels, un par un, avec une
 * pause entre deux — jamais en continu, pour ne pas donner une fausse
 * impression d'affluence permanente sur un évènement qui s'est produit il y a
 * plusieurs heures.
 *
 * `events` vient de `getRecentActivity()` (serveur) : vide tant qu'aucune
 * réservation réelle n'existe, le composant ne rend alors rien.
 */
export default function ActivityToast({ events }: { events: ActivityEventDto[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (events.length === 0) return;

    let showTimer: number;
    let hideTimer: number;

    function cycle(delay: number) {
      showTimer = window.setTimeout(() => {
        setVisible(true);
        hideTimer = window.setTimeout(() => {
          setVisible(false);
          setIndex((i) => (i + 1) % events.length);
          cycle(GAP_MS);
        }, DISPLAY_MS);
      }, delay);
    }

    cycle(FIRST_DELAY_MS);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [events.length]);

  if (events.length === 0) return null;
  const event = events[index];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-5 z-40 max-w-xs rounded-2xl border border-navy-100 bg-white p-3.5 pr-4 shadow-pop transition-all duration-300 sm:bottom-6 sm:left-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
          <Icon name="check" className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-navy-900">{event.label}</p>
          <p className="mt-0.5 text-[11px] text-navy-400">{relativeTime(event.createdAtIso)}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fermer"
          className="ml-1 shrink-0 rounded p-0.5 text-navy-300 transition hover:bg-navy-50 hover:text-navy-600"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

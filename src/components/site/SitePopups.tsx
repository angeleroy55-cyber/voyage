"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { subscribe, type FormState } from "@/server/actions/public";

/**
 * Surcouches affichées sur tout le site : bandeau cookies puis, une fois le
 * choix fait, invitation à s'inscrire aux alertes de prix.
 *
 * Les deux ne se chevauchent jamais : tant qu'aucun choix n'est enregistré sur
 * les cookies, l'invitation reste en attente. Chaque décision est mémorisée
 * dans `localStorage` avec sa date, pour ne pas reproposer la même chose au
 * visiteur suivant chargement de page.
 */

const COOKIE_KEY = "gosejour.cookies";
const NEWSLETTER_KEY = "gosejour.newsletter";
/** Délai avant de reproposer l'inscription à quelqu'un qui a refusé. */
const SNOOZE_DAYS = 30;

type Stored = { choice: string; at: number };

function read(key: string): Stored | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    // Navigation privée ou stockage refusé : on se comporte comme si rien
    // n'avait jamais été enregistré plutôt que de casser la page.
    return null;
  }
}

function write(key: string, choice: string) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    /* stockage indisponible : le choix ne vaut que pour cette page */
  }
}

export default function SitePopups() {
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Étape 1 : le bandeau cookies, après un court délai pour ne pas parasiter
  // le premier rendu.
  useEffect(() => {
    if (read(COOKIE_KEY)) return;
    const timer = window.setTimeout(() => setCookiesOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  // Étape 2 : l'invitation aux alertes de prix. Deux déclencheurs : le temps
  // passé sur la page, ou la souris qui remonte vers la barre d'onglets, signe
  // habituel d'un départ imminent.
  useEffect(() => {
    if (cookiesOpen) return;

    const stored = read(NEWSLETTER_KEY);
    if (stored?.choice === "subscribed") return;
    if (stored && Date.now() - stored.at < SNOOZE_DAYS * 86_400_000) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setNewsletterOpen(true);
    };

    const timer = window.setTimeout(show, 28_000);
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) show();
    };

    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [cookiesOpen]);

  function decideCookies(choice: "all" | "essential") {
    write(COOKIE_KEY, choice);
    setCookiesOpen(false);
    setSettingsOpen(false);
  }

  function closeNewsletter(choice: "dismissed" | "subscribed") {
    write(NEWSLETTER_KEY, choice);
    setNewsletterOpen(false);
  }

  return (
    <>
      {cookiesOpen && !settingsOpen && (
        <div className="animate-fade-up fixed inset-x-0 bottom-0 z-[90] px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-navy-200 bg-white p-5 shadow-pop sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
              <Icon name="shield" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy-900">Votre vie privée, votre choix</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-600">
                Nous utilisons des cookies pour faire fonctionner le site, mesurer son audience et
                vous montrer des offres pertinentes. Vous pouvez n&apos;accepter que le strict
                nécessaire.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={() => decideCookies("essential")}
                className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => decideCookies("all")}
                className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Paramètres de confidentialité"
        description="Les cookies strictement nécessaires ne peuvent pas être désactivés : sans eux, la recherche et le panier ne fonctionnent pas."
        size="lg"
        sheetOnMobile
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => decideCookies("essential")}
              className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400"
            >
              Enregistrer le strict nécessaire
            </button>
            <button
              type="button"
              onClick={() => decideCookies("all")}
              className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
            >
              Tout accepter
            </button>
          </div>
        }
      >
        <ul className="divide-y divide-navy-100">
          {[
            {
              title: "Strictement nécessaires",
              text: "Session, panier, sécurité des formulaires.",
              locked: true,
            },
            {
              title: "Mesure d'audience",
              text: "Pages consultées et parcours, en statistiques agrégées.",
              locked: false,
            },
            {
              title: "Personnalisation",
              text: "Destinations récemment vues et suggestions associées.",
              locked: false,
            },
            {
              title: "Publicité",
              text: "Offres GoSéjour affichées sur d'autres sites.",
              locked: false,
            },
          ].map((group) => (
            <li key={group.title} className="flex items-start justify-between gap-4 py-3.5">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-navy-900">{group.title}</span>
                <span className="mt-0.5 block text-sm text-navy-600">{group.text}</span>
              </span>
              {group.locked ? (
                <span className="shrink-0 rounded-md bg-navy-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-600">
                  Toujours actif
                </span>
              ) : (
                <input
                  type="checkbox"
                  defaultChecked
                  aria-label={`Activer : ${group.title}`}
                  className="mt-1 size-4 shrink-0 rounded border-navy-300 accent-gold-500"
                />
              )}
            </li>
          ))}
        </ul>
      </Modal>

      <NewsletterPopup
        open={newsletterOpen}
        onDismiss={() => closeNewsletter("dismissed")}
        onSubscribed={() => closeNewsletter("subscribed")}
      />
    </>
  );
}

const INITIAL: FormState = { ok: false, message: "" };

function NewsletterPopup({
  open,
  onDismiss,
  onSubscribed,
}: {
  open: boolean;
  onDismiss: () => void;
  onSubscribed: () => void;
}) {
  const [state, formAction] = useActionState(subscribe, INITIAL);

  // L'inscription réussie referme la fenêtre après un temps de lecture, pour
  // que la confirmation soit vue avant de disparaître.
  useEffect(() => {
    if (!state.ok) return;
    const timer = window.setTimeout(onSubscribed, 2400);
    return () => window.clearTimeout(timer);
  }, [state.ok, onSubscribed]);

  return (
    <Modal open={open} onClose={onDismiss} title="Alertes bons plans" hideTitle size="md">
      <div className="-mx-5 -mt-5">
        <div className="bg-linear-to-br from-navy-800 to-navy-600 px-6 py-7 text-white">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-300">
            <Icon name="bolt" className="size-4" />
            Avant de partir
          </p>
          <p className="mt-2 text-2xl font-extrabold leading-tight">
            −40 % sur votre prochain séjour ?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white">
            Nous surveillons les prix pour vous et vous prévenons dès qu&apos;une destination que
            vous suivez baisse. Un e-mail par semaine, pas davantage.
          </p>
        </div>

        <div className="px-5 py-5">
          {state.ok ? (
            <p className="animate-fade-up flex items-start gap-2.5 rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
              <Icon name="check" className="mt-0.5 size-4 shrink-0" />
              {state.message}
            </p>
          ) : (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="interests" value="Bons plans" />
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Votre e-mail
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="votre@email.fr"
                  className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-3 text-[15px] outline-none transition focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
                />
              </label>

              {state.message && !state.ok && (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {state.message}
                </p>
              )}

              <PopupSubmit />

              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-1 text-center text-sm text-navy-500 transition hover:text-navy-800"
              >
                Non merci, je continue ma recherche
              </button>

              <p className="text-center text-xs text-navy-500">
                Désinscription en un clic. Aucune adresse n&apos;est revendue.
              </p>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

function PopupSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-gold-400 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 disabled:opacity-60"
    >
      {pending ? "Inscription…" : "Recevoir les alertes prix"}
    </button>
  );
}

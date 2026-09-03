"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, DICTIONARIES, isLocale, type I18nKey, type Locale } from "@/lib/i18n";

/**
 * Langue d'interface du visiteur, partagée par tout le site.
 *
 * Même principe que `DepartureCity` : un choix mémorisé dans le navigateur,
 * lu par `useSyncExternalStore` pour ne jamais diverger entre le rendu
 * serveur et le premier rendu client. Contrairement à la ville de départ,
 * il n'y a ni détection ni géolocalisation à faire : sans choix explicite,
 * le site reste en français, sa langue de référence.
 *
 * Ce que ce contexte change : l'habillage du site (`t(...)`). Ce qu'il ne
 * change pas : les catégories, le catalogue et le carnet de voyage, qui
 * viennent du back-office et restent en français dans les trois langues —
 * voir la note en tête de `src/lib/i18n.ts`.
 */

const CLE = "gosejour.langue";
const EVENEMENT = "gosejour:langue";

function souscrire(rappel: () => void): () => void {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

function lireLangue(): Locale {
  try {
    const valeur = window.localStorage.getItem(CLE);
    return isLocale(valeur) ? valeur : DEFAULT_LOCALE;
  } catch {
    // Navigation privée ou stockage refusé : le site reste en français.
    return DEFAULT_LOCALE;
  }
}

type Contexte = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  t: (key: I18nKey) => string;
};

const LocaleContext = createContext<Contexte>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => DICTIONARIES[DEFAULT_LOCALE][key],
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(souscrire, lireLangue, () => DEFAULT_LOCALE);

  const setLocale = useCallback((value: Locale) => {
    try {
      window.localStorage.setItem(CLE, value);
    } catch {
      // Le choix reste valable pour la page en cours, sans être conservé.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const t = useCallback((key: I18nKey) => DICTIONARIES[locale][key], [locale]);

  const valeur = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={valeur}>{children}</LocaleContext.Provider>;
}

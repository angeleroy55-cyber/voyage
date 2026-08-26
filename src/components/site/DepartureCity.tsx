"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { cityFromTimeZone } from "@/lib/geo";
import { DEFAULT_DEPARTURE, isDepartureCity } from "@/lib/places";

/**
 * Ville de départ du visiteur, partagée par tout le site.
 *
 * Elle est choisie une fois, dans la barre d'en-tête, et le moteur de recherche
 * la reprend sur chaque page : sans cet état commun, le visiteur qui a réglé
 * son départ sur Lyon retrouverait Paris dans le formulaire juste en dessous.
 *
 * L'ordre de priorité est le suivant.
 *
 * 1. Le choix explicite du visiteur, conservé dans le navigateur d'une visite à
 *    l'autre. Il l'emporte toujours sur la détection : celui qui a corrigé une
 *    fois n'a pas à le refaire.
 * 2. La ville détectée par l'hébergeur à partir de l'adresse IP, transmise par
 *    le serveur (`src/server/geo.ts`).
 * 3. Le fuseau horaire du navigateur, qui distingue au moins les grands bassins.
 * 4. Paris, à défaut.
 *
 * Le stockage du navigateur est lu par `useSyncExternalStore` et non dans un
 * effet : c'est l'outil prévu pour une source de vérité extérieure à React. Il
 * fournit un instantané côté serveur, distinct de celui du navigateur, donc
 * l'hydratation ne diverge pas et la valeur n'est jamais posée deux fois.
 */

const CLE = "gosejour.depart";

/**
 * Émis à chaque changement de ville. L'événement `storage` du navigateur ne
 * prévient que les autres onglets : sans celui-ci, l'en-tête et le moteur de
 * recherche du même onglet ne se mettraient pas à jour ensemble.
 */
const EVENEMENT = "gosejour:depart";

function souscrire(rappel: () => void): () => void {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

/** Ville enregistrée par le visiteur, `null` s'il n'a jamais choisi. */
function villeChoisie(): string | null {
  try {
    const valeur = window.localStorage.getItem(CLE);
    return isDepartureCity(valeur) ? valeur : null;
  } catch {
    // Navigation privée ou stockage refusé : on continue sans mémoire.
    return null;
  }
}

type Contexte = {
  city: string;
  setCity: (value: string) => void;
  /** La ville affichée vient d'une détection, pas d'un choix du visiteur. */
  detected: boolean;
};

const DepartureContext = createContext<Contexte>({
  city: DEFAULT_DEPARTURE,
  setCity: () => {},
  detected: false,
});

export function useDepartureCity() {
  return useContext(DepartureContext);
}

export default function DepartureCityProvider({
  /** Ville déduite des en-têtes de l'hébergeur, `null` en développement. */
  detectedCity,
  children,
}: {
  detectedCity: string | null;
  children: React.ReactNode;
}) {
  // Les instantanés rendent des chaînes et des booléens : React les compare par
  // valeur, la lecture peut donc être refaite à chaque rendu sans boucler.
  const lireVille = useCallback(() => {
    return (
      villeChoisie() ??
      detectedCity ??
      cityFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) ??
      DEFAULT_DEPARTURE
    );
  }, [detectedCity]);

  const villeServeur = useCallback(
    () => detectedCity ?? DEFAULT_DEPARTURE,
    [detectedCity],
  );

  const city = useSyncExternalStore(souscrire, lireVille, villeServeur);

  const detected = useSyncExternalStore(
    souscrire,
    () => villeChoisie() === null,
    () => Boolean(detectedCity),
  );

  const setCity = useCallback((value: string) => {
    if (!isDepartureCity(value)) return;
    try {
      window.localStorage.setItem(CLE, value);
    } catch {
      // Le stockage est refusé : le changement ne survivra pas à la visite,
      // mais l'événement met quand même la page à jour.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const valeur = useMemo(() => ({ city, setCity, detected }), [city, setCity, detected]);

  return <DepartureContext.Provider value={valeur}>{children}</DepartureContext.Provider>;
}

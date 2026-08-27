"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { cityFromTimeZone, nearestDepartureCity } from "@/lib/geo";
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
 * 2. La position rendue par le navigateur, si le visiteur l'a autorisée. Les
 *    coordonnées sont traduites en ville de départ sur le poste même, par
 *    comparaison avec une table locale : aucun service de géocodage n'est
 *    appelé, la position ne quitte donc jamais le navigateur.
 * 3. La ville détectée par l'hébergeur à partir de l'adresse IP, transmise par
 *    le serveur (`src/server/geo.ts`).
 * 4. Le fuseau horaire du navigateur, qui distingue au moins les grands bassins.
 * 5. Paris, à défaut.
 *
 * Le stockage du navigateur est lu par `useSyncExternalStore` et non dans un
 * effet : c'est l'outil prévu pour une source de vérité extérieure à React. Il
 * fournit un instantané côté serveur distinct de celui du navigateur, donc
 * l'hydratation ne diverge pas et la valeur n'est jamais posée deux fois.
 */

const CLE = "gosejour.depart";

/** Ville déduite de la position, distincte d'un choix explicite. */
const CLE_POSITION = "gosejour.depart.position";

/** Réponse déjà donnée à la demande de position : `oui`, `non`, ou rien. */
const CLE_CONSENTEMENT = "gosejour.position";

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

function lire(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    // Navigation privée ou stockage refusé : on continue sans mémoire.
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    // Le choix reste valable pour la page en cours, sans être conservé.
  }
}

/** Ville enregistrée par le visiteur, `null` s'il n'a jamais choisi. */
function villeChoisie(): string | null {
  const valeur = lire(CLE);
  return isDepartureCity(valeur) ? valeur : null;
}

/** Ville déduite d'une position déjà autorisée lors d'une visite précédente. */
function villeParPosition(): string | null {
  const valeur = lire(CLE_POSITION);
  return isDepartureCity(valeur) ? valeur : null;
}

type Contexte = {
  city: string;
  setCity: (value: string) => void;
  /** La ville affichée vient d'une détection, pas d'un choix du visiteur. */
  detected: boolean;
  /** Le navigateur peut-il encore être interrogé sur la position ? */
  canLocate: boolean;
  /** Demande la position au navigateur. Ouvre la fenêtre d'autorisation. */
  locate: () => void;
  /** Une demande de position est en cours. */
  locating: boolean;
};

const DepartureContext = createContext<Contexte>({
  city: DEFAULT_DEPARTURE,
  setCity: () => {},
  detected: false,
  canLocate: false,
  locate: () => {},
  locating: false,
});

export function useDepartureCity() {
  return useContext(DepartureContext);
}

export default function DepartureCityProvider({
  /** Ville déduite des en-têtes de l'hébergeur, `null` en développement. */
  detectedCity,
  /**
   * Demander la position dès l'arrivée sur le site, comme le font les grands
   * comparateurs. La question n'est posée qu'une fois : la réponse, quelle
   * qu'elle soit, est mémorisée et le navigateur n'est plus sollicité.
   */
  askOnLoad = true,
  children,
}: {
  detectedCity: string | null;
  askOnLoad?: boolean;
  children: React.ReactNode;
}) {
  const [locating, setLocating] = useState(false);

  // Les instantanés rendent des chaînes et des booléens : React les compare par
  // valeur, la lecture peut donc être refaite à chaque rendu sans boucler.
  const lireVille = useCallback(() => {
    return (
      villeChoisie() ??
      villeParPosition() ??
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

  const canLocate = useSyncExternalStore(
    souscrire,
    () => typeof navigator !== "undefined" && "geolocation" in navigator,
    () => false,
  );

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        ecrire(CLE_CONSENTEMENT, "oui");
        const ville = nearestDepartureCity(
          position.coords.latitude,
          position.coords.longitude,
        );
        // Position hors de toute zone desservie : on ne propose rien plutôt
        // que de faire partir de Lille quelqu'un qui se trouve à Madrid.
        if (ville) ecrire(CLE_POSITION, ville);
        setLocating(false);
        window.dispatchEvent(new Event(EVENEMENT));
      },
      () => {
        // Refus, délai dépassé, ou position indisponible : dans les trois cas
        // la question ne sera plus reposée, et la détection par l'hébergeur ou
        // le fuseau horaire prend le relais.
        ecrire(CLE_CONSENTEMENT, "non");
        setLocating(false);
        window.dispatchEvent(new Event(EVENEMENT));
      },
      { timeout: 8000, maximumAge: 24 * 60 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    if (!askOnLoad) return;
    // Une seule sollicitation par visiteur : ni celui qui a déjà répondu, ni
    // celui qui a déjà réglé sa ville à la main ne doit revoir la fenêtre.
    if (lire(CLE_CONSENTEMENT) || villeChoisie()) return;

    // La demande est différée d'un instant : une fenêtre d'autorisation qui
    // s'ouvre avant que la page soit lisible se fait refuser par réflexe.
    const minuteur = window.setTimeout(locate, 1200);
    return () => window.clearTimeout(minuteur);
  }, [askOnLoad, locate]);

  const setCity = useCallback((value: string) => {
    if (!isDepartureCity(value)) return;
    ecrire(CLE, value);
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const valeur = useMemo(
    () => ({ city, setCity, detected, canLocate, locate, locating }),
    [city, setCity, detected, canLocate, locate, locating],
  );

  return <DepartureContext.Provider value={valeur}>{children}</DepartureContext.Provider>;
}

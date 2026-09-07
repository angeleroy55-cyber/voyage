import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";

/**
 * Langue de la requête en cours, côté serveur, lue depuis l'en-tête `x-locale`
 * posé par le middleware. Évite de faire remonter `params.locale` à travers
 * toute la chaîne de composants serveur (OfferCard, cartes de l'accueil…) :
 * n'importe quel composant serveur peut l'appeler directement.
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get("x-locale");
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Dictionnaire UI de la requête en cours, côté serveur. */
export async function getRequestDictionary(): Promise<Dictionary> {
  return getDictionary(await getRequestLocale());
}

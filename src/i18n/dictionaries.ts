import type { Locale } from "@/i18n/config";
import fr from "@/i18n/dictionaries/fr.json";
import en from "@/i18n/dictionaries/en.json";
import es from "@/i18n/dictionaries/es.json";
import de from "@/i18n/dictionaries/de.json";

export type Dictionary = typeof fr;

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, es, de };

/** Dictionnaire complet d'une langue, lu en mémoire (pas d'I/O, JSON importé). */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.fr;
}

/**
 * Configuration i18n maison (pas de lib externe).
 *
 * Choix : next-intl demande une App Router restructurée en `[locale]` de
 * toute façon, et son intégration avec les types `PageProps<Route>` générés
 * par Next 16 est encore fragile en pratique. Comme le besoin réel ici est
 * simple (3 locales, routing par préfixe, dictionnaires JSON plats), une
 * solution maison légère est plus robuste : moins de dépendance, contrôle
 * total sur le rewrite « français sans préfixe », pas de couche d'abstraction
 * à déboguer en cas de souci avec les types générés.
 */

export const LOCALES = ["fr", "en", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Étiquette IETF, pour `toLocaleDateString`/`Intl` et les nombres. */
export const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
};

/**
 * Drapeau associé à chaque langue, pour le sélecteur (icône plutôt que texte
 * sur mobile/en barre étroite). Allemagne pour l'allemand, pas l'Autriche ni
 * la Suisse : c'est la variante standard, sans ambiguïté pour l'utilisateur.
 */
export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  de: "🇩🇪",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Retire le préfixe de langue d'un chemin (`/en/sejours` -> `/sejours`). */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

/** Reconstruit l'URL équivalente dans une autre langue (français = sans préfixe). */
export function localizedPath(pathname: string, locale: Locale): string {
  const bare = stripLocalePrefix(pathname);
  const clean = bare === "" ? "/" : bare;
  if (locale === DEFAULT_LOCALE) return clean;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

/**
 * Choisit le texte à afficher selon la langue, avec repli sur le français si
 * la traduction est vide : une colonne EN/ES non encore remplie ne doit
 * jamais afficher un trou, elle affiche le texte source.
 *
 * L'allemand n'a pas encore de colonnes dédiées en base (titleDe, etc.) : il
 * retombe donc sur le français comme n'importe quelle langue sans valeur
 * saisie, au même titre qu'un EN/ES vide. L'interface, elle, est intégralement
 * traduite (voir src/i18n/dictionaries/de.json) — seul le catalogue (offres,
 * destinations) reste à traduire pour cette langue.
 */
export function pickLocalized(locale: Locale, fr: string, en: string, es: string): string {
  if (locale === "en") return en || fr;
  if (locale === "es") return es || fr;
  return fr;
}

/** Variante tableau, même règle de repli (ex. points forts, inclus). */
export function pickLocalizedList(locale: Locale, fr: string[], en: string[], es: string[]): string[] {
  if (locale === "en") return en.length > 0 ? en : fr;
  if (locale === "es") return es.length > 0 ? es : fr;
  return fr;
}

/**
 * Balises `hreflang` pour `generateMetadata` : une entrée par langue, plus
 * `x-default` sur le français, qui sert de version par défaut aux moteurs.
 */
export function hreflangAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = localizedPath(pathname, locale);
  }
  languages["x-default"] = localizedPath(pathname, DEFAULT_LOCALE);
  return languages;
}

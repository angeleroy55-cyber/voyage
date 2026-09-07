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

export const LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
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

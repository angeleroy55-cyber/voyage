import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale, type Locale } from "@/i18n/config";

// Le proxy ne touche jamais /admin, /api, les fichiers statiques ni les
// routes internes de Next : c'est le rôle du `matcher` ci-dessous.
//
// Règle : le français n'a pas de préfixe (`/sejours`), anglais et espagnol en
// ont un (`/en/sejours`, `/es/sejours`). En interne, TOUT passe par le segment
// `[locale]` : une requête `/sejours` est donc réécrite vers `/fr/sejours`
// (rewrite, invisible dans la barre d'adresse), tandis qu'une requête
// `/en/sejours` est déjà dans la bonne forme.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/");
  const prefixed = isLocale(segments[1]) ? (segments[1] as Locale) : null;

  if (prefixed) {
    // Préfixe déjà présent : on laisse passer, en mémorisant le choix.
    const response = NextResponse.next();
    response.headers.set("x-locale", prefixed);
    response.cookies.set(LOCALE_COOKIE, prefixed, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  }

  // Pas de préfixe : la préférence retenue décide entre rester en clair (fr)
  // ou rediriger visiblement vers /en ou /es.
  const preferred = resolvePreferredLocale(request);

  if (preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, preferred, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  }

  // Français : réécriture interne vers /fr/... pour alimenter le segment
  // [locale], sans jamais afficher /fr dans l'URL.
  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-locale", "fr");
  if (!request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, "fr", { maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  return response;
}

/** Cookie de préférence si déjà choisi, sinon `Accept-Language`, repli sur `fr`. */
function resolvePreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const header = request.headers.get("accept-language");
  if (header) {
    const wanted = header
      .split(",")
      .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase());
    const match = wanted.find((lang) => (LOCALES as readonly string[]).includes(lang ?? ""));
    if (isLocale(match)) return match;
  }

  return DEFAULT_LOCALE;
}

export const config = {
  matcher: [
    // Exclut /admin, /api, les assets Next et les fichiers avec extension
    // (images, favicon, manifest...) — tout le reste passe par le middleware.
    "/((?!admin|api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

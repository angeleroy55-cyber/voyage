"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS, localizedPath } from "@/i18n/config";

/**
 * Change de langue en retombant sur l'équivalent de la page courante (pas la
 * home) : `localizedPath` retire le préfixe actuel et pose le nouveau.
 * Un lien classique (pas de `router.push`) pour que le rewrite du middleware
 * (pose du cookie `NEXT_LOCALE`) s'applique dès la navigation.
 *
 * Ouverture au clic, pas au survol : le survol ne marche pas au tactile
 * (mobile, tablette) et se referme trop facilement sur desktop dès que la
 * souris quitte le bouton d'un pixel avant d'atteindre le menu — c'était la
 * plainte remontée (« difficilement modifiable »). Un clic à l'extérieur ou
 * sur Échap referme le menu.
 */
export default function LanguageSwitcher() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Langue : ${LOCALE_LABELS[locale]}`}
        className="flex items-center gap-1 rounded px-1 py-0.5 text-base leading-none transition hover:bg-white/10"
      >
        <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-40 rounded-lg border border-navy-100 bg-white py-1 shadow-pop">
          {LOCALES.map((l) => (
            <a
              key={l}
              href={localizedPath(pathname, l)}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm ${
                l === locale ? "font-bold text-navy-900" : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {LOCALE_FLAGS[l]}
              </span>
              {LOCALE_LABELS[l]}
            </a>
          ))}
        </div>
      )}
    </span>
  );
}

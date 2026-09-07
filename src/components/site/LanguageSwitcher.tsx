"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, localizedPath } from "@/i18n/config";

/**
 * Change de langue en retombant sur l'équivalent de la page courante (pas la
 * home) : `localizedPath` retire le préfixe actuel et pose le nouveau.
 * Un lien classique (pas de `router.push`) pour que le rewrite du middleware
 * (pose du cookie `NEXT_LOCALE`) s'applique dès la navigation.
 */
export default function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative flex items-center gap-1.5"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-white transition hover:text-gold-300"
      >
        <Icon name="globe" className="size-3.5" />
        {dict.header.language}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-navy-100 bg-white py-1 shadow-pop">
          {LOCALES.map((l) => (
            <a
              key={l}
              href={localizedPath(pathname, l)}
              className={`block px-3 py-1.5 text-sm ${
                l === locale ? "font-bold text-navy-900" : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {LOCALE_LABELS[l]}
            </a>
          ))}
        </div>
      )}
    </span>
  );
}

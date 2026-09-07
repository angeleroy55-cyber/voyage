"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type I18nContextValue = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Fournit langue et dictionnaire aux composants client (Header, SearchWidget…).
 * Posé une seule fois par (site)/layout.tsx, qui lit déjà la langue via
 * `params.locale` côté serveur — inutile de la redemander plus bas.
 */
export default function I18nProvider({
  locale,
  dict,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé sous <I18nProvider>");
  return ctx;
}

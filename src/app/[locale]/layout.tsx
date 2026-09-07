import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";

// Segment de routage pur : il valide la langue et pose `lang` sur `<html>`.
// Le vrai layout visuel (Header/Footer) reste dans (site)/layout.tsx pour
// que l'admin, hors de ce segment, n'en hérite jamais.
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return children;
}

export function generateStaticParams() {
  return [{ locale: "fr" }, { locale: "en" }, { locale: "es" }];
}

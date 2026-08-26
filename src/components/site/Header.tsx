"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { DEPARTURE_CITIES } from "@/lib/data";
import type { NavCategory, SiteSettings } from "@/server/catalogue";

type Props = {
  settings: SiteSettings;
  /** Les dix entrées du menu principal, dans l'ordre du back-office. */
  categories: NavCategory[];
  /** Ce qui se range sous « Voir plus de voyages ». */
  overflow?: NavCategory[];
  /** Voyageur connecté, `null` sinon : pilote le bloc de droite de l'en-tête. */
  customer?: { name: string; firstName: string } | null;
};

export default function Header({
  settings,
  categories,
  overflow = [],
  customer = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Paris");
  const [moreOpen, setMoreOpen] = useState(false);

  // La navigation suit les catégories actives en base : en désactiver une au
  // back-office la retire du menu, ici comme sur mobile. L'ordre est celui du
  // cahier, de la plus forte urgence vers la plus large.
  const primaryNav = categories;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_rgba(12,26,55,0.08)]">
      {/* Utility bar */}
      {/* Sur bleu, le texte est en blanc pur : le survol se signale donc par
          l'or de la marque, puisqu'un « blanc plus blanc » n'existe pas. */}
      <div className="hidden bg-navy-800 text-white lg:block">
        <div className="mx-auto flex h-9 max-w-page items-center justify-between px-4 text-[13px]">
          <div className="flex items-center gap-5">
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 transition hover:text-gold-300"
            >
              <Icon name="phone" className="size-3.5" />
              {settings.phone}
            </a>
            <Link href="/aide" className="transition hover:text-gold-300">
              Aide &amp; FAQ
            </Link>
            <Link href="/aide#contact" className="transition hover:text-gold-300">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <Icon name="pin" className="size-3.5" />
              <span className="sr-only">Ville de départ</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="cursor-pointer rounded bg-transparent py-0.5 pr-1 text-white outline-none transition hover:text-gold-300 focus:ring-2 focus:ring-gold-400"
              >
                {DEPARTURE_CITIES.map((c) => (
                  <option key={c} value={c} className="text-navy-900">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <span className="flex items-center gap-1.5">
              <Icon name="globe" className="size-3.5" />
              Français
            </span>
            <span>EUR €</span>
          </div>
        </div>
      </div>

      {/* Logo + nav */}
      <div className="mx-auto max-w-page px-4">
        <div className="flex h-16 items-stretch gap-4 lg:gap-6">
          <div className="relative flex shrink-0 items-center gap-1 bg-navy-800 px-4 text-white before:absolute before:right-full before:top-0 before:h-full before:w-screen before:bg-navy-800 before:content-[''] md:pr-5 lg:gap-2 lg:pr-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded p-2 text-white transition hover:bg-white/10 xl:hidden"
              aria-label="Ouvrir le menu"
            >
              <Icon name="menu" className="size-6" />
            </button>

            <Logo name={settings.name} inverse />
          </div>

          <nav className="hidden flex-1 items-center gap-0.5 xl:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-lg px-2.5 py-2 text-[14px] font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
              >
                {item.label}
              </Link>
            ))}
            {overflow.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-[14px] font-medium text-navy-700 transition hover:bg-navy-50"
                  aria-expanded={moreOpen}
                >
                  Voir plus
                  <Icon name="chevronDown" className="size-4" />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full w-72 rounded-xl border border-navy-100 bg-white p-2 shadow-pop">
                    {overflow.map((c) => (
                      <Link
                        key={c.id}
                        href={c.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-700 hover:bg-navy-50"
                      >
                        <Icon name={c.icon} className="size-4.5 text-gold-600" />
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={customer ? "/compte/reservations" : "/aide"}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 md:block"
            >
              Ma réservation
            </Link>
            {customer ? (
              <Link
                href="/compte/tableau-de-bord"
                className="flex items-center gap-2 rounded-lg border border-navy-200 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-full bg-navy-800 text-xs font-extrabold text-gold-400"
                >
                  {customer.firstName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">Mon espace</span>
              </Link>
            ) : (
              <Link
                href="/compte"
                className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-navy-100 px-4">
              <Logo name={settings.name} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-navy-700"
                aria-label="Fermer le menu"
              >
                <Icon name="close" className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium text-navy-800 hover:bg-navy-50"
                >
                  <Icon name={c.icon} className="size-5 text-gold-600" />
                  {c.label}
                </Link>
              ))}
              {overflow.length > 0 && (
                <>
                  <div className="my-3 border-t border-navy-100" />
                  <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-navy-500">
                    Voir plus de voyages
                  </p>
                  {overflow.map((c) => (
                    <Link
                      key={c.id}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-navy-700 hover:bg-navy-50"
                    >
                      <Icon name={c.icon} className="size-5 text-gold-600" />
                      {c.label}
                    </Link>
                  ))}
                </>
              )}
              <div className="my-3 border-t border-navy-100" />
              {[
                { label: "Aide & FAQ", href: "/aide" },
                customer
                  ? { label: "Mon espace client", href: "/compte/tableau-de-bord" }
                  : { label: "Connexion", href: "/compte" },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-[15px] text-navy-700 hover:bg-navy-50"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo({ name, inverse = false }: { name: string; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label={`${name}, accueil`}
    >
      {/* Le verrouillage porte déjà le nom : l'`alt` reste vide, le nom
          accessible du lien étant donné par son `aria-label`. */}
      <Image
        src={inverse ? "/brand/logo-lockup-inverse.png" : "/brand/logo-lockup.png"}
        alt=""
        width={1380}
        height={432}
        priority
        className={inverse ? "h-11 w-auto md:h-12" : "h-10 w-auto md:h-11"}
      />
    </Link>
  );
}

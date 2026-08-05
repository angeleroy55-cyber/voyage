"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { BRAND, CATEGORIES, DEPARTURE_CITIES } from "@/lib/data";

const PRIMARY_NAV = [
  { label: "Bons plans", href: "/recherche/vol-hotel?tri=remise" },
  { label: "Promos", href: "/recherche/vol-hotel?tri=prix" },
  { label: "Destinations", href: "/destinations" },
  { label: "Vol + Hôtel", href: "/recherche/vol-hotel" },
  { label: "Croisières", href: "/recherche/croisieres" },
  { label: "Circuits", href: "/recherche/circuits" },
  { label: "Hôtels", href: "/recherche/hotels" },
  { label: "Vols", href: "/recherche/vols" },
  { label: "Campings", href: "/recherche/campings" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Paris");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_rgba(12,26,55,0.08)]">
      {/* Utility bar */}
      <div className="hidden bg-navy-800 text-navy-100 lg:block">
        <div className="mx-auto flex h-9 max-w-page items-center justify-between px-4 text-[13px]">
          <div className="flex items-center gap-5">
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="phone" className="size-3.5" />
              {BRAND.phone}
            </a>
            <Link href="/aide" className="hover:text-white">
              Aide &amp; FAQ
            </Link>
            <Link href="/aide#contact" className="hover:text-white">
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
                className="cursor-pointer rounded bg-transparent py-0.5 pr-1 text-navy-100 outline-none hover:text-white focus:ring-2 focus:ring-white/40"
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
        <div className="flex h-16 items-center gap-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-ml-1 rounded p-2 text-navy-700 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" className="size-6" />
          </button>

          <Logo />

          <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {PRIMARY_NAV.slice(0, 7).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-[15px] font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
              >
                {item.label}
              </Link>
            ))}
            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] font-medium text-navy-700 transition hover:bg-navy-50"
                aria-expanded={moreOpen}
              >
                Plus
                <Icon name="chevronDown" className="size-4" />
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full w-64 rounded-xl border border-navy-100 bg-white p-2 shadow-pop">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.id}
                      href={`/recherche/${c.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-700 hover:bg-navy-50"
                    >
                      <Icon name={c.icon} className="size-4.5 text-gold-600" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/aide"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 md:block"
            >
              Ma réservation
            </Link>
            <Link
              href="/compte"
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
            >
              Connexion
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-navy-100 px-4">
              <Logo />
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
              {CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  href={`/recherche/${c.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium text-navy-800 hover:bg-navy-50"
                >
                  <Icon name={c.icon} className="size-5 text-gold-600" />
                  {c.label}
                </Link>
              ))}
              <div className="my-3 border-t border-navy-100" />
              {[
                { label: "Destinations", href: "/destinations" },
                { label: "Aide & FAQ", href: "/aide" },
                { label: "Connexion", href: "/compte" },
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

function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label={`${BRAND.name}, accueil`}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={40}
        height={40}
        priority
        className="size-10 rounded-xl"
      />
      <span className="text-[22px] font-extrabold leading-none tracking-tight text-navy-900">
        <span className="text-gold-500">Go</span>Séjour
        <span className="ml-0.5 align-top text-xs font-bold text-gold-500">.fr</span>
      </span>
    </Link>
  );
}

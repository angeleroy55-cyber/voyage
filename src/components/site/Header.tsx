"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useDepartureCity } from "@/components/site/DepartureCity";
import LanguageSwitcher from "@/components/site/LanguageSwitcher";
import { DEPARTURE_GROUPS } from "@/lib/places";
import { useI18n } from "@/i18n/I18nProvider";
import { localizedPath } from "@/i18n/config";
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
  const [moreOpen, setMoreOpen] = useState(false);
  // La ville vient du contexte : elle est détectée, mémorisée, et partagée avec
  // le moteur de recherche de la page.
  const { city, setCity, detected, canLocate, locate, locating } = useDepartureCity();
  const { locale, dict } = useI18n();
  const t = dict.header;
  const l = (href: string) => localizedPath(href, locale);

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
          {/* Le numéro n'est pas ici : il ne figure qu'au pied de page tant que
              la ligne définitive n'est pas ouverte. Un numéro affiché en tête de
              chaque page est le premier que le visiteur compose, et le premier
              qui décevra s'il ne répond pas encore. */}
          <div className="flex items-center gap-5">
            <Link href={l("/aide")} className="transition hover:text-gold-300">
              {t.help}
            </Link>
            <Link href={l("/aide") + "#contact"} className="transition hover:text-gold-300">
              {t.contact}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <Icon name="pin" className="size-3.5" />
              <span className="sr-only">{t.departureCity}</span>
              {/* Repérée automatiquement, et modifiable : la mention le dit,
                  pour que personne ne se demande pourquoi sa ville est là. */}
              {detected && (
                <span className="text-gold-300" title="Détectée depuis votre position">
                  {t.departingFrom}
                </span>
              )}
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label={t.departureCity}
                className="max-w-44 cursor-pointer truncate rounded bg-transparent py-0.5 pr-1 font-semibold text-white outline-none transition hover:text-gold-300 focus:ring-2 focus:ring-gold-400"
              >
                {DEPARTURE_GROUPS.map((groupe) => (
                  <optgroup key={groupe.label} label={groupe.label} className="text-navy-900">
                    {groupe.cities.map((c) => (
                      <option key={c} value={c} className="text-navy-900">
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {/* Rattrapage manuel : celui qui a refusé la première fois, ou
                  dont la position a changé, peut la redemander sans avoir à
                  fouiller dans les réglages de son navigateur. */}
              {canLocate && (
                <button
                  type="button"
                  onClick={locate}
                  disabled={locating}
                  title={t.useMyLocation}
                  className="rounded p-0.5 text-white/70 transition hover:text-gold-300 disabled:opacity-50"
                >
                  <Icon name="compass" className={`size-3.5 ${locating ? "animate-pulse" : ""}`} />
                  <span className="sr-only">{t.useMyLocation}</span>
                </button>
              )}
            </label>
            <LanguageSwitcher />
            <span>{t.currency}</span>
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
              aria-label={t.openMenu}
            >
              <Icon name="menu" className="size-6" />
            </button>

            <Logo name={settings.name} inverse />
          </div>

          <nav className="hidden flex-1 items-center gap-0.5 xl:flex">
            {primaryNav.map((item) => (
              <NavEntry key={item.id} item={item} />
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
                  {t.seeMore}
                  <Icon name="chevronDown" className="size-4" />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full w-[520px] max-w-[90vw] pt-1">
                    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-pop">
                      <p className="px-1 pb-3 text-xs font-bold uppercase tracking-wide text-navy-400">
                        {t.seeMoreTrips}
                      </p>
                      {/* Grille à deux colonnes plutôt qu'une liste étroite : le
                          menu déroulant tenait dans 288px et forçait à faire
                          défiler pour lire une petite quinzaine d'entrées. */}
                      <div className="grid grid-cols-2 gap-1">
                        {overflow.map((c) => (
                          <Link
                            key={c.id}
                            href={l(c.href)}
                            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-navy-50"
                          >
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-navy-50 text-gold-600 transition group-hover:bg-gold-50">
                              <Icon name={c.icon} className="size-4.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-navy-800">
                                {c.label}
                              </span>
                              {c.blurb && (
                                <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-navy-500">
                                  {c.blurb}
                                </span>
                              )}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={l(customer ? "/compte/reservations" : "/aide")}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 md:block"
            >
              {t.myBooking}
            </Link>
            {customer ? (
              <Link
                href={l("/compte/tableau-de-bord")}
                className="flex items-center gap-2 rounded-lg border border-navy-200 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-full bg-navy-800 text-xs font-extrabold text-gold-400"
                >
                  {customer.firstName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{t.myAccount}</span>
              </Link>
            ) : (
              <Link
                href={l("/compte")}
                className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
              >
                {t.login}
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
                aria-label={t.closeMenu}
              >
                <Icon name="close" className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {/* Au doigt, pas de survol : les formules sont dépliées sous leur
                  catégorie plutôt que cachées derrière un second niveau à
                  ouvrir, qui coûte un geste de plus pour rien. */}
              {categories.map((c) => (
                <div key={c.id}>
                  <Link
                    href={l(c.href)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-medium text-navy-800 hover:bg-navy-50"
                  >
                    <Icon name={c.icon} className="size-5 text-gold-600" />
                    {c.label}
                  </Link>
                  {c.subcategories.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-1.5 pb-1 pl-11 pr-3">
                      {c.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={l(sub.href)}
                          onClick={() => setOpen(false)}
                          className="rounded-lg bg-navy-50 px-2.5 py-1.5 text-[13px] font-medium text-navy-600 hover:bg-navy-100 hover:text-navy-900"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {overflow.length > 0 && (
                <>
                  <div className="my-3 border-t border-navy-100" />
                  <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-navy-500">
                    {t.seeMoreTrips}
                  </p>
                  {overflow.map((c) => (
                    <Link
                      key={c.id}
                      href={l(c.href)}
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
                { label: t.help, href: l("/aide") },
                customer
                  ? { label: t.myClientArea, href: l("/compte/tableau-de-bord") }
                  : { label: t.login, href: l("/compte") },
              ].map((entry) => (
                <Link
                  key={entry.label}
                  href={entry.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-[15px] text-navy-700 hover:bg-navy-50"
                >
                  {entry.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Entrée du menu principal, avec ses formules au survol.
 *
 * Une catégorie sans formule reste un simple lien : ouvrir un panneau vide
 * ferait cliquer dans le vide. Les formules ne sont pas des pages mais des
 * filtres sur la page de la catégorie, ce qui évite qu'un « Tout compris »
 * autonome vienne concurrencer « Séjours » sur les moteurs de recherche.
 *
 * Le panneau s'ouvre au survol comme au clavier : le conteneur écoute le focus,
 * sans quoi la navigation à la tabulation ne verrait jamais les formules.
 */
function NavEntry({ item }: { item: NavCategory }) {
  const [open, setOpen] = useState(false);
  const { locale, dict } = useI18n();
  const l = (href: string) => localizedPath(href, locale);

  if (item.subcategories.length === 0) {
    return (
      <Link
        href={l(item.href)}
        className="rounded-lg px-2.5 py-2 text-[14px] font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link
        href={l(item.href)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-[14px] font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
      >
        {item.label}
        <Icon name="chevronDown" className="size-3.5 text-navy-400" />
      </Link>

      {open && (
        <div className="absolute left-0 top-full z-50 w-80 pt-1">
          <div className="rounded-xl border border-navy-100 bg-white p-2 shadow-pop">
            <Link
              href={l(item.href)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-50"
            >
              {dict.header.seeAll}
              <Icon name="chevronRight" className="size-4 text-gold-600" />
            </Link>
            <div className="my-1 border-t border-navy-100" />
            {item.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={l(sub.href)}
                className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-navy-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-800">{sub.label}</p>
                  {sub.blurb && (
                    <p className="mt-0.5 text-xs leading-snug text-navy-500">{sub.blurb}</p>
                  )}
                </div>
                {/* Le volume rassure autant qu'il informe : « 54 » dit que la
                    rubrique est tenue, là où une liste muette laisse un doute. */}
                <span className="mt-0.5 shrink-0 text-[11px] font-semibold tabular-nums text-navy-400">
                  {sub.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Logo({ name, inverse = false }: { name: string; inverse?: boolean }) {
  const { locale } = useI18n();
  return (
    <Link
      href={localizedPath("/", locale)}
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

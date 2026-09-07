import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { localizedPath } from "@/i18n/config";
import { PaymentLogo, SOCIAL_NETWORKS, SocialLogo } from "@/components/ui/BrandLogos";
import { PAYMENT_BADGES } from "@/lib/constants";
import { FOOTER_LINKS, whatsappLink } from "@/lib/data";
import type { NavCategory, SiteSettings } from "@/server/catalogue";

export default function Footer({
  settings,
  categories,
  overflow = [],
  topCountries = [],
}: {
  settings: SiteSettings;
  categories: NavCategory[];
  overflow?: NavCategory[];
  topCountries?: { country: string; href: string }[];
}) {
  const { locale, dict } = useI18n();
  const t = dict.footer;
  const l = (href: string) => localizedPath(href, locale);
  const whatsapp = whatsappLink(settings.whatsapp, t.whatsappMessage);
  // La colonne « Réserver » liste les catégories réellement actives et pointe
  // vers leurs pages ; les autres colonnes restent éditoriales et renvoient
  // vers l'aide. Le débordement y figure aussi : hors du menu principal pour
  // ne pas le surcharger, mais lié depuis le pied de page, donc indexé.
  const columns = FOOTER_LINKS.map((column) =>
    column.title === "Réserver"
      ? {
          title: column.title,
          links: [...categories, ...overflow].map((c) => ({
            label: c.label,
            href: l(c.href),
          })),
        }
      : {
          title: column.title,
          links: column.links.map((label) => ({ label, href: l("/aide") })),
        },
  );

  return (
    <footer className="mt-20 border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-page px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Image
              src="/brand/logo-lockup.png"
              alt={settings.name}
              width={1380}
              height={432}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              {settings.tagline}. {t.taglineSuffix}
            </p>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700"
            >
              <Icon name="phone" className="size-4" />
              {settings.phone}
            </a>

            {/* WhatsApp est ici un moyen de contact à part entière, pas une
                icône de réseau social : il ouvre une conversation avec le
                service client, d'où le bouton plein plutôt qu'une pastille. */}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
              >
                <SocialLogo id="whatsapp" className="size-4.5" />
                {t.writeOnWhatsapp}
                <span className="sr-only">{t.newWindow}</span>
              </a>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-600 transition hover:text-gold-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {topCountries.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">
                {t.topCountries}
              </h3>
              {/* Classement réel, par nombre d'offres publiées — pas une liste
                  éditoriale : voir `getTopCountries`. */}
              <ul className="mt-4 flex flex-wrap gap-2 sm:block sm:space-y-2.5">
                {topCountries.map((c) => (
                  <li key={c.country}>
                    <Link
                      href={l(c.href)}
                      className="inline-block rounded-full border border-navy-200 px-3 py-1 text-xs font-medium text-navy-600 transition hover:border-gold-300 hover:text-gold-700 sm:border-0 sm:px-0 sm:py-0 sm:text-sm sm:font-normal sm:hover:border-0"
                    >
                      {c.country}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-navy-200/70 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.followUs}</span>
            <div className="flex gap-2">
              {SOCIAL_NETWORKS.map((network) => (
                <a
                  key={network.id}
                  href={network.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${network.label}${t.newWindow}`}
                  // Le glyphe porte la couleur officielle du réseau ; au survol
                  // la pastille s'inverse et se remplit de cette même identité.
                  style={
                    {
                      "--brand": network.color,
                      "--brand-fill": network.gradient ?? network.color,
                    } as CSSProperties
                  }
                  className="group relative grid size-9 place-items-center overflow-hidden rounded-full border border-navy-200 bg-white text-[color:var(--brand)] transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 opacity-0 transition-opacity duration-200 [background:var(--brand-fill)] group-hover:opacity-100"
                  />
                  <SocialLogo id={network.id} className="relative size-4.5" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.payment}</span>
            <div className="flex flex-wrap gap-2">
              {/* Marques acceptées, pas moyens sélectionnables : le règlement
                  se fait par carte, ces logos disent simplement lesquelles
                  passent. La liste des choix vit dans PAYMENT_CHOICES. */}
              {PAYMENT_BADGES.map((id) => (
                <PaymentLogo
                  key={id}
                  id={id}
                  className="transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
                />
              ))}
            </div>
          </div>
        </div>

        {/* N'apparaît qu'une fois de vraies accréditations saisies au
            back-office (Réglages) : jamais de mention IATA/Atout
            France/APST par défaut. */}
        {settings.accreditations.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-navy-200/70 pt-6 text-xs text-navy-500">
            {settings.accreditations.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        )}

        {/* La mention suit l'état réel du site, elle n'est pas décorative :
            les prix de référence viennent d'un relevé concurrentiel et non de
            nos propres tarifs passés, et les visuels illustrent la destination
            et non l'établissement. L'écrire évite d'avoir à s'en expliquer. */}
        <p className="mt-8 max-w-4xl text-xs leading-relaxed text-navy-500">
          © {new Date().getFullYear()} {settings.name}. {t.legalNotice.replace("{name}", settings.name)}
        </p>
      </div>
    </footer>
  );
}

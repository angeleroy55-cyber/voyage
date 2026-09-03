"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { AccreditationBadge, PaymentLogo, SOCIAL_NETWORKS, SocialLogo } from "@/components/ui/BrandLogos";
import { useLocale } from "@/components/site/Locale";
import { ACCREDITATION_BADGES, PAYMENT_BADGES } from "@/lib/constants";
import { FOOTER_INFO, FOOTER_LINKS, POPULAR_COUNTRIES, whatsappLink } from "@/lib/data";
import type { I18nKey } from "@/lib/i18n";
import type { NavCategory, SiteSettings } from "@/server/catalogue";

/**
 * Les groupes et libellés d'`FOOTER_INFO` sont écrits en français dans
 * `src/lib/data.ts` (donnée éditoriale, pas une clé) ; cette table fait le
 * lien avec le dictionnaire pour l'anglais et l'espagnol. Un libellé absent
 * d'ici reste affiché en français plutôt que de faire planter la page.
 */
const FOOTER_LABEL_KEYS: Record<string, I18nKey> = {
  "Mentions légales": "footer.legalGroup",
  "À propos": "footer.aboutGroup",
  "Conditions générales": "footer.legal.terms",
  "Politique de confidentialité": "footer.legal.privacy",
  "Gestion des cookies": "footer.legal.cookies",
  Accessibilité: "footer.legal.accessibility",
  Médiation: "footer.legal.mediation",
  "Qui sommes-nous": "footer.about.who",
  "Guides de voyage": "footer.about.guides",
  "Aide et FAQ": "footer.about.help",
  "Nous contacter": "footer.about.contact",
  Recrutement: "footer.about.jobs",
  Affiliation: "footer.about.affiliation",
};

export default function Footer({
  settings,
  categories,
  overflow = [],
}: {
  settings: SiteSettings;
  categories: NavCategory[];
  overflow?: NavCategory[];
}) {
  const { t } = useLocale();
  const label = (fr: string) => (FOOTER_LABEL_KEYS[fr] ? t(FOOTER_LABEL_KEYS[fr]) : fr);

  const whatsapp = whatsappLink(
    settings.whatsapp,
    "Bonjour, je vous contacte au sujet d'un voyage.",
  );
  // La colonne « Réserver » liste les catégories réellement actives et pointe
  // vers leurs pages ; le débordement y figure aussi : hors du menu principal
  // pour ne pas le surcharger, mais lié depuis le pied de page, donc indexé.
  const reserver = {
    title: FOOTER_LINKS[0].title,
    links: [...categories, ...overflow].map((c) => ({ label: c.label, href: c.href })),
  };
  // Chaque pays filtre réellement le catalogue Séjours : contrairement à
  // l'ancienne colonne « Nos sites », ce lien mène quelque part.
  const destinations = POPULAR_COUNTRIES.map((pays) => ({
    label: pays,
    href: `/sejours?q=${encodeURIComponent(pays)}`,
  }));

  return (
    <footer className="mt-20 border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-page px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-1">
            <Image
              src="/brand/logo-lockup.png"
              alt={settings.name}
              width={1380}
              height={432}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              {settings.tagline}. Agence de voyages en ligne affiliée à Govoyages : vols, hôtels,
              croisières, circuits et séjours en discount, réservables en quelques minutes.
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
                {t("footer.whatsapp")}
                <span className="sr-only">{t("header.newWindow")}</span>
              </a>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">
              {label(reserver.title)}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {reserver.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-navy-600 transition hover:text-gold-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">
              {t("footer.popularDestinations")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {destinations.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-navy-600 transition hover:text-gold-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Deux groupes sous un même titre : autant de liens qu'avant, mais
              une colonne de moins à l'écran (retour client : pied de page trop
              chargé). */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">
              {t("footer.information")}
            </h3>
            {FOOTER_INFO.map((section) => (
              <div key={section.group} className="mt-4 first:mt-4">
                <p className="text-xs font-semibold text-navy-500">{label(section.group)}</p>
                <ul className="mt-2 space-y-1.5">
                  {section.links.map((l) => (
                    <li key={l}>
                      <Link href="/aide" className="text-sm text-navy-600 transition hover:text-gold-700">
                        {label(l)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-navy-200/70 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              {t("footer.followUs")}
            </span>
            <div className="flex gap-2">
              {SOCIAL_NETWORKS.map((network) => (
                <a
                  key={network.id}
                  href={network.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${network.label}${t("header.newWindow")}`}
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
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              {t("footer.payment")}
            </span>
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
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              {t("footer.accreditations")}
            </span>
            <div className="flex flex-wrap gap-2">
              {/* Statut réel de l'agence ; badge texte tant que les logos
                  officiels ne sont pas déposés (voir AccreditationBadge). */}
              {ACCREDITATION_BADGES.map((badge) => (
                <AccreditationBadge key={badge.id} label={badge.label} />
              ))}
            </div>
          </div>
        </div>

        {/* La mention suit l'état réel du site, elle n'est pas décorative :
            les prix de référence viennent d'un relevé concurrentiel et non de
            nos propres tarifs passés, et les visuels illustrent la destination
            et non l'établissement. L'écrire évite d'avoir à s'en expliquer. */}
        <p className="mt-8 max-w-4xl text-xs leading-relaxed text-navy-500">
          © {new Date().getFullYear()} {settings.name}. Les prix barrés correspondent à un relevé de
          tarifs constatés chez d&apos;autres distributeurs, à la date indiquée sur la fiche, et non à
          un prix précédemment pratiqué par {settings.name}. Les photographies illustrent la
          destination et proviennent de Wikimedia Commons, sous licences libres ; le crédit de
          chacune figure sur la fiche de l&apos;offre concernée.
        </p>
      </div>
    </footer>
  );
}

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import {
  PAYMENT_METHODS,
  PaymentLogo,
  SOCIAL_NETWORKS,
  SocialLogo,
} from "@/components/ui/BrandLogos";
import { FOOTER_LINKS } from "@/lib/data";
import type { SearchCategory, SiteSettings } from "@/server/catalogue";

export default function Footer({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: SearchCategory[];
}) {
  // La colonne « Réserver » liste les types de voyage réellement actifs et
  // pointe vers leurs pages de résultats ; les autres colonnes restent
  // éditoriales et renvoient vers l'aide.
  const columns = FOOTER_LINKS.map((column) =>
    column.title === "Réserver"
      ? {
          title: column.title,
          links: categories.map((c) => ({ label: c.label, href: `/recherche/${c.id}` })),
        }
      : {
          title: column.title,
          links: column.links.map((label) => ({ label, href: "/aide" })),
        },
  );

  return (
    <footer className="mt-20 border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-page px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Image
              src="/brand/logo-lockup.png"
              alt={settings.name}
              width={1380}
              height={432}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              {settings.tagline}. Agence de voyages en ligne : vols, hôtels, croisières, circuits et
              séjours, réservables en quelques minutes.
            </p>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700"
            >
              <Icon name="phone" className="size-4" />
              {settings.phone}
            </a>
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
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-navy-200/70 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">Suivez-nous</span>
            <div className="flex gap-2">
              {SOCIAL_NETWORKS.map((network) => (
                <a
                  key={network.id}
                  href={network.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${network.label} (nouvelle fenêtre)`}
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
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">Paiement</span>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <PaymentLogo
                  key={method.id}
                  id={method.id}
                  className="transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
                />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-navy-500">
          © {new Date().getFullYear()} {settings.name}, projet de démonstration. Les offres, prix et avis
          affichés sont fictifs et générés pour les besoins de la maquette. Photographies :
          placeholders Picsum.
        </p>
      </div>
    </footer>
  );
}

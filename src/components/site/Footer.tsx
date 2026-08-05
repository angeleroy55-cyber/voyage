import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { BRAND, FOOTER_LINKS } from "@/lib/data";

const SOCIAL = ["Facebook", "Instagram", "Pinterest", "YouTube"];
const PAYMENTS = ["Visa", "Mastercard", "CB", "PayPal", "Virement", "4× sans frais"];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-page px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/logo-mark.png"
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-xl"
              />
              <span className="text-xl font-extrabold leading-none tracking-tight text-navy-900">
                <span className="text-gold-500">Go</span>Séjour
                <span className="ml-0.5 align-top text-xs font-bold text-gold-500">.fr</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              {BRAND.tagline}. Agence de voyages en ligne : vols, hôtels, croisières, circuits et
              séjours, réservables en quelques minutes.
            </p>
            <a
              href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-700"
            >
              <Icon name="phone" className="size-4" />
              {BRAND.phone}
            </a>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="/aide" className="text-sm text-navy-600 transition hover:text-gold-700">
                      {link}
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
              {SOCIAL.map((s) => (
                <Link
                  key={s}
                  href="/aide"
                  aria-label={s}
                  className="grid size-9 place-items-center rounded-full border border-navy-200 bg-white text-xs font-bold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
                >
                  {s[0]}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500">Paiement</span>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-navy-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-600"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-navy-500">
          © {new Date().getFullYear()} {BRAND.name} — projet de démonstration. Les offres, prix et avis
          affichés sont fictifs et générés pour les besoins de la maquette. Photographies :
          placeholders Picsum.
        </p>
      </div>
    </footer>
  );
}

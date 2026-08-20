import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/data";

const DESCRIPTION =
  "Réservez vol + hôtel, croisières, circuits, campings et locations de voiture au meilleur prix. Assistance 24 h/24 et paiement en plusieurs fois.";

function resolveMetadataBase(): URL {
  const candidates = [
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    "http://localhost:3000",
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;

    const normalized = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value) ? value : `https://${value}`;
    try {
      return new URL(normalized);
    } catch {
      // Une valeur invalide ne doit pas faire tomber tout le build.
    }
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  // Sans base, Next ne peut pas rendre absolue l'URL de `opengraph-image.png`,
  // et les réseaux sociaux refusent une image relative.
  metadataBase: resolveMetadataBase(),
  title: {
    default: `${BRAND.name} · Vols, hôtels, croisières et séjours`,
    template: `%s | ${BRAND.name}`,
  },
  description: DESCRIPTION,
  // `src/app/icon.png` et `src/app/opengraph-image.png` sont des routes de
  // fichier : Next pose lui-même les balises, il n'y a rien à déclarer ici.
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "fr_FR",
    title: `${BRAND.name} · Vols, hôtels, croisières et séjours`,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

// Racine volontairement nue : l'en-tête et le pied de page du site public sont
// portés par (site)/layout.tsx, pour que le back-office n'en hérite pas.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

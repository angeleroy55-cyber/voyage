import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Réservez vol + hôtel, croisières, circuits, campings et locations de voiture au meilleur prix. Assistance 24 h/24 et paiement en plusieurs fois.";

export const metadata: Metadata = {
  // Sans base, Next ne peut pas rendre absolue l'URL de `opengraph-image.png`,
  // et les réseaux sociaux refusent une image relative.
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
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
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Vols, hôtels, croisières et séjours`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Réservez vol + hôtel, croisières, circuits, campings et locations de voiture au meilleur prix. Assistance 24 h/24 et paiement en plusieurs fois.",
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

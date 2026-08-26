import "server-only";
import { headers } from "next/headers";
import { matchDepartureCity } from "@/lib/geo";

/**
 * Ville du visiteur, lue dans les en-têtes posés par l'hébergeur.
 *
 * Vercel, Cloudflare, Netlify et Fastly résolvent l'adresse IP avant nous et
 * transmettent la ville dans la requête. On se contente de la lire : aucun
 * appel réseau, aucune adresse IP transmise à un tiers, et rien à installer.
 *
 * En développement, aucun de ces en-têtes n'existe : la fonction rend `null` et
 * l'interface se rabat sur le fuseau horaire du navigateur.
 */
const EN_TETES = [
  "x-vercel-ip-city", // Vercel
  "cf-ipcity", // Cloudflare
  "x-nf-client-city", // Netlify
  "fastly-geo-city", // Fastly
  "x-geo-city", // proxy maison
];

export async function detectDepartureCity(): Promise<string | null> {
  const requete = await headers();
  for (const cle of EN_TETES) {
    const ville = matchDepartureCity(requete.get(cle));
    if (ville) return ville;
  }
  return null;
}

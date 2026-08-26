import { DEPARTURE_CITIES } from "@/lib/places";

/**
 * Repérage de la ville du visiteur, sans service tiers.
 *
 * Deux sources, dans cet ordre.
 *
 * 1. L'en-tête de géolocalisation de l'hébergeur, quand il en pose un. Vercel,
 *    Cloudflare et Netlify résolvent l'adresse IP en amont et transmettent la
 *    ville dans la requête : c'est gratuit, ça n'ajoute aucun aller-retour, et
 *    rien ne sort du serveur.
 * 2. À défaut, le fuseau horaire du navigateur. `Intl` le donne sans permission
 *    ni requête réseau, et il suffit à distinguer Bruxelles de Genève ou de
 *    Fort-de-France.
 *
 * Ce qu'on ne fait pas : appeler une API de géolocalisation IP, qui reviendrait
 * à transmettre l'adresse de chaque visiteur à un tiers, ni demander la
 * permission de géolocalisation du navigateur, qui affiche une fenêtre système
 * pour un simple pré-remplissage de formulaire.
 *
 * Le résultat n'est qu'une proposition : la ville reste modifiable, et le choix
 * du visiteur l'emporte toujours sur la détection.
 */

/**
 * Villes détectées écrites autrement par les hébergeurs, qui rendent en général
 * le nom local ou anglais. Seules les différences réelles figurent ici.
 */
const ALIAS: Record<string, string> = {
  brussels: "Bruxelles",
  bruxelles: "Bruxelles",
  brussel: "Bruxelles",
  geneva: "Genève",
  genf: "Genève",
  basel: "Bâle",
  basle: "Bâle",
  zurich: "Zurich",
  zürich: "Zurich",
  luxembourg: "Luxembourg",
  lyons: "Lyon",
  marseilles: "Marseille",
  "saint-denis": "Saint-Denis de La Réunion",
  "st denis": "Saint-Denis de La Réunion",
  "pointe-a-pitre": "Pointe-à-Pitre",
  "pointe à pitre": "Pointe-à-Pitre",
  "fort-de-france": "Fort-de-France",
  strasbourg: "Strasbourg",
  liege: "Liège",
  "clermont ferrand": "Clermont-Ferrand",
  "saint etienne": "Saint-Étienne",
  "le havre": "Le Havre",
  "la rochelle": "La Rochelle",
};

/** Compare deux noms de ville sans tenir compte des accents ni de la casse. */
function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Ramène un nom de ville détecté à une ville de départ du catalogue.
 *
 * Rend `null` si la ville n'est pas desservie : mieux vaut ne rien proposer
 * qu'un départ depuis une ville d'où nous ne faisons pas partir.
 */
export function matchDepartureCity(detected: string | undefined | null): string | null {
  if (!detected) return null;

  const brut = decodeURIComponent(detected).trim();
  if (!brut) return null;

  const alias = ALIAS[normalise(brut)];
  if (alias && DEPARTURE_CITIES.includes(alias)) return alias;

  const cible = normalise(brut);
  return DEPARTURE_CITIES.find((ville) => normalise(ville) === cible) ?? null;
}

/**
 * Ville déduite du fuseau horaire du navigateur.
 *
 * Un fuseau ne désigne pas une ville : toute la France métropolitaine partage
 * `Europe/Paris`. La déduction est donc volontairement grossière, et ne sert
 * qu'à distinguer les grands bassins de départ quand l'hébergeur ne dit rien.
 */
const FUSEAUX: Record<string, string> = {
  "Europe/Paris": "Paris",
  "Europe/Brussels": "Bruxelles",
  "Europe/Zurich": "Genève",
  "Europe/Luxembourg": "Luxembourg",
  "Europe/Monaco": "Nice",
  "Indian/Reunion": "Saint-Denis de La Réunion",
  "Indian/Mayotte": "Mamoudzou",
  "America/Guadeloupe": "Pointe-à-Pitre",
  "America/Martinique": "Fort-de-France",
  "America/Cayenne": "Cayenne",
};

export function cityFromTimeZone(timeZone: string | undefined): string | null {
  if (!timeZone) return null;
  const ville = FUSEAUX[timeZone];
  return ville && DEPARTURE_CITIES.includes(ville) ? ville : null;
}

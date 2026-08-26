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

/**
 * Coordonnées des villes de départ.
 *
 * Elles servent à traduire la position rendue par le navigateur en ville de
 * départ, sans passer par un service de géocodage inverse. C'est plus juste
 * pour notre besoin : on ne cherche pas le nom exact de la commune du visiteur,
 * mais l'aéroport d'où il partira, ce que la ville la plus proche donne
 * directement. Et rien ne sort du poste du visiteur.
 */
const COORDONNEES: Record<string, [number, number]> = {
  Paris: [48.8566, 2.3522],
  "Paris Beauvais": [49.4544, 2.1128],
  Lille: [50.6292, 3.0573],
  Strasbourg: [48.5734, 7.7521],
  Metz: [49.1193, 6.1757],
  Nancy: [48.6921, 6.1844],
  Mulhouse: [47.75, 7.34],
  Reims: [49.2583, 4.0317],
  Dijon: [47.322, 5.0415],
  Besançon: [47.238, 6.0243],
  Nantes: [47.2184, -1.5536],
  Rennes: [48.1173, -1.6778],
  Brest: [48.3904, -4.4861],
  Quimper: [47.9959, -4.0969],
  Lorient: [47.7482, -3.3702],
  "Saint-Brieuc": [48.5144, -2.7653],
  Dinard: [48.6314, -2.0603],
  Caen: [49.1829, -0.3707],
  Deauville: [49.36, 0.0757],
  Rouen: [49.4432, 1.0999],
  "Le Havre": [49.4944, 0.1079],
  Angers: [47.4784, -0.5632],
  "Le Mans": [48.0061, 0.1996],
  Tours: [47.3941, 0.6848],
  Bordeaux: [44.8378, -0.5792],
  Toulouse: [43.6047, 1.4442],
  Biarritz: [43.4832, -1.5586],
  Pau: [43.2951, -0.3708],
  Bergerac: [44.8508, 0.4815],
  "La Rochelle": [46.1591, -1.1520],
  Poitiers: [46.5802, 0.3404],
  Limoges: [45.8336, 1.2611],
  Agen: [44.2049, 0.6212],
  Tarbes: [43.2328, 0.0781],
  Rodez: [44.3494, 2.5738],
  Brive: [45.1583, 1.5331],
  Nice: [43.7102, 7.2620],
  Marseille: [43.2965, 5.3698],
  Lyon: [45.7640, 4.8357],
  Montpellier: [43.6108, 3.8767],
  Toulon: [43.1242, 5.9280],
  Perpignan: [42.6887, 2.8948],
  Nîmes: [43.8367, 4.3601],
  Avignon: [43.9493, 4.8055],
  Béziers: [43.3442, 3.2158],
  Carcassonne: [43.2130, 2.3491],
  Grenoble: [45.1885, 5.7245],
  Chambéry: [45.5646, 5.9178],
  "Clermont-Ferrand": [45.7772, 3.0870],
  "Saint-Étienne": [45.4397, 4.3872],
  Ajaccio: [41.9192, 8.7386],
  Bastia: [42.7028, 9.4508],
  Calvi: [42.5675, 8.7576],
  Figari: [41.5006, 9.0978],
  "Pointe-à-Pitre": [16.2412, -61.5330],
  "Fort-de-France": [14.6161, -61.0588],
  "Saint-Denis de La Réunion": [-20.8823, 55.4504],
  Cayenne: [4.9224, -52.3135],
  Mamoudzou: [-12.7806, 45.2278],
  Bruxelles: [50.8503, 4.3517],
  Charleroi: [50.4108, 4.4446],
  Liège: [50.6326, 5.5797],
  Genève: [46.2044, 6.1432],
  Bâle: [47.5596, 7.5886],
  Zurich: [47.3769, 8.5417],
  Luxembourg: [49.6116, 6.1319],
};

/**
 * Ville de départ la plus proche d'une position.
 *
 * La distance est calculée à plat, sur une projection sommaire du degré de
 * longitude par le cosinus de la latitude. La formule exacte de la sphère ne
 * changerait rien au classement à cette échelle, et coûterait plus cher à lire
 * qu'à exécuter.
 *
 * Au-delà de 400 kilomètres de toute ville desservie, rien n'est rendu : mieux
 * vaut ne rien proposer que faire partir de Lille quelqu'un qui est à Madrid.
 */
export function nearestDepartureCity(
  latitude: number,
  longitude: number,
  rayonKm = 400,
): string | null {
  let meilleure: string | null = null;
  let distanceMin = Infinity;

  for (const [ville, [lat, lon]] of Object.entries(COORDONNEES)) {
    const dLat = (lat - latitude) * 111;
    const dLon = (lon - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
    const distance = Math.hypot(dLat, dLon);
    if (distance < distanceMin) {
      distanceMin = distance;
      meilleure = ville;
    }
  }

  return distanceMin <= rayonKm ? meilleure : null;
}

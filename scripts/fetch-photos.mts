/**
 * Photographies réelles du catalogue, depuis Wikimedia Commons.
 *
 *   npm run photos          # complète ce qui manque
 *   npm run photos -- --tout  # refait tout, y compris ce qui existe déjà
 *
 * Pourquoi Commons plutôt qu'une banque d'images : les fichiers y sont sous
 * licence libre, réutilisables commercialement, et l'API rend la licence et
 * l'auteur avec l'image. On peut donc créditer correctement, ce qu'aucune URL
 * de placeholder ne permet.
 *
 * Le tri est volontairement sévère. Une recherche « Djerba » rend aussi des
 * cartes topographiques, des blasons et des scans de documents : rien de tout
 * cela ne ressemble à une photo de voyage. Le script écarte donc les formats
 * verticaux, les petites images, et les titres qui trahissent un document.
 *
 * Le résultat est écrit dans src/lib/media/photos.json, versionné : le seed
 * n'appelle aucun réseau, et deux installations donnent le même catalogue.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DESTINATIONS, OFFERS } from "../src/lib/catalogue-source";
import { photoHintFor, photoQueryFor } from "../src/lib/media/photo-query";

const SORTIE = "src/lib/media/photos.json";
const TOUT = process.argv.includes("--tout");

/** Wikimedia demande un agent identifiable, avec un moyen de contact. */
const AGENT = "GoSejour-catalogue/1.0 (https://gosejour.fr ; contact@gosejour.fr)";

/** Nombre de visuels retenus par requête : la galerie d'une offre en montre cinq. */
const PAR_REQUETE = 6;

/** Écartés d'office : ces mots signalent un document, pas une photographie. */
const TITRES_EXCLUS = [
  // Documents et symboles
  "map", "carte", "plan", "flag", "drapeau", "coat of arms", "blason", "logo",
  "diagram", "chart", "graph", "seal", "banner", "icon", "poster", "stamp",
  "timbre", "location", "locator", "topographic", "satellite", "svg", "sketch",
  // Œuvres et pièces de collection : une gravure du XVIe siècle illustre mal
  // un séjour balnéaire, même quand elle représente la bonne ville.
  "painting", "peinture", "engraving", "gravure", "lithograph", "etching",
  "drawing", "dessin", "portrait", "manuscript", "manuscrit", "fol.",
  "musée", "museum", "postcard", "carte postale", "illustration", "woodcut",
  "coin", "medal", "monnaie", "statue de", "bust of",
];

/**
 * Millésime ancien repéré dans un titre.
 *
 * Commons date ses reproductions dans le nom du fichier : « (c. 1550-1554) »,
 * « 1893 ». Une image ainsi datée avant 1950 est une reproduction d’œuvre, pas
 * une photo de voyage exploitable sur une carte offre.
 */
function estAncienne(titre: string): boolean {
  const annees = titre.match(/(1[0-9]{3})/g);
  return annees ? annees.some((a) => Number(a) < 1950) : false;
}

/**
 * Ordre de préférence des licences.
 *
 * Le domaine public et CC0 passent devant : ils n'imposent aucune mention, ce
 * qui simplifie l'affichage sur une carte offre. Les licences à attribution
 * restent acceptées, mais le crédit est alors obligatoire et enregistré avec
 * l'image.
 */
function rangLicence(nom: string | undefined): number {
  const l = (nom ?? "").toLowerCase();
  if (l.includes("public domain") || l.includes("cc0") || l.includes("pd-")) return 0;
  if (l.startsWith("cc by-sa")) return 2;
  if (l.startsWith("cc by")) return 1;
  return 3;
}

function texteBrut(html: string | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

type Trouvaille = {
  url: string;
  licence: string;
  auteur: string;
  page: string;
};

/** Forme utile de la réponse de l API : le reste n intéresse pas ce script. */
type PageCommons = {
  title?: string;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    width: number;
    height: number;
    thumbwidth?: number;
    thumbheight?: number;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

async function chercher(requete: string): Promise<Trouvaille[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: `filetype:bitmap ${requete}`,
      gsrnamespace: "6",
      gsrlimit: "30",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size",
      iiurlwidth: "1280",
    });

  const reponse = await fetch(url, { headers: { "User-Agent": AGENT } });
  if (!reponse.ok) throw new Error(`Commons a répondu ${reponse.status}`);
  const donnees = await reponse.json();

  const pages = Object.values((donnees.query?.pages ?? {}) as Record<string, PageCommons>);
  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      const source = info?.thumburl ?? info?.url;
      if (!info || !source) return null;
      const meta = info.extmetadata ?? {};
      const titre = String(page.title ?? "").replace(/^File:/, "");
      return {
        titre,
        url: source,
        largeur: info.thumbwidth ?? info.width,
        hauteur: info.thumbheight ?? info.height,
        ratio: info.width / info.height,
        licence: meta.LicenseShortName?.value ?? "",
        auteur: texteBrut(meta.Artist?.value),
        page: info.descriptionurl ?? "",
        source: info.width,
      };
    })
    .filter((image): image is NonNullable<typeof image> => {
      if (!image?.url) return false;
      const titre = image.titre.toLowerCase();
      if (TITRES_EXCLUS.some((mot) => titre.includes(mot))) return false;
      if (estAncienne(image.titre)) return false;
      if (!/\.(jpe?g|png)$/i.test(image.titre)) return false;
      // Une photo de voyage est large : le portrait et le carré cadrent mal
      // dans une carte en 16/10, et le panoramique extrême non plus.
      if (image.ratio < 1.25 || image.ratio > 2.4) return false;
      // Sous 1000 px d'original, l'image pixellise dès la vignette de listing.
      if (image.source < 1000) return false;
      return true;
    })
    .sort((a, b) => rangLicence(a.licence) - rangLicence(b.licence) || b.source - a.source)
    .slice(0, PAR_REQUETE)
    // Le titre du fichier a servi au filtrage, il ne va pas plus loin : rien
    // ne l'affiche, et la page d'origine identifie déjà le visuel.
    .map((image) => ({
      url: image.url.split("?")[0],
      licence: image.licence,
      auteur: image.auteur,
      page: image.page,
    }));
}
// ---------------------------------------------------------------------------

/**
 * Noms sous lesquels Commons indexe les lieux.
 *
 * Le catalogue est écrit en français, l'encyclopédie est indexée en anglais :
 * « Athènes » ne rend rien, « Athens » rend deux mille photos. Ce tableau ne
 * traduit que ce qui diffère réellement ; tout ce qui s'écrit pareil dans les
 * deux langues en est absent.
 *
 * Il ne change pas la clé enregistrée, seulement le mot envoyé à l'API : le
 * seed continue de chercher « Athènes skyline » et trouve les photos d'Athens.
 */
const NOMS_COMMONS: Record<string, string> = {
  Athènes: "Athens",
  Barcelone: "Barcelona",
  Bruxelles: "Brussels",
  Cancún: "Cancun",
  Catane: "Catania",
  Copenhague: "Copenhagen",
  Corfou: "Corfu",
  Crète: "Crete",
  Djerba: "Djerba Tunisia",
  Dubaï: "Dubai",
  "Grande Canarie": "Gran Canaria",
  Hanoï: "Hanoi",
  Héraklion: "Heraklion",
  "Le Caire": "Cairo",
  "Le Cap": "Cape Town",
  "Le Cap d'Agde": "Cap d'Agde",
  "Les Epesses": "Puy du Fou",
  "Les Trois-Îlets": "Trois-Ilets Martinique",
  Lisbonne: "Lisbon",
  Londres: "London",
  Madère: "Madeira",
  Malé: "Male Maldives",
  "Marne-la-Vallée": "Disneyland Paris",
  Marrakech: "Marrakesh",
  Mombasa: "Diani Beach Kenya",
  Munich: "Munich",
  Naples: "Naples Italy",
  "Palma de Majorque": "Palma de Mallorca",
  Pékin: "Beijing",
  Plailly: "Parc Asterix",
  Poitiers: "Futuroscope",
  "Pointe-à-Pitre": "Pointe-a-Pitre Guadeloupe",
  Poreč: "Porec Croatia",
  Rust: "Europa-Park",
  "Saint-Denis": "Saint-Denis Reunion",
  Sal: "Santa Maria Sal Cape Verde",
  Santorin: "Santorini",
  Séville: "Seville",
  Sicile: "Sicily",
  Tachkent: "Tashkent",
  Taormine: "Taormina",
  Ténérife: "Tenerife",
  "Vallon-Pont-d'Arc": "Ardeche gorges",
  Venise: "Venice",
  Vienne: "Vienna",
  Zanzibar: "Zanzibar beach",
  Édimbourg: "Edinburgh",
  "Saint-Gilles-les-Bains": "Saint-Gilles Reunion",
  Biscarrosse: "Biscarrosse Landes",
  "Saint-Jean-de-Monts": "Saint-Jean-de-Monts Vendee",
  Bénodet: "Benodet Brittany",
  Viareggio: "Viareggio Tuscany",
  Olbia: "Costa Smeralda",
  "Riviera Maya": "Riviera Maya Mexico",
  Denpasar: "Bali beach",
  Bentota: "Bentota Sri Lanka",
  Nairobi: "Masai Mara",
  Arusha: "Serengeti",
  Tirana: "Albania Riviera",
  Cusco: "Machu Picchu",
  Colombo: "Sigiriya",
  Jaipur: "Jaipur Rajasthan",
  "Siem Reap": "Angkor Wat",
  Passau: "Danube Passau",
  Louxor: "Luxor",
  Bergen: "Bergen Norway",
  "Las Palmas": "Gran Canaria",
  Vancouver: "Alaska glacier",
  Miami: "Miami Beach",
  Orlando: "Orlando Florida",
  Salou: "PortAventura",
  Sliema: "Sliema Malta",
  Larnaca: "Larnaca Cyprus",
  Alcúdia: "Alcudia Mallorca",
  Taghazout: "Taghazout Morocco",
  Saly: "Saly Senegal",
  "Flic en Flac": "Flic en Flac Mauritius",
  "Belle Mare": "Belle Mare Mauritius",
  Mahé: "Mahe Seychelles",
  "Boa Vista": "Boa Vista Cape Verde",
  "Sainte-Anne": "Sainte-Anne Guadeloupe",
  Varadero: "Varadero Cuba",
  "Montego Bay": "Montego Bay Jamaica",
  "Punta Cana": "Punta Cana",
  Nice: "Nice France",
  Lyon: "Lyon France",
  Marseille: "Marseille France",
  Bordeaux: "Bordeaux France",
  Paris: "Paris France",
  Rome: "Rome Italy",
  Milan: "Milan Italy",
  Berlin: "Berlin Germany",
  Dublin: "Dublin Ireland",
  Colmar: "Colmar Alsace",
  Annecy: "Annecy lake",
  Deauville: "Deauville Normandy",
  Biarritz: "Biarritz beach",
  "Saint-Malo": "Saint-Malo Brittany",
  "Porto-Vecchio": "Porto-Vecchio Corsica",
  Royan: "Royan Charente",
  Fréjus: "Frejus Var",
  Ajaccio: "Ajaccio Corsica",
  Casablanca: "Casablanca Morocco",
  Dakar: "Dakar Senegal",
  Tunis: "Tunis Tunisia",
  Agadir: "Agadir Morocco",
  Essaouira: "Essaouira Morocco",
  Ouarzazate: "Merzouga dunes",
  Hurghada: "Hurghada Red Sea",
  "Charm el-Cheikh": "Sharm El Sheikh",
  "Marsa Alam": "Marsa Alam",
  Antalya: "Antalya beach",
  Istanbul: "Istanbul Turkey",
  Dubrovnik: "Dubrovnik Croatia",
  Split: "Split Croatia",
  Amman: "Petra Jordan",
  Reykjavik: "Reykjavik Iceland",
  Amsterdam: "Amsterdam canals",
  Prague: "Prague Czech Republic",
  Budapest: "Budapest Hungary",
  Bruges: "Bruges Belgium",
  Madrid: "Madrid Spain",
  Malaga: "Malaga Spain",
  Faro: "Faro Portugal",
  Porto: "Porto Portugal",
  Albufeira: "Albufeira Algarve",
  Torremolinos: "Torremolinos Costa del Sol",
  "Lloret de Mar": "Lloret de Mar",
  Ibiza: "Ibiza Spain",
  Lanzarote: "Lanzarote",
  Fuerteventura: "Fuerteventura",
  Rhodes: "Rhodes Greece",
  Kos: "Kos Greece",
  Krabi: "Krabi Thailand",
  Phuket: "Phuket Thailand",
  Bangkok: "Bangkok Thailand",
  Seminyak: "Seminyak Bali",
  Tokyo: "Tokyo Japan",
  "New York": "New York City",
  Montréal: "Montreal Canada",
  "Rio de Janeiro": "Rio de Janeiro",
  "Buenos Aires": "Buenos Aires",
  "San José": "Arenal Costa Rica",
  "Las Vegas": "Grand Canyon",
  "Fort-de-France": "Martinique beach",
  Cancun: "Cancun",
};

/** Nom international d'un lieu, ou son nom français s'il s'écrit pareil. */
function nomCommons(ville: string): string {
  return NOMS_COMMONS[ville] ?? ville;
}

/**
 * Tentatives de recherche, de la plus précise à la plus large.
 *
 * Une plage à Vallon-Pont-d'Arc n'existe pas dans Commons, mais les gorges de
 * l'Ardèche oui. Plutôt que de laisser un trou dans la grille, on élargit :
 * d'abord le type de vue attendu, puis la ville et son pays, puis la ville
 * seule. La première tentative qui rend au moins une image l'emporte.
 */
function tentativesPour(offre: { destination: string; country: string; subtype?: string }): string[] {
  const ville = nomCommons(offre.destination);
  const hint = photoHintFor(offre.subtype);
  const essais = [
    hint ? `${ville} ${hint}` : "",
    `${ville} ${offre.country}`,
    ville,
  ].filter(Boolean);
  return [...new Set(essais)];
}

// La clé enregistrée vient de `photoQueryFor`, partagée avec le seed : les deux
// ne peuvent donc pas diverger, et une image récupérée ici est toujours celle
// que le seed ira chercher, quel que soit le terme qui l'a trouvée.
type Cible = { cle: string; tentatives: string[] };

const cibles = new Map<string, Cible>();
for (const destination of DESTINATIONS) {
  cibles.set(destination.photo, {
    cle: destination.photo,
    tentatives: [destination.photo, nomCommons(destination.name), destination.country],
  });
}
for (const offre of OFFERS) {
  const cle = photoQueryFor(offre);
  if (!cibles.has(cle)) cibles.set(cle, { cle, tentatives: tentativesPour(offre) });
}

let cache: Record<string, Trouvaille[]> = {};
try {
  cache = JSON.parse(readFileSync(SORTIE, "utf8"));
} catch {
  // Premier passage : le fichier n'existe pas encore.
}

const aFaire = [...cibles.values()].filter((c) => TOUT || !cache[c.cle]?.length);
console.log(`${cibles.size} illustration(s) au catalogue, ${aFaire.length} à récupérer.`);

let trouvees = 0;
let vides = 0;

for (const [index, cible] of aFaire.entries()) {
  let images: Trouvaille[] = [];
  for (const tentative of cible.tentatives) {
    try {
      images = await chercher(tentative);
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      console.log(`  échec (${message}) : ${tentative}`);
    }
    if (images.length > 0) break;
    // Une requête toutes les 200 ms : bien en deçà des limites de l'API, et
    // suffisant pour ne pas se faire couper au milieu du catalogue.
    await new Promise((resoudre) => setTimeout(resoudre, 200));
  }

  if (images.length > 0) {
    cache[cible.cle] = images;
    trouvees += 1;
  } else {
    cache[cible.cle] = cache[cible.cle] ?? [];
    vides += 1;
    console.log(`  aucune image : ${cible.cle}`);
  }

  if ((index + 1) % 25 === 0) console.log(`  ${index + 1}/${aFaire.length}…`);
  await new Promise((resoudre) => setTimeout(resoudre, 200));
}

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, `${JSON.stringify(cache, null, 2)}\n`);

const total = Object.values(cache).reduce((n, images) => n + images.length, 0);
const servies = Object.values(cache).filter((images) => images.length > 0).length;
console.log(`Terminé : ${trouvees} récupérée(s) ce passage, ${vides} sans résultat.`);
console.log(`${SORTIE} : ${total} image(s) pour ${servies}/${Object.keys(cache).length} illustrations.`);

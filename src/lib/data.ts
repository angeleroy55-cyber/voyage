import type { Board, Category, Destination, Offer, Post, Review } from "./types";

export const BRAND = {
  name: "GoSéjour",
  domain: "gosejour.fr",
  tagline: "Voyages • Séjours • Expériences",
  phone: "01 86 65 00 00",
  email: "contact@gosejour.fr",
};

export const CATEGORIES: Category[] = [
  {
    id: "vol-hotel",
    label: "Vol + Hôtel",
    icon: "package",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Composez votre séjour : le vol et l'hôtel réservés en une seule fois.",
  },
  {
    id: "hotels",
    label: "Hôtels",
    icon: "bed",
    form: ["destination", "dates", "travellers"],
    blurb: "Des chambres négociées dans plus de 400 000 établissements.",
  },
  {
    id: "croisieres",
    label: "Croisières",
    icon: "ship",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Méditerranée, Caraïbes ou fjords : embarquez au meilleur prix.",
  },
  {
    id: "circuits",
    label: "Circuits",
    icon: "route",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Des itinéraires accompagnés pour voir l'essentiel sans rien organiser.",
  },
  {
    id: "vols",
    label: "Vols",
    icon: "plane",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Comparez 600 compagnies aériennes en une recherche.",
  },
  {
    id: "escapades",
    label: "Escapades",
    icon: "sparkles",
    form: ["destination", "dates", "travellers"],
    blurb: "Deux ou trois nuits pour changer d'air sans poser de congés.",
  },
  {
    id: "campings",
    label: "Campings",
    icon: "tent",
    form: ["destination", "dates", "travellers"],
    blurb: "Mobil-homes et clubs nature, idéal en famille.",
  },
  {
    id: "voitures",
    label: "Voitures",
    icon: "car",
    form: ["destination", "dates", "driver"],
    blurb: "Location sans frais cachés, annulation gratuite jusqu'à 48 h.",
  },
];

export const DEPARTURE_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Bordeaux",
  "Nantes",
  "Nice",
  "Lille",
  "Strasbourg",
  "Genève",
  "Bruxelles",
];

/**
 * Compact offer source. Full `Offer` objects are derived below so the catalogue
 * stays readable while keeping every card and detail page populated.
 */
type RawOffer = [
  slug: string,
  category: Offer["category"],
  title: string,
  destination: string,
  country: string,
  region: string,
  nights: number,
  stars: number,
  board: Board,
  price: number,
  oldPrice: number,
  rating: number,
  reviews: number,
  tags: string[],
];

const RAW: RawOffer[] = [
  // Vol + Hôtel
  ["marrakech-palmeraie", "vol-hotel", "Riad & spa dans la Palmeraie", "Marrakech", "Maroc", "Afrique du Nord", 7, 4, "Demi-pension", 489, 645, 8.7, 1284, ["Vente flash", "Spa"]],
  ["hurghada-mer-rouge", "vol-hotel", "Club bord de mer, récifs de la mer Rouge", "Hurghada", "Égypte", "Mer Rouge", 8, 5, "Tout compris", 629, 879, 8.9, 2140, ["Tout compris", "Plongée"]],
  ["djerba-lagune", "vol-hotel", "Resort face à la lagune", "Djerba", "Tunisie", "Afrique du Nord", 7, 4, "Tout compris", 419, 559, 8.4, 962, ["Famille"]],
  ["fuerteventura-dunes", "vol-hotel", "Hôtel sur les dunes de Corralejo", "Fuerteventura", "Espagne", "Canaries", 7, 4, "Demi-pension", 542, 690, 8.6, 1470, ["Canaries"]],
  ["cancun-riviera", "vol-hotel", "Resort tout compris Riviera Maya", "Cancún", "Mexique", "Caraïbes", 9, 5, "Tout compris", 1249, 1590, 9.1, 843, ["Longue distance", "Tout compris"]],
  ["crete-heraklion", "vol-hotel", "Village-club au sud d'Héraklion", "Crète", "Grèce", "Îles grecques", 7, 4, "Tout compris", 598, 749, 8.5, 1103, ["Grèce"]],
  ["punta-cana-bavaro", "vol-hotel", "Pieds dans le sable à Bávaro", "Punta Cana", "République dominicaine", "Caraïbes", 9, 5, "Tout compris", 1099, 1420, 8.8, 1655, ["Tout compris"]],
  ["madere-funchal", "vol-hotel", "Balcon sur l'Atlantique à Funchal", "Madère", "Portugal", "Atlantique", 6, 4, "Petit-déjeuner", 465, 580, 8.9, 731, ["Nature"]],

  // Hôtels
  ["barcelone-eixample", "hotels", "Boutique-hôtel dans l'Eixample", "Barcelone", "Espagne", "Europe", 3, 4, "Petit-déjeuner", 168, 219, 8.8, 3120, ["Ville"]],
  ["rome-trastevere", "hotels", "Maison d'hôtes au Trastevere", "Rome", "Italie", "Europe", 3, 3, "Petit-déjeuner", 149, 189, 8.6, 2450, ["Ville"]],
  ["lisbonne-alfama", "hotels", "Vue Tage depuis l'Alfama", "Lisbonne", "Portugal", "Europe", 4, 4, "Petit-déjeuner", 192, 245, 9.0, 1877, ["Coup de cœur"]],
  ["amsterdam-canaux", "hotels", "Hôtel design le long des canaux", "Amsterdam", "Pays-Bas", "Europe", 3, 4, "Sans repas", 214, 268, 8.5, 1290, ["Ville"]],
  ["marrakech-medina", "hotels", "Riad traditionnel dans la médina", "Marrakech", "Maroc", "Afrique du Nord", 4, 4, "Petit-déjeuner", 176, 230, 9.2, 986, ["Coup de cœur"]],
  ["nice-promenade", "hotels", "Face à la Promenade des Anglais", "Nice", "France", "France", 3, 4, "Petit-déjeuner", 232, 289, 8.4, 1544, ["France"]],
  ["istanbul-sultanahmet", "hotels", "Terrasse sur Sultanahmet", "Istanbul", "Turquie", "Europe", 4, 5, "Petit-déjeuner", 258, 340, 8.9, 2011, ["Ville"]],
  ["dubai-marina", "hotels", "Tour vitrée sur la Marina", "Dubaï", "Émirats arabes unis", "Moyen-Orient", 5, 5, "Petit-déjeuner", 640, 820, 9.0, 1402, ["Luxe"]],

  // Croisières
  ["mediterranee-occidentale", "croisieres", "Méditerranée occidentale au départ de Marseille", "Marseille", "France", "Méditerranée", 8, 4, "Pension complète", 749, 999, 8.6, 2233, ["Best-seller"]],
  ["fjords-norvege", "croisieres", "Fjords de Norvège et cap Nord", "Bergen", "Norvège", "Europe du Nord", 10, 5, "Pension complète", 1390, 1740, 9.1, 654, ["Nature"]],
  ["caraibes-est", "croisieres", "Îles des Caraïbes orientales", "Miami", "États-Unis", "Caraïbes", 9, 5, "Tout compris", 1580, 1980, 8.8, 921, ["Longue distance"]],
  ["iles-grecques-cyclades", "croisieres", "Cyclades et côtes turques", "Athènes", "Grèce", "Méditerranée", 8, 4, "Pension complète", 899, 1150, 8.7, 1188, ["Îles grecques"]],
  ["canaries-madere-mer", "croisieres", "Canaries et Madère en hiver", "Las Palmas", "Espagne", "Atlantique", 8, 4, "Pension complète", 690, 890, 8.3, 742, ["Soleil d'hiver"]],
  ["danube-budapest", "croisieres", "Le Danube de Passau à Budapest", "Passau", "Allemagne", "Fluvial", 7, 4, "Pension complète", 985, 1240, 8.9, 480, ["Fluvial"]],

  // Circuits
  ["japon-essentiel", "circuits", "Japon essentiel : Tokyo, Kyoto, Osaka", "Tokyo", "Japon", "Asie", 12, 4, "Demi-pension", 2490, 2980, 9.3, 512, ["Longue distance", "Guide francophone"]],
  ["islande-tour", "circuits", "Tour de l'Islande et cercle d'or", "Reykjavik", "Islande", "Europe du Nord", 9, 3, "Demi-pension", 1890, 2260, 9.0, 388, ["Nature", "Aurores"]],
  ["vietnam-nord-sud", "circuits", "Vietnam du nord au sud", "Hanoï", "Vietnam", "Asie", 14, 4, "Pension complète", 1750, 2150, 9.1, 604, ["Longue distance"]],
  ["andalousie-villes", "circuits", "Andalousie : Séville, Cordoue, Grenade", "Séville", "Espagne", "Europe", 7, 4, "Demi-pension", 890, 1090, 8.7, 830, ["Culture"]],
  ["perou-machu-picchu", "circuits", "Pérou et Machu Picchu", "Lima", "Pérou", "Amérique du Sud", 13, 4, "Demi-pension", 2790, 3290, 9.2, 297, ["Longue distance"]],
  ["maroc-villes-imperiales", "circuits", "Villes impériales du Maroc", "Casablanca", "Maroc", "Afrique du Nord", 8, 4, "Pension complète", 749, 940, 8.5, 1042, ["Culture"]],

  // Vols
  ["vol-paris-marrakech", "vols", "Paris → Marrakech, aller-retour direct", "Marrakech", "Maroc", "Afrique du Nord", 0, 0, "Vol seul", 98, 149, 8.0, 4210, ["Direct"]],
  ["vol-paris-lisbonne", "vols", "Paris → Lisbonne, aller-retour direct", "Lisbonne", "Portugal", "Europe", 0, 0, "Vol seul", 76, 119, 8.2, 5308, ["Direct"]],
  ["vol-paris-new-york", "vols", "Paris → New York, aller-retour", "New York", "États-Unis", "Amérique du Nord", 0, 0, "Vol seul", 389, 520, 8.1, 2874, ["Longue distance"]],
  ["vol-paris-athenes", "vols", "Paris → Athènes, aller-retour direct", "Athènes", "Grèce", "Europe", 0, 0, "Vol seul", 112, 168, 8.3, 3196, ["Direct"]],
  ["vol-lyon-tunis", "vols", "Lyon → Tunis, aller-retour direct", "Tunis", "Tunisie", "Afrique du Nord", 0, 0, "Vol seul", 89, 134, 7.9, 1620, ["Direct"]],
  ["vol-paris-bangkok", "vols", "Paris → Bangkok, aller-retour", "Bangkok", "Thaïlande", "Asie", 0, 0, "Vol seul", 512, 680, 8.4, 1985, ["Longue distance"]],

  // Escapades
  ["escapade-bruges", "escapades", "Week-end canaux et chocolat", "Bruges", "Belgique", "Europe", 2, 4, "Petit-déjeuner", 148, 199, 8.7, 690, ["Week-end"]],
  ["escapade-prague", "escapades", "Trois nuits sur la Vltava", "Prague", "Tchéquie", "Europe", 3, 4, "Petit-déjeuner", 198, 259, 8.8, 1122, ["Week-end"]],
  ["escapade-deauville", "escapades", "Bord de mer et thalasso", "Deauville", "France", "France", 2, 4, "Demi-pension", 265, 330, 8.5, 540, ["France", "Spa"]],
  ["escapade-seville", "escapades", "Séville en trois jours", "Séville", "Espagne", "Europe", 3, 4, "Petit-déjeuner", 219, 280, 8.9, 875, ["Week-end"]],

  // Campings
  ["camping-landes-oceane", "campings", "Camping 5★ pins et océan", "Biscarrosse", "France", "France", 7, 5, "Sans repas", 385, 520, 8.6, 1340, ["Famille", "Piscine"]],
  ["camping-ardeche-riviere", "campings", "Mobil-home au bord de l'Ardèche", "Vallon-Pont-d'Arc", "France", "France", 7, 4, "Sans repas", 349, 460, 8.4, 1105, ["Famille"]],
  ["camping-costa-brava", "campings", "Village vacances Costa Brava", "Lloret de Mar", "Espagne", "Europe", 7, 4, "Sans repas", 298, 399, 8.2, 980, ["Famille"]],
  ["camping-var-mediterranee", "campings", "Résidence club au bord du Var", "Fréjus", "France", "France", 7, 4, "Demi-pension", 442, 570, 8.5, 762, ["France", "Piscine"]],

  // Voitures
  ["voiture-malaga-compacte", "voitures", "Compacte à l'aéroport de Malaga", "Malaga", "Espagne", "Europe", 7, 0, "Sans repas", 118, 165, 8.3, 2210, ["Annulation gratuite"]],
  ["voiture-faro-citadine", "voitures", "Citadine à Faro, kilométrage illimité", "Faro", "Portugal", "Europe", 7, 0, "Sans repas", 96, 140, 8.5, 1740, ["Annulation gratuite"]],
  ["voiture-reykjavik-4x4", "voitures", "4x4 à Reykjavik, assurance incluse", "Reykjavik", "Islande", "Europe du Nord", 8, 0, "Sans repas", 640, 810, 8.7, 460, ["Nature"]],
  ["voiture-fort-de-france", "voitures", "SUV à Fort-de-France", "Fort-de-France", "Martinique", "Caraïbes", 10, 0, "Sans repas", 380, 470, 8.2, 615, ["Îles"]],
];

const AMENITIES_BY_CATEGORY: Record<string, string[]> = {
  "vol-hotel": ["Piscine", "Wi-Fi gratuit", "Climatisation", "Restaurant", "Transfert aéroport"],
  hotels: ["Wi-Fi gratuit", "Climatisation", "Petit-déjeuner buffet", "Bar", "Réception 24 h/24"],
  croisieres: ["Pont piscine", "Spectacles", "Restaurants inclus", "Salle de sport", "Excursions"],
  circuits: ["Guide francophone", "Transferts inclus", "Entrées des sites", "Autocar climatisé"],
  vols: ["Bagage cabine", "Enregistrement en ligne", "Vol direct"],
  escapades: ["Wi-Fi gratuit", "Petit-déjeuner", "Centre-ville", "Annulation flexible"],
  campings: ["Piscine chauffée", "Club enfants", "Animations", "Parking", "Aire de jeux"],
  voitures: ["Kilométrage illimité", "Annulation gratuite", "2e conducteur", "Climatisation"],
};

function describe(o: RawOffer): string {
  const [, category, title, destination, country, , nights, , board] = o;
  switch (category) {
    case "vols":
      return `${title} au départ de la France. Tarif aller-retour par personne, taxes et frais de service inclus, à réserver en quelques minutes.`;
    case "voitures":
      return `${title}. Récupération à ${destination} (${country}), ${nights} jours de location avec assurance de base et annulation gratuite jusqu'à 48 h avant le départ.`;
    case "croisieres":
      return `${title}. ${nights} jours à bord en ${board.toLowerCase()}, escales et animations comprises, cabine au choix selon disponibilité.`;
    case "circuits":
      return `${title}. Un itinéraire de ${nights} jours en petit groupe, guide francophone, transferts et visites principales inclus.`;
    default:
      return `${title} à ${destination} (${country}). ${nights} nuits en ${board.toLowerCase()}, avec assistance francophone pendant tout le séjour.`;
  }
}

function highlightsFor(o: RawOffer): string[] {
  const [, category, , destination, , region] = o;
  const base: Record<string, string[]> = {
    "vol-hotel": [
      `Vol aller-retour vers ${destination} inclus`,
      "Transfert entre l'aéroport et l'hôtel",
      "Chambre réservée avec annulation possible",
    ],
    hotels: [
      "Emplacement central, tout se fait à pied",
      "Réservation confirmée immédiatement",
      "Paiement à l'arrivée sur une sélection de chambres",
    ],
    croisieres: [
      "Pension complète à bord du premier au dernier jour",
      "Escales quotidiennes avec excursions en option",
      "Animations, spectacles et espaces piscine inclus",
    ],
    circuits: [
      "Groupe limité pour garder le rythme agréable",
      "Guide francophone pendant tout le parcours",
      "Hébergements sélectionnés à chaque étape",
    ],
    vols: [
      "Comparaison de 600 compagnies en temps réel",
      "Bagage cabine inclus sur la plupart des tarifs",
      "Modification possible selon les conditions du billet",
    ],
    escapades: [
      "Format court, du vendredi soir au dimanche",
      "Hôtel choisi pour sa proximité du centre",
      "Idéal sans poser de congés",
    ],
    campings: [
      "Mobil-home équipé pour 4 à 6 personnes",
      "Club enfants et animations en haute saison",
      "Espace aquatique accessible librement",
    ],
    voitures: [
      "Kilométrage illimité sur toute la durée",
      "Aucun frais caché au comptoir",
      "Annulation gratuite jusqu'à 48 h avant",
    ],
  };
  return [...(base[category] ?? []), `Découverte de la région : ${region}`];
}

function includedFor(category: Offer["category"], board: Board): string[] {
  if (category === "vols") return ["Vol aller-retour", "Taxes d'aéroport", "Bagage cabine"];
  if (category === "voitures")
    return ["Location du véhicule", "Assurance responsabilité civile", "Kilométrage illimité"];
  const common = [`Hébergement en ${board.toLowerCase()}`, "Taxes et frais de dossier", "Assistance 24 h/24"];
  if (category === "vol-hotel" || category === "circuits" || category === "croisieres") {
    return ["Vol aller-retour", "Transferts", ...common];
  }
  return common;
}

export const OFFERS: Offer[] = RAW.map((o) => {
  const [slug, category, title, destination, country, region, nights, stars, board, price, oldPrice, rating, reviews, tags] = o;
  return {
    slug,
    category,
    title,
    destination,
    country,
    region,
    imageSeed: slug,
    nights,
    stars,
    board,
    departureCity: "Paris",
    price,
    oldPrice,
    rating,
    reviews,
    dates: "Départs de mars à octobre",
    tags,
    amenities: AMENITIES_BY_CATEGORY[category] ?? [],
    description: describe(o),
    highlights: highlightsFor(o),
    included: includedFor(category, board),
  };
});

export function offersByCategory(category: string): Offer[] {
  return OFFERS.filter((o) => o.category === category);
}

export function getOffer(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.slug === slug);
}

export function relatedOffers(offer: Offer, count = 4): Offer[] {
  const sameCategory = OFFERS.filter((o) => o.category === offer.category && o.slug !== offer.slug);
  const rest = OFFERS.filter((o) => o.category !== offer.category && o.slug !== offer.slug);
  return [...sameCategory, ...rest].slice(0, count);
}

export const DESTINATIONS: Destination[] = [
  { slug: "espagne", name: "Espagne", country: "Europe", imageSeed: "dest-espagne", fromPrice: 168, offersCount: 1842 },
  { slug: "maroc", name: "Maroc", country: "Afrique du Nord", imageSeed: "dest-maroc", fromPrice: 176, offersCount: 964 },
  { slug: "grece", name: "Grèce", country: "Méditerranée", imageSeed: "dest-grece", fromPrice: 219, offersCount: 1130 },
  { slug: "italie", name: "Italie", country: "Europe", imageSeed: "dest-italie", fromPrice: 149, offersCount: 1508 },
  { slug: "japon", name: "Japon", country: "Asie", imageSeed: "dest-japon", fromPrice: 1490, offersCount: 212 },
  { slug: "egypte", name: "Égypte", country: "Mer Rouge", imageSeed: "dest-egypte", fromPrice: 419, offersCount: 486 },
  { slug: "portugal", name: "Portugal", country: "Europe", imageSeed: "dest-portugal", fromPrice: 132, offersCount: 890 },
  { slug: "caraibes", name: "Caraïbes", country: "Amérique", imageSeed: "dest-caraibes", fromPrice: 899, offersCount: 340 },
];

export const REVIEWS: Review[] = [
  {
    author: "Camille D.",
    city: "Lyon",
    score: 9.4,
    date: "12 juillet 2026",
    trip: "Crète, 7 nuits en tout compris",
    text: "Réservation faite en dix minutes un dimanche soir. Le transfert nous attendait à l'aéroport et l'hôtel correspondait exactement aux photos. Rien à redire.",
  },
  {
    author: "Sofiane B.",
    city: "Toulouse",
    score: 8.8,
    date: "3 juin 2026",
    trip: "Circuit Andalousie",
    text: "Le guide connaissait vraiment sa région et le rythme laissait du temps libre. Seul bémol : deux hôtels un peu excentrés, mais les navettes suivaient.",
  },
  {
    author: "Marie-Laure P.",
    city: "Rennes",
    score: 9.1,
    date: "28 mai 2026",
    trip: "Croisière Méditerranée",
    text: "Premier voyage en croisière et clairement pas le dernier. Le service client a répondu en moins d'une heure quand j'ai voulu changer de cabine.",
  },
  {
    author: "Thomas & Élodie",
    city: "Nantes",
    score: 9.6,
    date: "19 avril 2026",
    trip: "Escapade à Lisbonne",
    text: "Excellent rapport qualité-prix pour un long week-end. L'hôtel était à cinq minutes à pied du tram et le petit-déjeuner très correct.",
  },
  {
    author: "Nadia K.",
    city: "Marseille",
    score: 8.6,
    date: "8 mars 2026",
    trip: "Camping dans les Landes",
    text: "Parfait avec deux enfants en bas âge. Le club enfants a sauvé nos matinées et la piscine était impeccable.",
  },
  {
    author: "Julien R.",
    city: "Lille",
    score: 9.0,
    date: "22 février 2026",
    trip: "Vol Paris – New York",
    text: "Meilleur tarif trouvé après avoir comparé trois sites. Le billet était émis dans la foulée, aucun frais surprise.",
  },
];

export const POSTS: Post[] = [
  {
    slug: "quand-partir-japon",
    title: "Quand partir au Japon selon ce que vous voulez voir",
    excerpt: "Cerisiers, érables rouges ou festivals d'été : chaque saison change complètement le voyage. Voici comment choisir.",
    category: "Destinations",
    readingTime: 7,
    imageSeed: "post-japon",
  },
  {
    slug: "bagage-cabine-regles",
    title: "Bagage cabine : les règles à connaître avant d'arriver au contrôle",
    excerpt: "Dimensions, liquides, batteries : le récapitulatif des consignes appliquées par les compagnies européennes.",
    category: "Conseils",
    readingTime: 5,
    imageSeed: "post-bagage",
  },
  {
    slug: "croisiere-premiere-fois",
    title: "Première croisière : dix questions que tout le monde se pose",
    excerpt: "Mal de mer, pourboires, tenue du soir, excursions à réserver ou non — on répond sans détour.",
    category: "Croisières",
    readingTime: 9,
    imageSeed: "post-croisiere",
  },
  {
    slug: "andalousie-itineraire",
    title: "Andalousie en une semaine : l'itinéraire qui fonctionne",
    excerpt: "Séville, Cordoue, Grenade et un détour par Cadix, sans passer ses journées sur la route.",
    category: "Itinéraires",
    readingTime: 8,
    imageSeed: "post-andalousie",
  },
];

export const TRUST_POINTS = [
  { value: "4,3 M", label: "de voyageurs accompagnés" },
  { value: "9,2/10", label: "note moyenne sur 3 450 avis" },
  { value: "4×", label: "paiement en plusieurs fois" },
  { value: "24 h/24", label: "assistance pendant le voyage" },
];

export const BENEFITS = [
  {
    title: "Tout le voyage au même endroit",
    text: "Vols, hôtels, croisières, circuits, campings et location de voiture : une seule recherche, un seul panier.",
    icon: "compass",
  },
  {
    title: "Des prix négociés à l'année",
    text: "Nos volumes nous permettent de bloquer des tarifs que vous ne trouverez pas en réservant chacun de votre côté.",
    icon: "tag",
  },
  {
    title: "Réservation en trois étapes",
    text: "Vous choisissez, vous payez, vous recevez vos documents. Pas de formulaire à rallonge.",
    icon: "bolt",
  },
  {
    title: "Des conseillers spécialisés",
    text: "Une question sur un itinéraire ou une cabine ? Nos agents connaissent les produits qu'ils vendent.",
    icon: "headset",
  },
  {
    title: "Assistance pendant le séjour",
    text: "Un vol annulé, un transfert manqué : quelqu'un décroche, y compris le week-end et les jours fériés.",
    icon: "shield",
  },
];

export const FOOTER_LINKS = [
  {
    title: "Mentions légales",
    links: ["Conditions générales", "Politique de confidentialité", "Gestion des cookies", "Accessibilité", "Médiation"],
  },
  {
    title: "À propos",
    links: ["Qui sommes-nous", "Guides de voyage", "Aide et FAQ", "Nous contacter", "Recrutement", "Affiliation"],
  },
  {
    title: "Nos sites",
    links: ["Espagne", "Italie", "Portugal", "Allemagne", "Royaume-Uni", "Brésil", "Mexique"],
  },
  {
    title: "Réserver",
    links: ["Vol + Hôtel", "Hôtels", "Croisières", "Circuits", "Vols", "Campings", "Location de voiture"],
  },
];

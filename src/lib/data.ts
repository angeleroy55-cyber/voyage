import type { Category, Post, Review } from "./types";

export const BRAND = {
  name: "GoSéjour",
  domain: "gosejour.fr",
  tagline: "Voyages • Séjours • Expériences",
  phone: "+33 7 59 82 38 73",
  /** Même ligne que le téléphone : un seul numéro à surveiller. */
  whatsapp: "+33 7 59 82 38 73",
  email: "contact@gosejour.fr",
};

/**
 * Lien de conversation WhatsApp à partir d'un numéro écrit lisiblement.
 *
 * `wa.me` n'accepte que des chiffres, sans « + » ni séparateur : le numéro est
 * donc affiché tel qu'il est saisi au back-office, et nettoyé seulement pour
 * l'URL. Un numéro vide ne produit aucun lien, le bouton n'est pas rendu.
 */
export function whatsappLink(number: string, message?: string): string | null {
  const digits = number.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/**
 * Navigation du site, dans l'ordre du cahier de catégorisation.
 *
 * Les dix premières entrées forment le menu principal, du plus fort taux de
 * conversion vers le plus large. Les suivantes portent `isOverflow` et se
 * regroupent sous « Voir plus de voyages » : elles restent publiques et
 * indexées, mais un menu au-delà de dix entrées fait chuter la conversion.
 *
 * Trois de ces dix entrées ne possèdent aucune offre en propre. Bons Plans et
 * Dernière Minute traversent le catalogue par une règle, Destinations renvoie
 * au hub : une offre n'a donc jamais deux adresses, seulement plusieurs portes
 * d'entrée vers la même.
 */
export const CATEGORIES: Category[] = [
  {
    id: "bons-plans-promos",
    label: "Bons plans",
    title: "Bons Plans & Promos",
    icon: "tag",
    kind: "dynamique",
    rule: "promos",
    accent: "gold",
    // Seul univers où la remise est l'argument principal : c'est donc l'un des
    // rares à afficher le taux en pourcentage, en plus du montant en euros.
    showDiscountPercent: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Toutes nos offres à prix réduit, tous types de voyage confondus.",
  },
  {
    id: "derniere-minute",
    label: "Dernière minute",
    title: "Dernière Minute",
    icon: "sparkles",
    kind: "dynamique",
    rule: "derniere-minute",
    accent: "rose",
    showDiscountPercent: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Départs imminents, stock limité : les meilleures affaires du moment.",
  },
  {
    id: "destinations",
    label: "Destinations",
    title: "Toutes les destinations",
    icon: "compass",
    kind: "hub",
    accent: "navy",
    form: ["destination", "dates", "travellers"],
    blurb: "Continent, pays, ville : trouvez votre voyage par la carte.",
  },
  {
    id: "sejours",
    label: "Séjours",
    title: "Séjours & Vol + Hôtel",
    icon: "package",
    kind: "catalogue",
    accent: "navy",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Le vol et l'hôtel réservés en une seule fois, du week-end au tout compris.",
  },
  {
    id: "circuits",
    label: "Circuits",
    title: "Circuits",
    icon: "route",
    kind: "catalogue",
    accent: "emerald",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Des itinéraires guidés pour voir l'essentiel sans rien organiser.",
  },
  {
    id: "croisieres",
    label: "Croisières",
    title: "Croisières",
    icon: "ship",
    kind: "catalogue",
    accent: "teal",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Méditerranée, Caraïbes, fjords ou fleuves : embarquez au meilleur prix.",
  },
  {
    id: "hotels",
    label: "Hôtels",
    title: "Hôtels",
    icon: "bed",
    kind: "catalogue",
    accent: "violet",
    form: ["destination", "dates", "travellers"],
    blurb: "Des chambres négociées dans plus de 400 000 établissements.",
  },
  {
    id: "vols",
    label: "Vols",
    title: "Vols",
    icon: "plane",
    kind: "catalogue",
    accent: "navy",
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Comparez 600 compagnies aériennes en une recherche.",
  },
  {
    id: "camping-escapades",
    label: "Camping & Escapades",
    title: "Camping & Escapades",
    icon: "tent",
    kind: "catalogue",
    accent: "emerald",
    form: ["destination", "dates", "travellers"],
    blurb: "Mobil-homes, clubs nature et courts séjours, sans poser de congés.",
  },
  {
    id: "location-voiture",
    label: "Location de voiture",
    title: "Location de Voiture",
    icon: "car",
    kind: "catalogue",
    accent: "gold",
    form: ["destination", "dates", "driver"],
    blurb: "Location sans frais cachés, annulation gratuite jusqu'à 48 h.",
  },

  // ---- « Voir plus de voyages » ----

  {
    id: "tout-compris-clubs",
    label: "Tout compris & clubs",
    title: "Tout Compris & Clubs",
    icon: "gift",
    kind: "dynamique",
    rule: "tout-compris",
    accent: "teal",
    isOverflow: true,
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Repas, boissons et animations compris : le budget est connu au départ.",
  },
  {
    id: "sejours-france",
    label: "Séjours France",
    title: "Séjours en France",
    icon: "pin",
    kind: "dynamique",
    rule: "france",
    accent: "navy",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "De la côte atlantique aux Alpes, sans quitter le pays.",
  },
  {
    id: "parcs-loisirs",
    label: "Parcs de loisirs",
    title: "Parcs de loisirs",
    icon: "sparkles",
    kind: "catalogue",
    accent: "violet",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Billets et nuits d'hôtel réservés ensemble, pour les grands parcs.",
  },
  {
    id: "sur-mesure",
    label: "Voyages sur-mesure",
    title: "Voyages sur-mesure",
    icon: "compass",
    kind: "editorial",
    accent: "navy",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Un conseiller construit votre itinéraire à partir de vos envies.",
  },
  {
    id: "groupes-entreprises",
    label: "Groupes & entreprises",
    title: "Voyages de groupe & entreprise",
    icon: "pin",
    kind: "editorial",
    accent: "navy",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Séminaires, incentives et départs à plus de dix : devis sous 48 h.",
  },
  {
    id: "voyages-responsables",
    label: "Voyages responsables",
    title: "Voyages responsables",
    icon: "compass",
    kind: "editorial",
    accent: "emerald",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Hébergements engagés, trajets courts, prestataires locaux.",
  },
  {
    id: "assurance-voyage",
    label: "Assurance voyage",
    title: "Assurance voyage",
    icon: "gift",
    kind: "editorial",
    accent: "navy",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Annulation, bagages, frais médicaux : les garanties et leur prix.",
  },
];

/**
 * Découpage du monde du hub Destinations : continent, puis pays.
 *
 * Il sert à deux choses : l'arborescence `/destinations`, et le rattachement
 * automatique d'une offre à son continent, déduit du pays saisi au back-office.
 * L'ordre est celui du cahier, l'Europe d'abord, la cible étant à plus de la
 * moitié française.
 */
export const CONTINENTS: { id: string; label: string; countries: string[] }[] = [
  {
    id: "europe",
    label: "Europe",
    countries: [
      "France", "Espagne", "Italie", "Grèce", "Portugal", "Croatie", "Allemagne",
      "Belgique", "Pays-Bas", "Tchéquie", "Norvège", "Islande", "Turquie",
      "Royaume-Uni", "Irlande", "Autriche", "Suisse", "Malte", "Chypre",
      "Pologne", "Hongrie", "Danemark", "Suède", "Finlande", "Albanie",
    ],
  },
  {
    id: "afrique-du-nord",
    label: "Afrique du Nord",
    countries: ["Maroc", "Tunisie", "Égypte"],
  },
  {
    id: "afrique-ocean-indien",
    label: "Afrique subsaharienne & Océan Indien",
    countries: [
      "Île Maurice", "Seychelles", "Zanzibar", "Cap-Vert", "Madagascar",
      "Tanzanie", "Kenya", "Afrique du Sud", "Sénégal", "La Réunion", "Maldives",
      "Namibie", "Botswana",
    ],
  },
  {
    id: "amerique-du-nord-caraibes",
    label: "Amérique du Nord & Caraïbes",
    countries: [
      "États-Unis", "Canada", "République dominicaine", "Mexique", "Guadeloupe",
      "Martinique", "Cuba", "Jamaïque", "Bahamas", "Sainte-Lucie",
    ],
  },
  {
    id: "amerique-du-sud",
    label: "Amérique du Sud",
    countries: ["Brésil", "Pérou", "Costa Rica", "Argentine", "Chili", "Colombie"],
  },
  {
    id: "asie",
    label: "Asie",
    countries: [
      "Thaïlande", "Japon", "Vietnam", "Indonésie", "Chine", "Inde", "Sri Lanka",
      "Malaisie", "Cambodge", "Philippines", "Corée du Sud", "Ouzbékistan",
    ],
  },
  {
    id: "moyen-orient",
    label: "Moyen-Orient",
    countries: ["Émirats arabes unis", "Jordanie", "Oman", "Qatar", "Israël"],
  },
  {
    id: "oceanie",
    label: "Océanie",
    countries: [
      "Australie", "Polynésie française", "Nouvelle-Zélande",
      "Nouvelle-Calédonie", "Fidji",
    ],
  },
];

/**
 * Continent d'un pays. Rend une chaîne vide pour un pays inconnu plutôt que de
 * le ranger d'office quelque part : une offre sans continent se voit dans le
 * back-office, une offre mal classée passe inaperçue.
 */
export function continentOf(country: string): string {
  const needle = country.trim().toLowerCase();
  return CONTINENTS.find((c) => c.countries.some((x) => x.toLowerCase() === needle))?.label ?? "";
}

/** Villes travaillées en priorité pour le référencement (cahier, section 6). */
export const SEO_CITIES = [
  "Paris", "Marrakech", "Barcelone", "Rome", "Bangkok", "Londres", "Nice",
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
    trip: "Vol Paris-New York",
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
    excerpt: "Mal de mer, pourboires, tenue du soir, excursions à réserver ou non : on répond sans détour.",
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

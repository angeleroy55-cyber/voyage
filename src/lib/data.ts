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
  let digits = number.replace(/[^0-9]/g, "");
  // Un numéro français saisi au format local (« 07 59 82 38 73 », sans le
  // « +33 ») passe le test de longueur mais produit un lien wa.me erroné :
  // on le convertit ici en indicatif international avant de construire le lien.
  if (/^0[1-9]\d{8}$/.test(digits)) {
    digits = `33${digits.slice(1)}`;
  }
  if (digits.length < 10) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/**
 * Navigation du site, dans l'ordre du cahier de catégorisation.
 *
 * Les entrées sans `isOverflow` forment le menu principal (quatre aujourd'hui),
 * du plus fort taux de conversion vers le plus large. Les autres portent
 * `isOverflow` et se regroupent sous « Voir plus de voyages » : elles restent
 * publiques et indexées, mais un menu trop long fait chuter la conversion.
 * Vols et Location de voiture y sont volontairement passées : elles gardent
 * leur onglet dans le moteur de recherche, seule leur entrée de menu recule.
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
    // Passée en « Voir plus » avec Destinations : quatre entrées fixes
    // (les formats de réservation) tiennent large sur une ligne, six
    // recommençaient à serrer sur les écrans intermédiaires.
    isOverflow: true,
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
    // Passée en « Voir plus » avec Camping & Escapades : six entrées fixes
    // tiennent sur une ligne, huit forçaient un retour à la ligne sur les
    // écrans intermédiaires (demande client).
    isOverflow: true,
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
    isOverflow: true,
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
  // ---- « Voir plus de voyages » ----
  // Vols et Location de voiture restent des recherches à part entière (elles
  // gardent leur onglet dans le moteur de recherche), mais sortent du menu
  // principal : demande client, pour ne garder en avant que les formats les
  // plus réservés.

  {
    id: "camping-escapades",
    label: "Camping & Escapades",
    title: "Camping & Escapades",
    icon: "tent",
    kind: "catalogue",
    accent: "emerald",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Mobil-homes, clubs nature et courts séjours, sans poser de congés.",
  },
  {
    id: "vols",
    label: "Vols",
    title: "Vols",
    icon: "plane",
    kind: "catalogue",
    accent: "navy",
    isOverflow: true,
    form: ["origin", "destination", "dates", "travellers"],
    blurb: "Comparez 600 compagnies aériennes en une recherche.",
  },
  {
    id: "location-voiture",
    label: "Location de voiture",
    title: "Location de Voiture",
    icon: "car",
    kind: "catalogue",
    accent: "gold",
    isOverflow: true,
    form: ["destination", "dates", "driver"],
    blurb: "Location sans frais cachés, annulation gratuite jusqu'à 48 h.",
  },

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
      "Andorre", "Slovénie", "Slovaquie",
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
      "Singapour", "Népal",
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
    body: `Le Japon change de visage à chaque saison, et le choix de la période pèse autant que l'itinéraire lui-même. Il n'y a pas de "meilleur moment" dans l'absolu : il y a le moment qui correspond à ce que vous êtes venu voir.

Fin mars à début avril, c'est la saison des cerisiers (sakura). Tokyo et Kyoto sont alors les villes les plus demandées de l'année : les hébergements se réservent tôt, et les parcs les plus connus sont pris d'assaut dès le week-end de floraison. La floraison remonte du sud vers le nord sur environ un mois, ce qui laisse une certaine souplesse si les dates exactes ne sont pas figées.

L'automne, entre mi-novembre et début décembre, offre l'équivalent en érables (momiji) : les temples de Kyoto entourés de rouge et d'orange, avec une affluence un peu moins tendue qu'au printemps et des températures plus confortables pour marcher toute la journée.

L'été (juillet-août) est chaud et humide, avec une saison des pluies qui se termine généralement mi-juillet selon les régions. C'est en revanche la période des grands festivals traditionnels (matsuri) et des feux d'artifice, un angle différent du voyage.

L'hiver, de décembre à février, convient à un circuit orienté nature et sports d'hiver dans le nord (Hokkaido), avec un air sec et des ciels souvent dégagés dans le centre du pays.

Pour un premier circuit combinant Tokyo, Kyoto et Osaka, le printemps ou l'automne restent les choix les plus équilibrés entre météo, lumière et affluence.`,
  },
  {
    slug: "bagage-cabine-regles",
    title: "Bagage cabine : les règles à connaître avant d'arriver au contrôle",
    excerpt: "Dimensions, liquides, batteries : le récapitulatif des consignes appliquées par les compagnies européennes.",
    category: "Conseils",
    readingTime: 5,
    imageSeed: "post-bagage",
    body: `Les règles de bagage cabine varient d'une compagnie à l'autre, y compris sur un même vol combiné vol + hôtel : la dimension et le poids autorisés dépendent du billet, pas de la destination. Le point à vérifier en priorité est toujours la fiche de la compagnie indiquée sur votre confirmation de réservation, avant de faire les valises.

Les liquides restent encadrés par une règle commune à la majorité des aéroports européens : des contenants de 100 ml maximum, regroupés dans un sac transparent refermable d'un litre. Au-delà, direction la soute.

Les batteries au lithium (appareils photo, batteries externes, cigarettes électroniques) doivent voyager en cabine, jamais en soute : c'est une consigne de sécurité, pas une option laissée à l'appréciation du passager. Les batteries externes de grande capacité (au-delà de 100 Wh environ) demandent en général l'accord préalable de la compagnie.

Pour un vol sec ou un aller-retour sur compagnie à bas coût, le bagage cabine "gratuit" se limite souvent à un unique sac sous le siège devant vous ; la valise cabine à roulettes classique est alors payante en supplément. Vérifier ce point avant le départ évite une mauvaise surprise au comptoir d'enregistrement.

En cas de doute sur une compagnie précise, le service client reste joignable par WhatsApp ou téléphone avant le départ pour confirmer les règles applicables à votre billet.`,
  },
  {
    slug: "croisiere-premiere-fois",
    title: "Première croisière : dix questions que tout le monde se pose",
    excerpt: "Mal de mer, pourboires, tenue du soir, excursions à réserver ou non : on répond sans détour.",
    category: "Croisières",
    readingTime: 9,
    imageSeed: "post-croisiere",
    body: `Le mal de mer est la première crainte, et la plus souvent surestimée. Sur les grands navires de croisière modernes, les stabilisateurs limitent fortement le roulis en Méditerranée ou aux Canaries ; une cabine au centre du bateau et à un niveau intermédiaire reste le choix le plus stable pour qui craint particulièrement le mouvement.

Les pourboires à l'équipage sont, sur la plupart des compagnies, soit inclus dans le prix affiché soit prélevés automatiquement en fin de séjour sous forme de forfait par jour et par passager : le détail figure toujours sur la fiche de l'offre et sur la facture finale, sans surprise à bord.

Côté tenue, une croisière en Méditerranée ou aux Caraïbes ne demande pas de garde-robe particulière au quotidien (tenue décontractée au restaurant principal le jour), mais prévoit en général une ou deux soirées plus habillées pendant le séjour : rien d'obligatoire, mais agréable à anticiper.

Les excursions à chaque escale ne sont pas incluses dans le prix de la croisière elle-même, sauf mention contraire sur la fiche de l'offre : elles se réservent en complément, à bord ou en amont. Il est tout à fait possible de descendre à quai et de visiter par ses propres moyens, sans passer par une excursion organisée.

La cabine extérieure (avec hublot ou balcon) coûte plus cher qu'une cabine intérieure, mais pour un premier embarquement, voir la mer depuis sa chambre change beaucoup l'expérience du voyage, en particulier sur une croisière de plusieurs jours en mer sans escale quotidienne.

Le mieux, pour une première fois, reste une formule courte (7 à 8 jours) en pension complète, sur un itinéraire à escales rapprochées comme la Méditerranée occidentale ou les îles grecques.`,
  },
  {
    slug: "andalousie-itineraire",
    title: "Andalousie en une semaine : l'itinéraire qui fonctionne",
    excerpt: "Séville, Cordoue, Grenade et un détour par Cadix, sans passer ses journées sur la route.",
    category: "Itinéraires",
    readingTime: 8,
    imageSeed: "post-andalousie",
    body: `Sur sept jours, l'erreur la plus fréquente est de vouloir tout voir et de perdre le voyage sur la route. L'Andalousie se prête bien à un itinéraire en boucle resserré autour de trois villes : Séville, Cordoue et Grenade sont reliées entre elles en moins de deux heures de route ou de train.

Deux nuits à Séville pour commencer : la cathédrale et la Giralda, le quartier de Santa Cruz, et l'Alcazar, qui se réserve à l'avance en haute saison tant l'affluence y est importante. Séville se visite très bien à pied, en particulier tôt le matin avant la chaleur de l'après-midi si le voyage a lieu en été.

Une nuit à Cordoue suffit pour l'essentiel : la Mezquita-Catedral, unique en Europe par son architecture, et le quartier historique de la Judería tout autour. C'est l'étape la plus courte de l'itinéraire, à ne pas négliger pour autant.

Deux à trois nuits à Grenade pour finir, avec l'Alhambra en point d'orgue : les billets se réservent plusieurs semaines à l'avance, la jauge journalière étant limitée. Le quartier de l'Albaicín, en face de l'Alhambra, offre la meilleure vue au coucher du soleil.

Pour qui dispose d'un jour supplémentaire, un détour par Cadix ou par les villages blancs de la Sierra de Grazalema apporte un contraste maritime ou rural bienvenu par rapport aux trois grandes villes.

Le printemps (avril-mai) et le début de l'automne restent les périodes les plus confortables pour marcher toute la journée : l'été andalou dépasse fréquemment les 35 °C à l'intérieur des terres.`,
  },
  {
    slug: "accompagnement-avant-pendant-apres-voyage",
    title: "Avant, pendant, après : comment se passe le suivi de votre voyage",
    excerpt: "Réserver en ligne ne veut pas dire partir seul : ce qui se passe une fois la réservation confirmée.",
    category: "Conseils",
    readingTime: 4,
    imageSeed: "post-accompagnement",
    body: `Réserver un voyage en ligne ne signifie pas être livré à soi-même une fois le paiement passé. Trois moments structurent le suivi d'une réservation, du premier clic jusqu'au retour.

Avant le départ, la confirmation de réservation arrive par e-mail avec l'ensemble des documents utiles (référence, détail du séjour, conditions), et reste consultable à tout moment depuis l'espace client, dans la rubrique "Mes réservations". Toute question sur un bagage, une formalité ou un horaire peut être posée directement par WhatsApp, sans passer par un formulaire ou une file d'attente téléphonique.

Pendant le séjour, la référence de réservation (au format GO-XXXXX) sert de repère unique pour toute démarche : elle est demandée par l'hébergeur, la compagnie aérienne ou le service client en cas de besoin, et évite d'avoir à ressaisir l'ensemble du dossier.

Après le retour, l'espace client conserve l'historique complet des voyages réservés, utile pour retrouver une facture ou laisser un avis sur l'expérience vécue. C'est aussi le canal par lequel une question tardive (facture, justificatif) trouve une réponse la plus rapide.

Ce fonctionnement ne remplace pas un accompagnement sur place assuré par un professionnel local (c'est le cas des circuits accompagnés, avec guide francophone du premier au dernier jour), mais garantit qu'aucune réservation n'est laissée sans interlocuteur joignable.`,
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

/**
 * Colonnes du pied de page.
 *
 * Deux colonnes seulement, contre quatre avant : « Mentions légales » et
 * « À propos » fusionnent sous « L'agence », qui pèse moins à l'œil et se lit
 * en un balayage. La colonne « Nos sites » (Espagne, Italie, Portugal…) a été
 * retirée : elle laissait croire à des sites GoSéjour dédiés par pays, ce qui
 * n'existe pas — remplacée par les pays les plus demandés, calculés depuis le
 * vrai catalogue (voir `getTopCountries`).
 */
export const FOOTER_LINKS = [
  {
    title: "L'agence",
    links: [
      "Qui sommes-nous",
      "Guides de voyage",
      "Aide et FAQ",
      "Nous contacter",
      "Conditions générales",
      "Politique de confidentialité",
      "Gestion des cookies",
    ],
  },
  {
    title: "Réserver",
    links: ["Vol + Hôtel", "Hôtels", "Croisières", "Circuits", "Vols", "Campings", "Location de voiture"],
  },
];

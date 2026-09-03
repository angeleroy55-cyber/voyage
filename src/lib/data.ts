import type { Category, Post, Review } from "./types";

export const BRAND = {
  name: "GoSéjour",
  domain: "gosejour.fr",
  tagline: "Voyages • Séjours • Expériences moins chères",
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
 * Les cinq premières entrées forment le menu principal, du plus fort taux de
 * conversion vers le plus large. Les suivantes portent `isOverflow` et se
 * regroupent sous « Voir plus de voyages » : elles restent publiques, liées
 * depuis le pied de page et indexées, mais ne prennent pas de place en tête.
 *
 * Le cahier autorisait dix entrées. Cinq se lisent d'un coup d'œil, sans que
 * le regard ait à balayer la barre : les quatre univers qui possèdent leurs
 * propres offres (Séjours, Circuits, Croisières, Vols), plus Bons Plans qui
 * les traverse tous par le prix. La promesse commerciale tient en cinq mots,
 * et la barre garde de l'air à côté du logo.
 *
 * Ce qui descend n'est pas ce qui compte le moins, mais ce qui se trouve déjà
 * ailleurs : Dernière Minute est un angle de prix que Bons Plans couvre, et
 * Destinations est un hub que la page d'accueil affiche en pleine largeur. Les
 * garder en tête revenait à payer deux fois la même porte d'entrée.
 *
 * Une seule de ces cinq entrées ne possède aucune offre en propre : Bons Plans
 * traverse le catalogue par une règle. Une offre n'a donc jamais deux
 * adresses, seulement plusieurs portes vers la même.
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

  // ---- « Voir plus de voyages » ----

  {
    id: "derniere-minute",
    label: "Dernière minute",
    title: "Dernière Minute",
    icon: "sparkles",
    kind: "dynamique",
    rule: "derniere-minute",
    accent: "rose",
    showDiscountPercent: true,
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
    id: "hotels",
    label: "Hôtels",
    title: "Hôtels",
    icon: "bed",
    kind: "catalogue",
    accent: "violet",
    isOverflow: true,
    form: ["destination", "dates", "travellers"],
    blurb: "Des chambres négociées dans plus de 400 000 établissements.",
  },
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
    body: `Le Japon n'a pas une haute saison, il en a quatre, et elles ne se ressemblent pas. Choisir sa date de départ revient donc à choisir quel pays on veut voir, plus qu'à choisir une météo.

Fin mars à début avril, ce sont les cerisiers : la floraison remonte l'archipel du sud vers le nord en trois semaines environ, et les prévisions officielles ne sont fiables qu'à dix jours. Les parcs de Kyoto et les allées de Tokyo se réservent des mois à l'avance sur cette période, hôtels compris.

Novembre offre l'inverse en couleurs : les érables rouges des jardins de Kyoto et des temples de montagne, avec une affluence un peu moins tendue que le printemps. C'est la période que nos conseillers recommandent le plus souvent à ceux qui viennent pour la première fois.

L'été, chaud et humide surtout à Tokyo et Osaka, reste la saison des grands festivals (matsuri) et des feux d'artifice, mais aussi celle des typhons en fin de période : utile à savoir avant de caler un circuit qui inclut des trajets en train à grande vitesse.

L'hiver enfin met en avant Hokkaido et ses stations de ski, avec une neige réputée parmi les plus légères au monde, pendant qu'un Kyoto sous la neige, plus rare, reste un des plus beaux souvenirs qu'on nous rapporte.`,
  },
  {
    slug: "bagage-cabine-regles",
    title: "Bagage cabine : les règles à connaître avant d'arriver au contrôle",
    excerpt: "Dimensions, liquides, batteries : le récapitulatif des consignes appliquées par les compagnies européennes.",
    category: "Conseils",
    readingTime: 5,
    imageSeed: "post-bagage",
    body: `La règle la plus simple à retenir : chaque compagnie fixe ses propres dimensions maximales, et elles ne sont pas toutes identiques. La plupart des compagnies européennes tournent autour de 55 × 40 × 20 cm, mais quelques low-cost sont plus strictes de deux ou trois centimètres, suffisant pour se faire refuser en embarquement si la valise est pleine.

Pour les liquides, la limite reste la même partout dans l'Union européenne : des contenants de 100 ml maximum, regroupés dans un sac transparent refermable d'un litre. Ce qui dépasse part en soute, ou reste à la maison.

Les batteries externes et les cigarettes électroniques ne se transportent qu'en cabine, jamais en soute : c'est une règle de sécurité, pas une option de la compagnie. Une batterie de plus de 100 Wh demande en général un accord préalable, à vérifier avant le départ si vous voyagez avec du matériel photo ou informatique volumineux.

Enfin, un bagage cabine seul ne comprend presque jamais de bagage en soute inclus sur les tarifs les plus bas : c'est souvent la première option payante proposée à la réservation. Nos conseillers vérifient systématiquement ce point avec vous au moment de choisir le tarif, pour éviter la surprise au comptoir d'enregistrement.`,
  },
  {
    slug: "croisiere-premiere-fois",
    title: "Première croisière : dix questions que tout le monde se pose",
    excerpt: "Mal de mer, pourboires, tenue du soir, excursions à réserver ou non : on répond sans détour.",
    category: "Croisières",
    readingTime: 9,
    imageSeed: "post-croisiere",
    body: `Le mal de mer, d'abord, parce que c'est la question qu'on nous pose le plus souvent. Sur un paquebot moderne, le tangage reste limité sauf gros temps, et les cabines du milieu du navire, sur les ponts intermédiaires, sont les moins sensibles au roulis. Un traitement pris la veille au soir suffit à la plupart des voyageurs sensibles.

Les pourboires ne sont presque jamais réellement optionnels : la majorité des compagnies appliquent un forfait quotidien par personne, prélevé automatiquement ou réglé en fin de séjour, qui rémunère le personnel de cabine et de restaurant. Il figure généralement dans le prix affiché sur nos fiches, mais nous le confirmons systématiquement avant réservation.

Sur la tenue du soir, une soirée de gala est prévue sur la plupart des croisières de plus de sept nuits : costume ou robe habillée suffisent largement, personne n'exige de smoking. Les autres soirs restent en tenue décontractée, y compris dans les restaurants principaux.

Sur les excursions, rien n'oblige à réserver celles du bord : descendre à quai en autonomie fonctionne très bien sur la plupart des escales, à condition de bien noter l'heure de réembarquement, qui ne varie jamais pour personne. Nos conseillers recommandent de réserver via la compagnie uniquement sur les escales où le bateau reste peu de temps, pour garantir le retour à bord en cas de retard.`,
  },
  {
    slug: "andalousie-itineraire",
    title: "Andalousie en une semaine : l'itinéraire qui fonctionne",
    excerpt: "Séville, Cordoue, Grenade et un détour par Cadix, sans passer ses journées sur la route.",
    category: "Itinéraires",
    readingTime: 8,
    imageSeed: "post-andalousie",
    body: `Sept jours suffisent pour voir l'essentiel de l'Andalousie, à condition de ne pas vouloir tout faire. L'itinéraire qui revient le plus souvent chez nos voyageurs tient en quatre étapes : Séville, Cordoue, Grenade, et un détour côtier vers Cadix ou Ronda selon l'envie du moment.

Séville se garde deux nuits pleines : la cathédrale et la Giralda le matin, le quartier de Triana et ses azulejos l'après-midi, et une soirée de flamenco dans un petit tablao plutôt que dans une salle de spectacle touristique. C'est aussi la ville où louer la voiture, plutôt qu'à l'aéroport dès l'arrivée, pour profiter du centre à pied les deux premiers jours.

Cordoue se visite en une journée : la Mezquita, avec ses arches en enfilade, reste le site à ne pas manquer, idéalement tôt le matin avant l'arrivée des groupes. Le quartier juif environnant se parcourt en une heure ou deux, ce qui laisse le temps de reprendre la route vers Grenade avant la tombée du jour.

Grenade mérite deux nuits également, exclusivement pour l'Alhambra : les billets se réservent plusieurs semaines à l'avance en haute saison, avec un créneau horaire précis pour les palais Nasrides. Le reste du temps se passe dans l'Albaicín, pour la vue sur l'Alhambra depuis le Mirador de San Nicolás, particulièrement au coucher du soleil.

Le dernier jour se joue entre Ronda, perchée sur ses gorges, et Cadix, plus littorale : les deux se rejoignent facilement depuis Séville en fin de circuit, avant de rendre le véhicule.`,
  },
  {
    slug: "conseillers-assistance-sur-place",
    title: "Ce qui change avec une agence : un conseiller avant le départ, une assistance sur place",
    excerpt: "Réserver seul en ligne et passer par une agence coûte rarement plus cher : la différence se joue avant le départ et pendant le séjour.",
    category: "Accompagnement",
    readingTime: 6,
    imageSeed: "post-accompagnement",
    body: `Réserver un séjour en quelques clics ne pose pas de problème tant que tout se passe comme prévu. La vraie différence entre une réservation faite seul et une réservation passée par une agence se voit surtout quand quelque chose ne se passe pas comme prévu : un vol annulé, un hôtel fermé pour travaux à l'arrivée, un document de voyage à corriger la veille du départ.

Avant le départ, un conseiller spécialisé connaît les produits qu'il vend : la vraie distance entre un hôtel et la plage, le niveau réel d'un « tout compris », la période où telle destination devient inconfortable à cause de la chaleur ou des pluies. Ce sont des détails qu'une fiche produit seule ne dit pas toujours, et qui évitent des déceptions coûteuses à corriger sur place.

Pendant le séjour, une ligne d'assistance reste ouverte, y compris le week-end et les jours fériés, justement les moments où un imprévu a le plus de chances d'arriver. Un vol retardé qui fait rater une correspondance, un transfert qui n'est pas au rendez-vous : quelqu'un décroche et s'occupe de la suite, plutôt que de laisser le voyageur gérer seul un service client étranger dans une langue qu'il ne maîtrise pas toujours.

Sur les circuits accompagnés, ce suivi va plus loin : un guide francophone reste présent du premier au dernier jour, connaît les horaires réels d'ouverture des sites, adapte le rythme du groupe et répond aux questions sur place plutôt qu'en différé. C'est ce qui distingue un circuit d'un simple enchaînement d'hébergements réservés séparément.

Le prix, en définitive, n'est presque jamais l'écart déterminant : nos tarifs restent alignés sur ceux du marché, remise comprise. Ce qui change, c'est d'avoir quelqu'un à qui parler avant de partir, et quelqu'un qui répond une fois sur place.`,
  },
  {
    slug: "assurance-voyage-ce-qui-est-couvert",
    title: "Assurance voyage : ce qui est vraiment couvert, et ce qui ne l'est pas",
    excerpt: "Annulation, bagages, frais médicaux : les garanties se ressemblent d'un contrat à l'autre, sauf sur trois points qui font toute la différence.",
    category: "Conseils",
    readingTime: 6,
    imageSeed: "post-assurance",
    body: `Toutes les assurances voyage annoncent à peu près les mêmes garanties : annulation, bagages, frais médicaux, rapatriement. Ce qui les distingue vraiment se joue dans les exclusions et les plafonds, rarement lus avant la souscription.

Sur l'annulation, la plupart des contrats couvrent la maladie, l'accident ou le décès d'un proche, mais excluent souvent les pathologies déjà connues à la date de réservation, sauf mention contraire explicite. Vérifier ce point avant de partir avec une condition médicale existante évite une déconvenue au moment de faire jouer la garantie.

Sur les frais médicaux à l'étranger, le plafond de remboursement compte davantage que son existence : hors Union européenne, une hospitalisation peut coûter plusieurs dizaines de milliers d'euros, notamment aux États-Unis. Un contrat avec un plafond bas protège en théorie, mais pas vraiment en pratique sur ces destinations.

Le rapatriement sanitaire, enfin, doit être organisé par l'assisteur lui-même et non simplement remboursé après coup : c'est la différence entre une prise en charge immédiate et une avance de plusieurs milliers d'euros à faire soi-même avant remboursement, parfois des semaines plus tard.

Nos conseillers présentent systématiquement le niveau de garantie adapté à la destination choisie, plutôt qu'une formule unique : un séjour en Europe et un circuit longue distance n'appellent pas la même couverture.`,
  },
  {
    slug: "voyager-en-famille-bons-reflexes",
    title: "Voyager en famille : les bons réflexes pour un séjour sans accroc",
    excerpt: "Choix de l'hébergement, décalage horaire, activités enfants : ce qui fait la différence entre de bonnes et de mauvaises vacances en famille.",
    category: "Conseils",
    readingTime: 6,
    imageSeed: "post-famille",
    body: `Le choix de l'hébergement compte plus que celui de la destination pour un premier voyage en famille. Un club avec un vrai encadrement enfants, des créneaux de repas flexibles et une piscine surveillée simplifie la journée bien davantage qu'un hôtel de charme au confort par ailleurs équivalent.

Le décalage horaire mérite d'être anticipé dès la réservation : au-delà de trois ou quatre heures, mieux vaut prévoir une première journée sans programme chargé, plutôt qu'un circuit qui démarre dès l'arrivée. Les enfants s'adaptent souvent plus vite que les adultes, mais une nuit blanche gâche rarement le lendemain.

Sur les vols, réserver les sièges à l'avance évite la dispersion de la famille dans la cabine, un point que certaines compagnies à bas coût ne garantissent pas sans supplément. Vérifier également la politique bagage pour les enfants : la franchise accordée varie sensiblement d'une compagnie à l'autre.

Pour les formules tout compris, le niveau réel d'encadrement des activités enfants change beaucoup selon la saison et l'âge des groupes accueillis : nos conseillers connaissent les établissements où le club enfants fonctionne toute l'année, et ceux où il ferme hors haute saison.

Enfin, garder une marge dans le programme reste le conseil le plus utile : une famille qui visite un site par jour profite davantage qu'une famille qui en enchaîne trois, quel que soit l'âge des enfants.`,
  },
  {
    slug: "circuit-accompagne-ou-autotour",
    title: "Circuit accompagné ou autotour : comment choisir",
    excerpt: "Guide francophone et groupe organisé, ou véhicule de location et liberté totale : les deux formules ne conviennent pas aux mêmes voyageurs.",
    category: "Itinéraires",
    readingTime: 7,
    imageSeed: "post-circuits",
    body: `Le circuit accompagné convient à qui veut voir beaucoup sans organiser : un guide francophone gère les trajets, les horaires d'ouverture des sites et les imprévus, et le groupe avance à un rythme pensé pour ne rien manquer d'essentiel. C'est la formule la plus adaptée aux destinations où la langue, la conduite ou la logistique compliquent l'autonomie, comme certains circuits en Asie ou au Moyen-Orient.

L'autotour, à l'inverse, convient à qui préfère décider de son rythme : le véhicule, les hébergements et une feuille de route détaillée sont réservés à l'avance, mais chaque étape reste modifiable sur place. C'est la formule que choisissent le plus souvent les voyageurs qui reviennent une deuxième fois sur une destination déjà repérée en circuit accompagné.

Le budget ne tranche pas toujours en faveur de l'un ou de l'autre : un autotour inclut la location du véhicule et le carburant, quand un circuit accompagné mutualise le transport pour l'ensemble du groupe. Sur une destination longue distance, l'écart reste souvent modeste une fois tout comptabilisé.

Le vrai critère reste le niveau d'autonomie recherché : qui apprécie le contact avec un guide, les explications données sur place et la logistique déléguée choisira l'accompagné. Qui préfère s'arrêter sans prévenir devant un point de vue, changer un itinéraire à la dernière minute ou prolonger une étape choisira l'autotour.

Nos conseillers orientent systématiquement vers la formule adaptée à la destination et au profil du voyageur, plutôt que vers celle qui rapporte le plus : un autotour mal préparé sur une destination complexe coûte souvent plus cher en stress qu'en euros.`,
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
 * Colonne « Informations » du pied de page : deux groupes courts sous un même
 * titre plutôt que deux colonnes pleines, pour aérer le pied de page sans
 * perdre un seul lien (retour client : trop de liens à plat).
 */
export const FOOTER_INFO = [
  {
    group: "Mentions légales",
    links: ["Conditions générales", "Politique de confidentialité", "Gestion des cookies", "Accessibilité", "Médiation"],
  },
  {
    group: "À propos",
    links: ["Qui sommes-nous", "Guides de voyage", "Aide et FAQ", "Nous contacter", "Recrutement", "Affiliation"],
  },
];

/**
 * Pays les plus demandés par la clientèle France et Europe (retour client) :
 * remplace l'ancienne colonne « Nos sites », qui pointait vers `/aide` pour
 * chaque pays. Chaque lien filtre réellement le catalogue Séjours.
 */
export const POPULAR_COUNTRIES = [
  "Espagne", "Maroc", "Italie", "Grèce", "Portugal", "Tunisie", "Turquie", "Égypte",
];

export const FOOTER_LINKS = [
  {
    title: "Réserver",
    links: ["Vol + Hôtel", "Hôtels", "Croisières", "Circuits", "Vols", "Campings", "Location de voiture"],
  },
];

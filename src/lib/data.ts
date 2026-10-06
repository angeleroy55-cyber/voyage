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

/**
 * Aucun avis fictif ici, volontairement.
 *
 * Le tableau précédent contenait six témoignages inventés (faux prénoms,
 * fausses villes, faux textes), insérés en base avec le statut "published" :
 * de vrais visiteurs les lisaient comme des avis réels sur une agence qui n'a
 * pas encore eu de client. C'est le cas exact que la règle « jamais de
 * contenu inventé » interdit. Les vrais avis arrivent par le modèle `Review`
 * (voir prisma/schema.prisma), modérés depuis /admin/avis : ils existent dès
 * qu'un client en laisse un, pas avant.
 */
export const REVIEWS: Review[] = [];

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
  {
    slug: "comment-reserver-sejour-gosejour",
    title: "Comment réserver un séjour sur gosejour.fr, étape par étape",
    excerpt: "De la recherche à la confirmation : le détail de chaque étape, pour savoir à quoi s'attendre avant de commencer.",
    category: "Conseils",
    readingTime: 5,
    imageSeed: "post-reservation-etapes",
    body: `Réserver un voyage sur un site qu'on ne connaît pas encore peut hésiter : voici précisément ce qui se passe, du premier clic à la confirmation.

Première étape, la recherche. Depuis la page d'accueil ou une catégorie (Séjours, Circuits, Croisières...), le moteur de recherche propose une ville de départ, des dates et le nombre de voyageurs. La ville de départ est pré-remplie automatiquement si le navigateur autorise la localisation, mais reste modifiable à tout moment.

Deuxième étape, le choix de l'offre. Chaque fiche affiche la durée, la formule (pension, tout compris...), les photos et, pour les séjours, circuits et croisières, un choix de date de départ libre : le retour se calcule automatiquement selon la durée de la formule.

Troisième étape, la demande. Un clic sur "Demander cette offre" (ou "Demander un devis" pour les formules à date libre) mène à un récapitulatif, puis à un formulaire de coordonnées. Aucun paiement n'est demandé à ce stade : la demande est transmise à l'équipe, qui vérifie la disponibilité réelle avant toute confirmation.

Quatrième étape, la confirmation. Un e-mail de confirmation arrive avec la référence du dossier (format GO-XXXXX), à conserver pour toute démarche ultérieure. Si le virement bancaire a été choisi comme moyen de paiement, les coordonnées bancaires sont jointes dans ce même e-mail, avec la référence comme motif de virement.

Cinquième étape, le suivi. Un compte client (facultatif mais recommandé) permet de retrouver l'historique des demandes depuis "Mes réservations", sans avoir à fouiller dans sa boîte mail.

Un préavis n'engage à rien tant que la disponibilité n'est pas confirmée : c'est volontairement le cas sur ce type de catalogue, où les disponibilités réelles ne sont connues qu'au moment de la vérification par l'équipe.`,
  },
  {
    slug: "comment-finaliser-demande-devis",
    title: "Comment finaliser votre demande de devis sur gosejour.fr",
    excerpt: "Dates, voyageurs, coordonnées : ce qu'il faut préparer pour que votre devis parte sans aller-retour inutile.",
    category: "Conseils",
    readingTime: 4,
    imageSeed: "post-devis",
    body: `Pour un séjour, un circuit ou une croisière, la demande de devis remplace la réservation ferme immédiate : les disponibilités à une date précise dépendent souvent du prestataire, elles sont donc vérifiées avant toute confirmation. Voici comment préparer une demande qui aboutit vite.

Fixer une date de départ, même approximative. Le sélecteur de date sur la fiche offre calcule automatiquement la date de retour à partir de la durée de la formule. Une date précise permet une vérification de disponibilité réelle ; une période large ("en juillet") demande un aller-retour supplémentaire par e-mail ou WhatsApp pour affiner.

Indiquer le nombre exact de voyageurs, adultes et enfants séparément : la tarification et parfois la disponibilité des chambres en dépendent directement.

Laisser une précision en commentaire si besoin : chambre communicante, régime alimentaire, étage bas, proximité de la plage. Ces détails ne changent pas le prix affiché, mais orientent la recherche de disponibilité du côté de l'équipe.

Vérifier son e-mail et son numéro de téléphone avant l'envoi : c'est le seul canal par lequel le devis définitif revient, avec le prix confirmé pour les dates demandées.

Une fois la demande envoyée, un e-mail de confirmation de réception arrive immédiatement, avec la référence du dossier. Le devis chiffré suit généralement sous 24 h ouvrées.`,
  },
  {
    slug: "reduire-cout-voyage",
    title: "Comment réduire le coût de votre prochain voyage",
    excerpt: "Dates flexibles, durée, formule : les leviers qui font vraiment baisser la note, sans sacrifier le voyage.",
    category: "Conseils",
    readingTime: 6,
    imageSeed: "post-budget",
    body: `Le prix d'un même voyage peut varier du simple au double selon quelques choix simples, bien avant de toucher à la destination elle-même.

La date de départ est le levier le plus puissant. Partir en dehors des vacances scolaires (hors zones concernées) ou en milieu de semaine plutôt qu'un samedi fait souvent une différence nette sur le prix du vol comme de l'hébergement. Les périodes d'été indien (septembre-octobre) offrent un climat encore chaud pour un budget nettement inférieur à juillet-août sur la plupart des destinations méditerranéennes.

La durée du séjour compte aussi, dans les deux sens : un aller-retour très court paie souvent le vol presque au même prix qu'un séjour d'une semaine, pour beaucoup moins de nuits sur place. À l'inverse, une semaine de plus se négocie en général mieux par nuit qu'un week-end.

La formule change la facture visible, pas toujours la facture réelle. Un "tout compris" semble plus cher au premier regard qu'un "petit-déjeuner", mais inclut repas, boissons et souvent des activités qu'il faudrait payer à part en formule plus légère : comparer le prix total du séjour, repas compris, donne une image plus juste.

La ville de départ joue un rôle sous-estimé. Un vol depuis une ville secondaire est parfois moins cher qu'au départ de Paris, en particulier sur les destinations desservies par plusieurs aéroports régionaux.

Enfin, les bons plans et dernières minutes concentrent les remises les plus fortes, mais demandent de la souplesse sur la date : ils conviennent à qui peut partir sous trois semaines, pas à un voyage calé à une date fixe imposée (mariage, anniversaire).`,
  },
  {
    slug: "attitudes-avant-pendant-apres-sejour",
    title: "Les bons réflexes avant, pendant et après un séjour",
    excerpt: "Ce qui évite les mauvaises surprises, à chaque étape du voyage, destination comprise.",
    category: "Conseils",
    readingTime: 6,
    imageSeed: "post-reflexes-voyage",
    body: `Un voyage qui se passe bien tient autant à l'organisation en amont qu'à la destination elle-même. Quelques réflexes simples évitent la plupart des mauvaises surprises.

Avant le départ, vérifier la validité des documents d'identité est la première chose à faire, bien avant de préparer les bagages : un passeport arrivant à expiration dans les six mois suivant le voyage est refusé par de nombreux pays hors Union européenne, une règle qui surprend encore chaque année des voyageurs mal informés. Vérifier aussi si une autorisation de voyage électronique est nécessaire (ETIAS pour l'espace Schengen, ESTA pour les États-Unis, e-visa pour certains pays d'Asie) : ces démarches se font en ligne, mais prennent parfois plusieurs jours à être validées, et leur date d'entrée en vigueur a déjà été repoussée plusieurs fois selon les pays — mieux vaut vérifier l'information officielle à jour avant de partir.

Souscrire une assurance voyage adaptée à la destination, en particulier hors Union européenne où les frais médicaux peuvent être très élevés sans couverture (certains pays, comme les États-Unis, facturent une hospitalisation plusieurs dizaines de milliers d'euros). Vérifier ce que couvre déjà une carte bancaire haut de gamme avant d'en souscrire une en double.

Pendant le séjour, garder une copie numérique (photo ou scan) des documents importants - passeport, billets, réservations - accessible même sans connexion internet. En cas de perte, cela accélère considérablement les démarches auprès du consulat ou de l'hébergeur.

Respecter les usages locaux, en particulier vestimentaires pour les lieux de culte et comportementaux dans les pays où certains gestes anodins en France sont mal perçus ailleurs : se renseigner quelques minutes avant le départ évite le faux pas.

Après le retour, signaler rapidement tout problème resté en suspens (bagage égaré, prestation non conforme) pendant que les échanges avec les prestataires sont encore simples à établir : plus le délai s'allonge, plus la résolution devient compliquée. Conserver les justificatifs de dépenses imprévues liées à un incident de voyage, utiles en cas de recours auprès d'une assurance.`,
  },
  {
    slug: "pourquoi-choisir-gosejour",
    title: "Pourquoi choisir GoSéjour pour réserver vos voyages",
    excerpt: "Ce que le site fait concrètement différemment, sans promesse qu'on ne peut pas tenir.",
    category: "Conseils",
    readingTime: 4,
    imageSeed: "post-pourquoi-gosejour",
    body: `GoSéjour est une agence de voyages en ligne récente : plutôt que d'avancer des chiffres qui n'existeraient pas encore, voici ce que le site propose concrètement aujourd'hui.

Un seul endroit pour comparer séjours, circuits, croisières, hôtels, vols, campings et locations de voiture, plutôt que de rouvrir un site différent pour chaque type de réservation.

Un devis sans engagement sur les séjours, circuits et croisières : la demande part avec une date de départ choisie librement, et rien n'est débité avant la confirmation définitive du dossier par l'équipe.

Un contact direct par WhatsApp, en plus du téléphone et de l'e-mail, pour une question rapide sans passer par un formulaire de contact classique.

Des photographies réelles de destination, sous licence Wikimedia Commons avec mention de l'auteur sur chaque fiche, plutôt que des visuels génériques ou des photos d'hébergements qui ne correspondent pas à ce qui sera réellement réservé.

Un espace client qui conserve l'historique des demandes et réservations, avec la référence de dossier (format GO-XXXXX) comme repère unique pour toute démarche ultérieure.

Un règlement par virement bancaire sans frais, le temps que d'autres moyens de paiement soient mis en place : les coordonnées bancaires sont transmises par e-mail uniquement après la demande, jamais affichées publiquement.

Ce sont des choix de fonctionnement, pas des arguments marketing : ils se vérifient en utilisant le site, pas en lisant une page "à propos".`,
  },
];

/**
 * Repères du bandeau de réassurance de l'accueil.
 *
 * Des capacités réelles du site, pas des statistiques : GoSéjour est une
 * agence qui démarre, elle n'a ni volume de clients ni note moyenne à
 * afficher honnêtement pour l'instant. Un chiffre inventé ("4,3 M de
 * voyageurs", une note sur des milliers d'avis qui n'existent pas encore)
 * serait un faux témoignage déguisé en statistique — interdit par les règles
 * du projet. Ces quatre lignes se mettent à jour au fil de l'activité
 * réelle : virement (seul moyen de paiement actif aujourd'hui, voir
 * PAYMENT_ENABLED), WhatsApp, devis sans engagement, catalogue unique.
 */
export const TRUST_POINTS = [
  { value: "Devis", label: "gratuit et sans engagement" },
  { value: "WhatsApp", label: "une question, une réponse directe" },
  { value: "Virement", label: "sans frais, coordonnées transmises par e-mail" },
  { value: "6", label: "types de voyage réunis en une recherche" },
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

import { continentOf } from "@/lib/data";
import type { Board, Offer } from "@/lib/types";

/**
 * Catalogue source de GoSéjour : destinations et offres réelles.
 *
 * Ce qui est réel ici, et ce qui ne l'est pas, pour que personne ne s'y trompe.
 *
 * Réels : les destinations, les pays, les villes, les régions, les aéroports,
 * les itinéraires de circuits et de croisières, les durées d'usage du marché,
 * et les niveaux de prix, relevés en août 2026 sur les sites du même segment
 * (Logitravel, Salaün Holidays, Carrefour Voyages, Edentour, Promoséjours).
 *
 * Volontairement génériques : les intitulés d'hébergement. Une offre s'appelle
 * ici « Resort tout compris à Costa Adeje », pas du nom d'un hôtel précis.
 * Reprendre les fiches d'un concurrent serait une contrefaçon, et annoncer un
 * établissement nommé qu'on ne peut pas confirmer serait pire. Les noms
 * d'établissements arriveront avec le flux d'affiliation, qui les fournit avec
 * la disponibilité et le prix du jour.
 *
 * Le prix de référence est le prix marché relevé ; le prix GoSéjour s'en déduit
 * par la remise de la colonne `discount`, 10 % par défaut, davantage sur les
 * ventes flash. C'est la politique du cahier de catégorisation, et
 * `referencePriceSource` en garde la trace en base, sans jamais l'afficher.
 */

/** Prix de référence relevés sur ces sites : sert au champ interne de traçabilité. */
export const REFERENCE_PRICE_SOURCE = "Relevé concurrentiel août 2026";

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export type SourceDestination = {
  slug: string;
  /** Nom affiché : un pays, une île ou une ville selon la maille vendue. */
  name: string;
  country: string;
  /** Libellé commercial, celui des filtres : Canaries, Îles grecques, Fluvial… */
  region: string;
  /** Requête d'illustration, résolue par `npm run photos` sur Wikimedia Commons. */
  photo: string;
  blurb: string;
  featured?: boolean;
};

export const DESTINATIONS: SourceDestination[] = [
  // ---- Afrique du Nord ----
  { slug: "maroc", name: "Maroc", country: "Maroc", region: "Afrique du Nord", photo: "Marrakech Koutoubia", featured: true,
    blurb: "Trois heures de vol, des médinas classées, l'Atlas à une heure de route et une saison qui ne s'arrête jamais vraiment." },
  { slug: "marrakech", name: "Marrakech", country: "Maroc", region: "Afrique du Nord", photo: "Marrakech Jemaa el-Fnaa",
    blurb: "La médina, les riads à patio et la palmeraie : la ville se visite à pied le matin et se vit au calme l'après-midi." },
  { slug: "agadir", name: "Agadir", country: "Maroc", region: "Afrique du Nord", photo: "Agadir beach",
    blurb: "Dix kilomètres de sable exposés plein ouest, une eau qui reste baignable de mars à novembre et des clubs à prix contenus." },
  { slug: "tunisie", name: "Tunisie", country: "Tunisie", region: "Afrique du Nord", photo: "Sidi Bou Said",
    blurb: "La destination tout compris la plus accessible du bassin méditerranéen, à deux heures et demie de vol." },
  { slug: "djerba", name: "Djerba", country: "Tunisie", region: "Afrique du Nord", photo: "Djerba beach",
    blurb: "Une île plate, des plages de sable fin au nord-est, et un climat plus doux que le continent en arrière-saison." },
  { slug: "egypte", name: "Égypte", country: "Égypte", region: "Mer Rouge", photo: "Great Sphinx of Giza", featured: true,
    blurb: "Deux voyages en un : les sites pharaoniques de la vallée du Nil, et les récifs de la mer Rouge, parmi les plus riches au monde." },
  { slug: "hurghada", name: "Hurghada", country: "Égypte", region: "Mer Rouge", photo: "Hurghada Red Sea",
    blurb: "Le point d'entrée de la mer Rouge : récifs accessibles depuis la plage, vent constant, et du soleil toute l'année." },

  // ---- Europe ----
  { slug: "espagne", name: "Espagne", country: "Espagne", region: "Europe", photo: "Barcelona Sagrada Familia", featured: true,
    blurb: "Des Baléares aux Canaries en passant par l'Andalousie : la première destination des voyageurs français, et de loin." },
  { slug: "canaries", name: "Canaries", country: "Espagne", region: "Canaries", photo: "Tenerife Teide",
    blurb: "Vingt-deux degrés en janvier. L'archipel est la seule destination d'Europe où l'été ne s'arrête pas en octobre." },
  { slug: "baleares", name: "Baléares", country: "Espagne", region: "Baléares", photo: "Mallorca beach cove",
    blurb: "Majorque pour les criques du nord, Ibiza pour les couchers de soleil, Minorque pour le calme." },
  { slug: "barcelone", name: "Barcelone", country: "Espagne", region: "Europe", photo: "Barcelona Park Guell",
    blurb: "Gaudí, le Barri Gòtic et une plage en ville : la seule grande capitale culturelle méditerranéenne où l'on se baigne." },
  { slug: "andalousie", name: "Andalousie", country: "Espagne", region: "Europe", photo: "Seville Plaza de Espana",
    blurb: "Séville, Cordoue, Grenade : huit siècles d'histoire andalouse en trois villes distantes de deux heures de train." },
  { slug: "portugal", name: "Portugal", country: "Portugal", region: "Atlantique", photo: "Lisbon tram Alfama", featured: true,
    blurb: "Lisbonne et Porto pour les villes, l'Algarve pour les falaises ocre, Madère pour marcher toute l'année." },
  { slug: "lisbonne", name: "Lisbonne", country: "Portugal", region: "Atlantique", photo: "Lisbon Belem Tower",
    blurb: "Sept collines, des azulejos, et l'estuaire du Tage : une capitale qui se parcourt à pied et en tramway." },
  { slug: "madere", name: "Madère", country: "Portugal", region: "Atlantique", photo: "Madeira Funchal",
    blurb: "Une île volcanique où l'on randonne le long des levadas en février, à vingt degrés." },
  { slug: "italie", name: "Italie", country: "Italie", region: "Europe", photo: "Rome Colosseum", featured: true,
    blurb: "Rome, Florence, Venise, la Toscane, la côte amalfitaine, la Sicile : plus de sites classés que n'importe quel autre pays." },
  { slug: "rome", name: "Rome", country: "Italie", region: "Europe", photo: "Rome Trevi Fountain",
    blurb: "Le Colisée, le Vatican et le Trastevere : trois jours suffisent pour l'essentiel, à condition de réserver les entrées." },
  { slug: "sicile", name: "Sicile", country: "Italie", region: "Méditerranée", photo: "Taormina Sicily",
    blurb: "L'Etna, les temples grecs d'Agrigente et Taormine : une île qui se visite en voiture, hors des mois d'août." },
  { slug: "grece", name: "Grèce", country: "Grèce", region: "Îles grecques", photo: "Santorini Oia", featured: true,
    blurb: "Deux cents îles habitées, des sites antiques et une saison balnéaire qui court de mai à octobre." },
  { slug: "crete", name: "Crète", country: "Grèce", region: "Îles grecques", photo: "Crete Balos beach",
    blurb: "La plus grande île grecque : plages au nord, gorges et montagnes au sud, et de quoi tenir deux semaines." },
  { slug: "santorin", name: "Santorin", country: "Grèce", region: "Îles grecques", photo: "Santorini caldera",
    blurb: "Une caldeira, des villages blancs sur la falaise et le coucher de soleil d'Oia. Court séjour, forte impression." },
  { slug: "croatie", name: "Croatie", country: "Croatie", region: "Méditerranée", photo: "Dubrovnik old town",
    blurb: "Mille îles, une eau transparente et des vieilles villes vénitiennes : Dubrovnik, Split, Zadar." },
  { slug: "france", name: "France", country: "France", region: "France", photo: "Paris Eiffel Tower", featured: true,
    blurb: "Première destination touristique mondiale, et la seule où l'on part sans avion : littoral, montagne, villes d'art." },
  { slug: "paris", name: "Paris", country: "France", region: "France", photo: "Paris Louvre pyramid",
    blurb: "Musées, quais de Seine et quartiers de village : un long week-end suffit à en voir une bonne part." },
  { slug: "nice", name: "Nice", country: "France", region: "France", photo: "Nice Promenade des Anglais",
    blurb: "La baie des Anges, le vieux Nice et l'arrière-pays : la Côte d'Azur reste douce jusqu'en novembre." },
  { slug: "corse", name: "Corse", country: "France", region: "France", photo: "Corsica Porto-Vecchio beach",
    blurb: "Des plages de Porto-Vecchio aux aiguilles de Bavella : l'île tient dans une semaine, à condition de louer une voiture." },
  { slug: "royaume-uni", name: "Royaume-Uni", country: "Royaume-Uni", region: "Europe du Nord", photo: "London Tower Bridge",
    blurb: "Londres pour les musées gratuits et les quartiers, l'Écosse pour les Highlands et les distilleries." },
  { slug: "londres", name: "Londres", country: "Royaume-Uni", region: "Europe du Nord", photo: "London Westminster",
    blurb: "Deux heures quinze en Eurostar. Musées nationaux gratuits, marchés et parcs : la ville se fait à pied." },
  { slug: "islande", name: "Islande", country: "Islande", region: "Europe du Nord", photo: "Iceland Skogafoss waterfall",
    blurb: "Geysers, cascades et glaciers sur une route unique. Aurores boréales de septembre à mars, soleil de minuit en juin." },
  { slug: "norvege", name: "Norvège", country: "Norvège", region: "Europe du Nord", photo: "Norway Geirangerfjord",
    blurb: "Les fjords de l'ouest et le cap Nord, en croisière ou en train : le paysage européen le plus spectaculaire." },
  { slug: "turquie", name: "Turquie", country: "Turquie", region: "Méditerranée", photo: "Cappadocia balloons",
    blurb: "Istanbul à cheval sur deux continents, la Cappadoce et les resorts d'Antalya : trois voyages très différents." },
  { slug: "prague", name: "Prague", country: "Tchéquie", region: "Europe", photo: "Prague Charles Bridge",
    blurb: "Une vieille ville intacte, le pont Charles et le château : la capitale d'Europe centrale la plus accessible." },
  { slug: "amsterdam", name: "Amsterdam", country: "Pays-Bas", region: "Europe", photo: "Amsterdam canals",
    blurb: "Les canaux classés, le Rijksmuseum et le vélo partout : une ville faite pour deux nuits." },
  { slug: "malte", name: "Malte", country: "Malte", region: "Méditerranée", photo: "Valletta Malta harbour",
    blurb: "Un archipel anglophone entre Sicile et Tunisie, praticable toute l'année, avec La Valette pour base." },

  // ---- Océan Indien et Afrique subsaharienne ----
  { slug: "ile-maurice", name: "Île Maurice", country: "Île Maurice", region: "Océan Indien", photo: "Mauritius Le Morne beach", featured: true,
    blurb: "Un lagon fermé par la barrière de corail, des hôtels de toutes gammes et une saison sèche de mai à décembre." },
  { slug: "seychelles", name: "Seychelles", country: "Seychelles", region: "Océan Indien", photo: "Seychelles Anse Source d'Argent",
    blurb: "Granit rose, eau turquoise et trois îles principales reliées en bateau : Mahé, Praslin, La Digue." },
  { slug: "maldives", name: "Maldives", country: "Maldives", region: "Océan Indien", photo: "Maldives overwater bungalow",
    blurb: "Mille deux cents îles, un hôtel par île, et des bungalows sur pilotis au-dessus du lagon." },
  { slug: "zanzibar", name: "Zanzibar", country: "Tanzanie", region: "Océan Indien", photo: "Zanzibar Nungwi beach",
    blurb: "Stone Town classée, les plantations d'épices et les plages du nord : souvent combinée avec un safari." },
  { slug: "cap-vert", name: "Cap-Vert", country: "Cap-Vert", region: "Atlantique", photo: "Cape Verde Sal Santa Maria beach",
    blurb: "Vingt-cinq degrés toute l'année, six heures de vol, et des îles au caractère très différent : Sal, Boa Vista, São Vicente." },
  { slug: "la-reunion", name: "La Réunion", country: "La Réunion", region: "Océan Indien", photo: "Reunion Island Piton de la Fournaise",
    blurb: "Un volcan actif, trois cirques classés et un lagon à l'ouest : l'île se randonne autant qu'elle se bronze." },
  { slug: "kenya", name: "Kenya", country: "Kenya", region: "Afrique de l'Est", photo: "Masai Mara wildebeest",
    blurb: "Le Masai Mara, la grande migration entre juillet et octobre, et la côte de Mombasa pour prolonger." },
  { slug: "afrique-du-sud", name: "Afrique du Sud", country: "Afrique du Sud", region: "Afrique australe", photo: "Cape Town Table Mountain",
    blurb: "Le Cap, la route des jardins et les réserves privées du Kruger : un long-courrier sans décalage horaire." },
  { slug: "senegal", name: "Sénégal", country: "Sénégal", region: "Atlantique", photo: "Senegal Saly beach",
    blurb: "Cinq heures de vol, pas de décalage, et la Petite Côte pour les séjours balnéaires en hiver." },

  // ---- Amériques et Caraïbes ----
  { slug: "republique-dominicaine", name: "République dominicaine", country: "République dominicaine", region: "Caraïbes", photo: "Punta Cana beach palm", featured: true,
    blurb: "Punta Cana et ses trente kilomètres de sable blanc : le meilleur rapport qualité-prix du tout compris caribéen." },
  { slug: "mexique", name: "Mexique", country: "Mexique", region: "Caraïbes", photo: "Tulum Mayan ruins",
    blurb: "La Riviera Maya pour les plages et les cénotes, le Yucatán pour Chichén Itzá et les villes coloniales." },
  { slug: "cuba", name: "Cuba", country: "Cuba", region: "Caraïbes", photo: "Havana classic car",
    blurb: "La Havane et Trinidad pour l'histoire, Varadero pour la plage : les deux se combinent en une semaine." },
  { slug: "guadeloupe", name: "Guadeloupe", country: "Guadeloupe", region: "Caraïbes", photo: "Guadeloupe Sainte-Anne beach",
    blurb: "Deux îles en une : Grande-Terre et ses plages, Basse-Terre et sa forêt tropicale. Sans passeport ni change." },
  { slug: "martinique", name: "Martinique", country: "Martinique", region: "Caraïbes", photo: "Martinique Les Salines beach",
    blurb: "Les Salines, la montagne Pelée et les distilleries : l'île se traverse en une heure et demie." },
  { slug: "etats-unis", name: "États-Unis", country: "États-Unis", region: "Amérique du Nord", photo: "New York Manhattan skyline",
    blurb: "New York pour un long week-end, l'Ouest américain pour un road trip de deux semaines, la Floride pour les parcs." },
  { slug: "canada", name: "Canada", country: "Canada", region: "Amérique du Nord", photo: "Quebec City Chateau Frontenac",
    blurb: "Le Québec francophone à l'été indien, les Rocheuses à l'ouest : un long-courrier sans barrière de langue." },
  { slug: "perou", name: "Pérou", country: "Pérou", region: "Amérique du Sud", photo: "Machu Picchu",
    blurb: "Le Machu Picchu, la vallée sacrée et le lac Titicaca : à faire entre mai et septembre, en saison sèche." },
  { slug: "bresil", name: "Brésil", country: "Brésil", region: "Amérique du Sud", photo: "Rio de Janeiro Sugarloaf",
    blurb: "Rio, les chutes d'Iguaçu et Salvador de Bahia : trois climats et trois ambiances dans un même voyage." },
  { slug: "costa-rica", name: "Costa Rica", country: "Costa Rica", region: "Amérique du Sud", photo: "Costa Rica Arenal volcano",
    blurb: "Vingt-cinq pour cent du territoire en aires protégées, deux océans, et des volcans actifs entre les deux." },

  // ---- Asie et Moyen-Orient ----
  { slug: "thailande", name: "Thaïlande", country: "Thaïlande", region: "Asie du Sud-Est", photo: "Thailand Krabi Railay beach", featured: true,
    blurb: "Bangkok, le nord et ses temples, les îles du sud : le circuit puis la plage, sur douze à quinze jours." },
  { slug: "bangkok", name: "Bangkok", country: "Thaïlande", region: "Asie du Sud-Est", photo: "Bangkok Wat Arun",
    blurb: "Le Grand Palais, les marchés flottants et les rooftops : deux nuits en escale, ou le point de départ du voyage." },
  { slug: "japon", name: "Japon", country: "Japon", region: "Asie", photo: "Kyoto Fushimi Inari",
    blurb: "Tokyo, Kyoto et le Kansai reliés par le Shinkansen. Cerisiers fin mars, érables rouges en novembre." },
  { slug: "vietnam", name: "Vietnam", country: "Vietnam", region: "Asie du Sud-Est", photo: "Ha Long Bay",
    blurb: "La baie d'Along, Hué, Hoi An et le delta du Mékong : mille sept cents kilomètres du nord au sud." },
  { slug: "bali", name: "Bali", country: "Indonésie", region: "Asie du Sud-Est", photo: "Bali rice terraces Tegallalang",
    blurb: "Rizières en terrasses, temples et plages du sud : une île où l'on reste deux semaines sans s'ennuyer." },
  { slug: "sri-lanka", name: "Sri Lanka", country: "Sri Lanka", region: "Océan Indien", photo: "Sri Lanka Sigiriya",
    blurb: "Le triangle culturel, les plantations de thé et les plages du sud, sur une île grande comme l'Irlande." },
  { slug: "dubai", name: "Dubaï", country: "Émirats arabes unis", region: "Moyen-Orient", photo: "Dubai Burj Khalifa skyline",
    blurb: "Six heures de vol, du soleil de novembre à avril, et une escale naturelle vers l'océan Indien ou l'Asie." },
  { slug: "jordanie", name: "Jordanie", country: "Jordanie", region: "Moyen-Orient", photo: "Petra Treasury Jordan",
    blurb: "Petra, le Wadi Rum et la mer Morte : un circuit d'une semaine sur des routes faciles." },
];

// ---------------------------------------------------------------------------
// Offres
// ---------------------------------------------------------------------------

type RawOffer = [
  slug: string,
  category: Offer["category"],
  subtype: string,
  title: string,
  city: string,
  country: string,
  region: string,
  departureCity: string,
  nights: number,
  stars: number,
  board: Board,
  /** Prix marché relevé chez les concurrents, affiché barré. */
  referencePrice: number,
  /** Remise GoSéjour, en pourcentage du prix de référence. */
  discount: number,
  rating: number,
  reviews: number,
  tags: string[],
];

const RAW: RawOffer[] = [
  // ---- Séjours : Afrique du Nord et mer Rouge ----
  ["agadir-baie-tout-compris", "sejours", "tout_compris", "Club tout compris face à la baie d'Agadir", "Agadir", "Maroc", "Afrique du Nord", "Paris", 7, 4, "Tout compris", 269, 10, 8.4, 1240, ["Tout compris", "Famille"]],
  ["marrakech-palmeraie-riad", "sejours", "vol_hotel", "Riad avec spa dans la Palmeraie", "Marrakech", "Maroc", "Afrique du Nord", "Paris", 7, 4, "Petit-déjeuner", 429, 12, 8.7, 986, ["Spa", "Vente flash"]],
  ["essaouira-front-de-mer", "sejours", "vol_hotel", "Hôtel front de mer à Essaouira", "Essaouira", "Maroc", "Afrique du Nord", "Paris", 7, 4, "Demi-pension", 399, 10, 8.5, 412, ["Nature"]],
  ["agadir-taghazout-surf", "sejours", "vol_hotel", "Résidence surf à Taghazout", "Taghazout", "Maroc", "Afrique du Nord", "Lyon", 7, 3, "Petit-déjeuner", 349, 10, 8.3, 520, ["Sport"]],
  ["djerba-grande-plage", "sejours", "tout_compris", "Resort tout compris sur la grande plage de Djerba", "Djerba", "Tunisie", "Afrique du Nord", "Paris", 7, 4, "Tout compris", 319, 10, 8.3, 1502, ["Tout compris", "Famille"]],
  ["hammamet-yasmine-club", "sejours", "tout_compris", "Club familial à Yasmine Hammamet", "Hammamet", "Tunisie", "Afrique du Nord", "Paris", 7, 4, "Tout compris", 349, 12, 8.2, 1108, ["Tout compris", "Famille"]],
  ["sousse-corniche", "sejours", "tout_compris", "Hôtel 4★ sur la corniche de Sousse", "Sousse", "Tunisie", "Afrique du Nord", "Marseille", 7, 4, "Tout compris", 335, 10, 8.1, 764, ["Tout compris"]],
  ["hurghada-recifs", "sejours", "tout_compris", "Club plongée face aux récifs de Hurghada", "Hurghada", "Égypte", "Mer Rouge", "Paris", 7, 5, "Tout compris", 549, 12, 8.8, 2140, ["Tout compris", "Plongée"]],
  ["charm-el-cheikh-naama", "sejours", "tout_compris", "Resort 5★ à Naama Bay", "Charm el-Cheikh", "Égypte", "Mer Rouge", "Paris", 7, 5, "Tout compris", 589, 15, 8.7, 1830, ["Tout compris", "Plongée"]],
  ["marsa-alam-jardin-corail", "sejours", "tout_compris", "Lagon et jardin de corail à Marsa Alam", "Marsa Alam", "Égypte", "Mer Rouge", "Paris", 7, 5, "Tout compris", 619, 12, 8.9, 940, ["Tout compris", "Plongée"]],

  // ---- Séjours : Espagne, Baléares, Canaries ----
  ["majorque-playa-de-palma", "sejours", "vol_hotel", "Hôtel bord de mer à Playa de Palma", "Palma de Majorque", "Espagne", "Baléares", "Paris", 7, 4, "Demi-pension", 339, 10, 8.4, 1660, ["Baléares"]],
  ["majorque-alcudia-famille", "sejours", "tout_compris", "Club familial dans la baie d'Alcúdia", "Alcúdia", "Espagne", "Baléares", "Nantes", 7, 4, "Tout compris", 419, 10, 8.5, 1140, ["Tout compris", "Famille"]],
  ["ibiza-san-antonio", "sejours", "vol_hotel", "Vue couchant à San Antonio", "Ibiza", "Espagne", "Baléares", "Paris", 7, 4, "Petit-déjeuner", 489, 10, 8.2, 980, ["Baléares"]],
  ["tenerife-costa-adeje", "sejours", "tout_compris", "Resort tout compris à Costa Adeje", "Ténérife", "Espagne", "Canaries", "Paris", 7, 4, "Tout compris", 549, 12, 8.6, 2210, ["Canaries", "Tout compris"]],
  ["fuerteventura-corralejo", "sejours", "vol_hotel", "Hôtel sur les dunes de Corralejo", "Fuerteventura", "Espagne", "Canaries", "Paris", 7, 4, "Demi-pension", 499, 10, 8.5, 1470, ["Canaries"]],
  ["lanzarote-puerto-del-carmen", "sejours", "tout_compris", "Club face à Puerto del Carmen", "Lanzarote", "Espagne", "Canaries", "Lyon", 7, 4, "Tout compris", 519, 10, 8.4, 1120, ["Canaries", "Tout compris"]],
  ["grande-canarie-maspalomas", "sejours", "tout_compris", "Tout compris aux dunes de Maspalomas", "Grande Canarie", "Espagne", "Canaries", "Paris", 7, 4, "Tout compris", 529, 12, 8.5, 1390, ["Canaries", "Tout compris"]],
  ["costa-brava-lloret", "sejours", "vol_hotel", "Séjour plage à Lloret de Mar", "Lloret de Mar", "Espagne", "Méditerranée", "Paris", 7, 3, "Demi-pension", 289, 10, 7.9, 1640, ["Petit prix"]],
  ["costa-del-sol-torremolinos", "sejours", "tout_compris", "Front de mer à Torremolinos", "Torremolinos", "Espagne", "Méditerranée", "Paris", 7, 4, "Tout compris", 379, 10, 8.2, 1210, ["Tout compris"]],

  // ---- Séjours : Grèce, Italie, Portugal, Méditerranée ----
  ["crete-heraklion-village", "sejours", "tout_compris", "Village-club au sud d'Héraklion", "Crète", "Grèce", "Îles grecques", "Paris", 7, 4, "Tout compris", 529, 12, 8.5, 1103, ["Îles grecques", "Tout compris"]],
  ["rhodes-faliraki", "sejours", "tout_compris", "Club plage à Faliraki", "Rhodes", "Grèce", "Îles grecques", "Paris", 7, 4, "Tout compris", 549, 10, 8.4, 890, ["Îles grecques", "Tout compris"]],
  ["kos-tigaki", "sejours", "tout_compris", "Resort familial à Tigaki", "Kos", "Grèce", "Îles grecques", "Lyon", 7, 4, "Tout compris", 519, 10, 8.3, 640, ["Îles grecques", "Famille"]],
  ["corfou-sidari", "sejours", "vol_hotel", "Baie de Sidari, au nord de Corfou", "Corfou", "Grèce", "Îles grecques", "Paris", 7, 4, "Demi-pension", 479, 10, 8.4, 720, ["Îles grecques"]],
  ["santorin-caldeira", "sejours", "vol_hotel", "Chambre avec vue sur la caldeira", "Santorin", "Grèce", "Îles grecques", "Paris", 5, 4, "Petit-déjeuner", 749, 10, 9.1, 1340, ["Coup de cœur", "Romantique"]],
  ["algarve-albufeira", "sejours", "vol_hotel", "Entre falaises et plage à Albufeira", "Albufeira", "Portugal", "Atlantique", "Paris", 7, 4, "Demi-pension", 429, 10, 8.6, 1180, ["Atlantique"]],
  ["madere-funchal-atlantique", "sejours", "vol_hotel", "Balcon sur l'Atlantique à Funchal", "Madère", "Portugal", "Atlantique", "Paris", 7, 4, "Petit-déjeuner", 449, 10, 8.9, 731, ["Nature", "Randonnée"]],
  ["sicile-taormine", "sejours", "vol_hotel", "Entre Etna et mer Ionienne à Taormine", "Taormine", "Italie", "Méditerranée", "Paris", 7, 4, "Demi-pension", 569, 10, 8.6, 540, ["Coup de cœur"]],
  ["sardaigne-costa-smeralda", "sejours", "vol_hotel", "Crique de Costa Smeralda", "Olbia", "Italie", "Méditerranée", "Paris", 7, 4, "Demi-pension", 649, 10, 8.5, 470, ["Méditerranée"]],
  ["antalya-lara-beach", "sejours", "tout_compris", "Resort ultra tout compris à Lara Beach", "Antalya", "Turquie", "Méditerranée", "Paris", 7, 5, "Tout compris", 599, 15, 8.8, 2410, ["Tout compris", "Vente flash"]],
  ["chypre-larnaca", "sejours", "tout_compris", "Front de mer à Larnaca", "Larnaca", "Chypre", "Méditerranée", "Paris", 7, 4, "Tout compris", 559, 10, 8.4, 610, ["Tout compris"]],
  ["malte-sliema", "sejours", "vol_hotel", "Sur le front de mer de Sliema", "Sliema", "Malte", "Méditerranée", "Paris", 5, 4, "Petit-déjeuner", 419, 10, 8.5, 830, ["Ville"]],
  ["dubrovnik-lapad", "sejours", "vol_hotel", "Baie de Lapad, à Dubrovnik", "Dubrovnik", "Croatie", "Méditerranée", "Paris", 7, 4, "Petit-déjeuner", 629, 10, 8.7, 690, ["Coup de cœur"]],

  // ---- Séjours : Atlantique et océan Indien ----
  ["cap-vert-sal-santa-maria", "sejours", "tout_compris", "Tout compris à Santa Maria, île de Sal", "Sal", "Cap-Vert", "Atlantique", "Paris", 7, 4, "Tout compris", 899, 12, 8.5, 780, ["Tout compris", "Soleil d'hiver"]],
  ["cap-vert-boa-vista-chaves", "sejours", "tout_compris", "Plage de Chaves, à Boa Vista", "Boa Vista", "Cap-Vert", "Atlantique", "Paris", 7, 4, "Tout compris", 949, 10, 8.4, 520, ["Tout compris", "Soleil d'hiver"]],
  ["maurice-flic-en-flac", "sejours", "tout_compris", "Lagon de Flic en Flac", "Flic en Flac", "Île Maurice", "Océan Indien", "Paris", 9, 4, "Tout compris", 1490, 12, 8.9, 960, ["Océan Indien", "Tout compris"]],
  ["maurice-belle-mare", "sejours", "vol_hotel", "Côte est, sur la plage de Belle Mare", "Belle Mare", "Île Maurice", "Océan Indien", "Paris", 9, 5, "Demi-pension", 1890, 10, 9.0, 640, ["Océan Indien", "Luxe"]],
  ["seychelles-mahe", "sejours", "vol_hotel", "Anse à la Mouche, à Mahé", "Mahé", "Seychelles", "Océan Indien", "Paris", 9, 4, "Petit-déjeuner", 1990, 10, 9.1, 380, ["Océan Indien", "Coup de cœur"]],
  ["zanzibar-nungwi", "sejours", "tout_compris", "Plage de Nungwi, au nord de Zanzibar", "Zanzibar", "Tanzanie", "Océan Indien", "Paris", 9, 4, "Tout compris", 1390, 12, 8.7, 540, ["Océan Indien", "Tout compris"]],
  ["maldives-male-sud", "sejours", "tout_compris", "Bungalow sur pilotis, atoll de Malé Sud", "Malé", "Maldives", "Océan Indien", "Paris", 9, 5, "Tout compris", 2490, 10, 9.3, 720, ["Luxe", "Romantique"]],
  ["reunion-saint-gilles", "sejours", "vol_hotel", "Lagon de Saint-Gilles, à La Réunion", "Saint-Gilles-les-Bains", "La Réunion", "Océan Indien", "Paris", 9, 4, "Petit-déjeuner", 1190, 10, 8.6, 520, ["Nature", "Randonnée"]],
  ["senegal-saly-petite-cote", "sejours", "tout_compris", "Petite Côte, à Saly", "Saly", "Sénégal", "Atlantique", "Paris", 7, 4, "Tout compris", 899, 10, 8.2, 380, ["Tout compris", "Soleil d'hiver"]],
  ["kenya-diani-beach", "sejours", "tout_compris", "Diani Beach, au sud de Mombasa", "Mombasa", "Kenya", "Afrique de l'Est", "Paris", 9, 4, "Tout compris", 1590, 10, 8.6, 290, ["Tout compris"]],

  // ---- Séjours : Caraïbes et Amériques ----
  ["punta-cana-bavaro", "sejours", "tout_compris", "Pieds dans le sable à Bávaro", "Punta Cana", "République dominicaine", "Caraïbes", "Paris", 9, 5, "Tout compris", 1290, 15, 8.8, 1655, ["Tout compris", "Vente flash"]],
  ["riviera-maya-tout-compris", "sejours", "tout_compris", "Resort tout compris en Riviera Maya", "Riviera Maya", "Mexique", "Caraïbes", "Paris", 9, 5, "Tout compris", 1390, 12, 9.0, 843, ["Tout compris", "Longue distance"]],
  ["cancun-zona-hotelera", "sejours", "tout_compris", "Zona Hotelera, à Cancún", "Cancún", "Mexique", "Caraïbes", "Paris", 9, 4, "Tout compris", 1290, 10, 8.6, 690, ["Tout compris"]],
  ["varadero-presqu-ile", "sejours", "tout_compris", "Presqu'île de Varadero", "Varadero", "Cuba", "Caraïbes", "Paris", 9, 4, "Tout compris", 1190, 10, 8.4, 610, ["Tout compris"]],
  ["jamaique-montego-bay", "sejours", "tout_compris", "Baie de Montego, côte nord", "Montego Bay", "Jamaïque", "Caraïbes", "Paris", 9, 4, "Tout compris", 1490, 10, 8.5, 340, ["Tout compris"]],
  ["guadeloupe-sainte-anne", "sejours", "vol_hotel", "Plage de Sainte-Anne, en Grande-Terre", "Sainte-Anne", "Guadeloupe", "Caraïbes", "Paris", 9, 3, "Petit-déjeuner", 990, 10, 8.3, 880, ["Antilles françaises"]],
  ["martinique-trois-ilets", "sejours", "vol_hotel", "Anse Mitan, aux Trois-Îlets", "Les Trois-Îlets", "Martinique", "Caraïbes", "Paris", 9, 3, "Petit-déjeuner", 1040, 10, 8.4, 760, ["Antilles françaises"]],

  // ---- Séjours : Asie et Moyen-Orient ----
  ["phuket-karon-beach", "sejours", "vol_hotel", "Karon Beach, à Phuket", "Phuket", "Thaïlande", "Asie du Sud-Est", "Paris", 10, 4, "Petit-déjeuner", 1090, 12, 8.6, 1240, ["Longue distance"]],
  ["krabi-ao-nang", "sejours", "vol_hotel", "Falaises d'Ao Nang, à Krabi", "Krabi", "Thaïlande", "Asie du Sud-Est", "Paris", 10, 4, "Petit-déjeuner", 1150, 10, 8.7, 690, ["Longue distance", "Nature"]],
  ["bali-seminyak-villa", "sejours", "vol_hotel", "Villa avec piscine à Seminyak", "Seminyak", "Indonésie", "Asie du Sud-Est", "Paris", 11, 4, "Petit-déjeuner", 1290, 12, 8.8, 1420, ["Longue distance", "Coup de cœur"]],
  ["sri-lanka-bentota", "sejours", "vol_hotel", "Plage de Bentota, côte sud-ouest", "Bentota", "Sri Lanka", "Océan Indien", "Paris", 10, 4, "Demi-pension", 1190, 10, 8.5, 410, ["Longue distance"]],
  ["dubai-jumeirah-beach", "sejours", "vol_hotel", "Jumeirah Beach, à Dubaï", "Dubaï", "Émirats arabes unis", "Moyen-Orient", "Paris", 6, 5, "Petit-déjeuner", 990, 10, 9.0, 1402, ["Luxe", "Ville"]],

  // ---- Circuits ----
  ["maroc-villes-imperiales", "circuits", "circuit_accompagne", "Les villes impériales du Maroc", "Marrakech", "Maroc", "Afrique du Nord", "Paris", 7, 4, "Demi-pension", 699, 10, 8.6, 940, ["Guide francophone"]],
  ["maroc-desert-merzouga", "circuits", "circuit_accompagne", "Du Haut Atlas aux dunes de Merzouga", "Ouarzazate", "Maroc", "Afrique du Nord", "Paris", 7, 3, "Pension complète", 749, 10, 8.7, 420, ["Guide francophone", "Désert"]],
  ["egypte-caire-croisiere-nil", "circuits", "circuit_accompagne", "Le Caire et croisière sur le Nil", "Le Caire", "Égypte", "Mer Rouge", "Paris", 7, 4, "Pension complète", 899, 12, 8.8, 1210, ["Guide francophone", "Vente flash"]],
  ["jordanie-petra-wadi-rum", "circuits", "circuit_accompagne", "Petra, Wadi Rum et mer Morte", "Amman", "Jordanie", "Moyen-Orient", "Paris", 7, 4, "Demi-pension", 1290, 10, 9.0, 480, ["Guide francophone", "Coup de cœur"]],
  ["turquie-istanbul-cappadoce", "circuits", "circuit_accompagne", "Istanbul et la Cappadoce", "Istanbul", "Turquie", "Méditerranée", "Paris", 7, 4, "Demi-pension", 899, 10, 8.7, 620, ["Guide francophone"]],
  ["grece-athenes-peloponnese", "circuits", "circuit_accompagne", "Athènes et le Péloponnèse", "Athènes", "Grèce", "Îles grecques", "Paris", 7, 4, "Demi-pension", 949, 10, 8.5, 410, ["Guide francophone"]],
  ["italie-rome-florence-toscane", "circuits", "circuit_accompagne", "Rome, Florence et la Toscane", "Rome", "Italie", "Europe", "Paris", 7, 4, "Petit-déjeuner", 1090, 10, 8.6, 530, ["Guide francophone"]],
  ["espagne-andalousie-circuit", "circuits", "circuit_accompagne", "Andalousie, de Séville à Grenade", "Séville", "Espagne", "Europe", "Paris", 7, 4, "Demi-pension", 849, 10, 8.7, 780, ["Guide francophone"]],
  ["portugal-lisbonne-porto-circuit", "circuits", "circuit_accompagne", "Le Portugal de Lisbonne à Porto", "Lisbonne", "Portugal", "Atlantique", "Paris", 7, 4, "Petit-déjeuner", 899, 10, 8.6, 690, ["Guide francophone"]],
  ["islande-cercle-or", "circuits", "circuit_accompagne", "Islande, cercle d'or et côte sud", "Reykjavik", "Islande", "Europe du Nord", "Paris", 7, 3, "Petit-déjeuner", 1690, 10, 9.0, 340, ["Nature", "Coup de cœur"]],
  ["ecosse-highlands", "circuits", "circuit_accompagne", "Édimbourg et les Highlands", "Édimbourg", "Royaume-Uni", "Europe du Nord", "Paris", 7, 3, "Petit-déjeuner", 1290, 10, 8.7, 290, ["Guide francophone", "Nature"]],
  ["irlande-anneau-du-kerry", "circuits", "circuit_accompagne", "L'Irlande et l'anneau du Kerry", "Dublin", "Irlande", "Europe du Nord", "Paris", 7, 3, "Petit-déjeuner", 1190, 10, 8.5, 260, ["Guide francophone", "Nature"]],
  ["croatie-dalmatie", "circuits", "circuit_accompagne", "La Dalmatie, de Split à Dubrovnik", "Split", "Croatie", "Méditerranée", "Paris", 7, 4, "Demi-pension", 1090, 10, 8.6, 380, ["Guide francophone"]],
  ["albanie-autotour", "circuits", "circuit_libre", "L'Albanie en autotour, de Tirana à Sarandë", "Tirana", "Albanie", "Méditerranée", "Paris", 8, 3, "Petit-déjeuner", 419, 10, 8.4, 210, ["Autotour", "Petit prix"]],
  ["sicile-autotour", "circuits", "circuit_libre", "La Sicile en autotour", "Catane", "Italie", "Méditerranée", "Paris", 8, 3, "Petit-déjeuner", 749, 10, 8.5, 340, ["Autotour"]],
  ["japon-tokyo-kyoto-osaka", "circuits", "circuit_accompagne", "Japon essentiel : Tokyo, Kyoto, Osaka", "Tokyo", "Japon", "Asie", "Paris", 11, 4, "Demi-pension", 2890, 10, 9.3, 512, ["Longue distance", "Guide francophone"]],
  ["vietnam-nord-au-sud", "circuits", "circuit_accompagne", "Le Vietnam du nord au sud", "Hanoï", "Vietnam", "Asie du Sud-Est", "Paris", 12, 4, "Pension complète", 2190, 12, 9.0, 430, ["Longue distance", "Guide francophone"]],
  ["thailande-bangkok-nord", "circuits", "circuit_accompagne", "Bangkok et le nord de la Thaïlande", "Bangkok", "Thaïlande", "Asie du Sud-Est", "Paris", 11, 4, "Demi-pension", 1890, 10, 8.8, 620, ["Longue distance", "Guide francophone"]],
  ["cambodge-angkor", "circuits", "circuit_accompagne", "Angkor et le lac Tonlé Sap", "Siem Reap", "Cambodge", "Asie du Sud-Est", "Paris", 9, 4, "Demi-pension", 1990, 10, 8.9, 240, ["Longue distance", "Guide francophone"]],
  ["inde-rajasthan", "circuits", "circuit_accompagne", "Le Rajasthan, du désert aux palais", "Jaipur", "Inde", "Asie", "Paris", 11, 4, "Pension complète", 1790, 12, 8.7, 350, ["Longue distance", "Guide francophone"]],
  ["sri-lanka-triangle-culturel", "circuits", "circuit_accompagne", "Sri Lanka, triangle culturel et plantations de thé", "Colombo", "Sri Lanka", "Océan Indien", "Paris", 10, 4, "Demi-pension", 1690, 10, 8.8, 280, ["Longue distance", "Guide francophone"]],
  ["chine-pekin-xian-shanghai", "circuits", "circuit_accompagne", "Chine impériale : Pékin, Xi'an, Shanghai", "Pékin", "Chine", "Asie", "Paris", 11, 4, "Pension complète", 2290, 10, 8.6, 190, ["Longue distance", "Guide francophone"]],
  ["ouzbekistan-route-de-la-soie", "circuits", "circuit_accompagne", "L'Ouzbékistan, sur la route de la Soie", "Tachkent", "Ouzbékistan", "Asie", "Paris", 9, 4, "Pension complète", 1890, 10, 8.9, 150, ["Guide francophone", "Coup de cœur"]],
  ["perou-machu-picchu", "circuits", "circuit_accompagne", "Pérou, du Machu Picchu au lac Titicaca", "Cusco", "Pérou", "Amérique du Sud", "Paris", 12, 4, "Demi-pension", 3190, 10, 9.1, 220, ["Longue distance", "Guide francophone"]],
  ["bresil-rio-iguacu-bahia", "circuits", "circuit_accompagne", "Brésil : Rio, Iguaçu et Salvador de Bahia", "Rio de Janeiro", "Brésil", "Amérique du Sud", "Paris", 11, 4, "Petit-déjeuner", 2890, 10, 8.8, 180, ["Longue distance"]],
  ["costa-rica-deux-oceans", "circuits", "circuit_accompagne", "Costa Rica, volcans et deux océans", "San José", "Costa Rica", "Amérique du Sud", "Paris", 11, 3, "Demi-pension", 2790, 10, 9.0, 210, ["Longue distance", "Nature"]],
  ["argentine-patagonie", "circuits", "circuit_accompagne", "Argentine, de Buenos Aires à la Patagonie", "Buenos Aires", "Argentine", "Amérique du Sud", "Paris", 13, 4, "Petit-déjeuner", 3490, 10, 8.9, 140, ["Longue distance"]],
  ["canada-est-ete-indien", "circuits", "circuit_accompagne", "L'est canadien à l'été indien", "Montréal", "Canada", "Amérique du Nord", "Paris", 9, 3, "Petit-déjeuner", 2490, 10, 8.9, 320, ["Longue distance", "Guide francophone"]],
  ["usa-ouest-americain", "circuits", "circuit_libre", "L'Ouest américain, de Las Vegas à San Francisco", "Las Vegas", "États-Unis", "Amérique du Nord", "Paris", 12, 3, "Petit-déjeuner", 2690, 10, 8.8, 410, ["Longue distance", "Autotour"]],
  ["afrique-du-sud-cap-safari", "circuits", "circuit_accompagne", "Afrique du Sud : Le Cap, route des jardins et safari", "Le Cap", "Afrique du Sud", "Afrique australe", "Paris", 11, 4, "Demi-pension", 2990, 10, 9.0, 190, ["Longue distance", "Safari"]],
  ["kenya-safari-masai-mara", "circuits", "circuit_accompagne", "Safari au Masai Mara et au lac Nakuru", "Nairobi", "Kenya", "Afrique de l'Est", "Paris", 8, 4, "Pension complète", 2590, 10, 9.1, 160, ["Safari", "Coup de cœur"]],
  ["tanzanie-serengeti-zanzibar", "circuits", "circuit_accompagne", "Serengeti, Ngorongoro et Zanzibar", "Arusha", "Tanzanie", "Afrique de l'Est", "Paris", 11, 4, "Pension complète", 3290, 10, 9.2, 130, ["Safari", "Longue distance"]],

  // ---- Croisières ----
  ["mediterranee-occidentale-marseille", "croisieres", "croisiere_maritime", "Méditerranée occidentale au départ de Marseille", "Marseille", "France", "Méditerranée", "Marseille", 7, 4, "Pension complète", 749, 10, 8.6, 2233, ["Best-seller"]],
  ["mediterranee-orientale-athenes", "croisieres", "croisiere_maritime", "Méditerranée orientale au départ d'Athènes", "Athènes", "Grèce", "Méditerranée", "Paris", 7, 4, "Pension complète", 829, 10, 8.5, 940, ["Méditerranée"]],
  ["iles-grecques-cyclades", "croisieres", "croisiere_maritime", "Cyclades et côtes turques", "Athènes", "Grèce", "Îles grecques", "Paris", 7, 4, "Pension complète", 899, 10, 8.7, 1188, ["Îles grecques"]],
  ["caraibes-orientales-miami", "croisieres", "croisiere_maritime", "Îles des Caraïbes orientales", "Miami", "États-Unis", "Caraïbes", "Paris", 8, 5, "Tout compris", 1580, 10, 8.8, 921, ["Longue distance", "Tout compris"]],
  ["fjords-norvege-cap-nord", "croisieres", "croisiere_maritime", "Fjords de Norvège et cap Nord", "Bergen", "Norvège", "Europe du Nord", "Paris", 9, 5, "Pension complète", 1590, 10, 9.1, 654, ["Nature", "Coup de cœur"]],
  ["canaries-madere-croisiere", "croisieres", "croisiere_maritime", "Canaries et Madère en hiver", "Las Palmas", "Espagne", "Canaries", "Paris", 7, 4, "Pension complète", 749, 10, 8.3, 742, ["Soleil d'hiver"]],
  ["baltique-capitales", "croisieres", "croisiere_maritime", "Les capitales de la Baltique", "Copenhague", "Danemark", "Europe du Nord", "Paris", 8, 4, "Pension complète", 1290, 10, 8.6, 380, ["Europe du Nord"]],
  ["emirats-oman-dubai", "croisieres", "croisiere_maritime", "Émirats et Oman au départ de Dubaï", "Dubaï", "Émirats arabes unis", "Moyen-Orient", "Paris", 7, 5, "Pension complète", 1090, 10, 8.7, 290, ["Soleil d'hiver"]],
  ["alaska-glaciers-vancouver", "croisieres", "croisiere_maritime", "Alaska et glaciers au départ de Vancouver", "Vancouver", "Canada", "Amérique du Nord", "Paris", 8, 5, "Pension complète", 2290, 10, 9.0, 180, ["Longue distance", "Nature"]],
  ["transatlantique-barcelone", "croisieres", "croisiere_maritime", "Transatlantique, de Barcelone aux Caraïbes", "Barcelone", "Espagne", "Atlantique", "Paris", 14, 4, "Pension complète", 1290, 12, 8.5, 210, ["Longue distance"]],
  ["danube-passau-budapest", "croisieres", "croisiere_fluviale", "Le Danube, de Passau à Budapest", "Passau", "Allemagne", "Fluvial", "Paris", 6, 4, "Pension complète", 1090, 10, 8.9, 480, ["Fluvial"]],
  ["rhin-amsterdam-bale", "croisieres", "croisiere_fluviale", "Le Rhin romantique, d'Amsterdam à Bâle", "Amsterdam", "Pays-Bas", "Fluvial", "Paris", 7, 4, "Pension complète", 1190, 10, 8.8, 320, ["Fluvial"]],
  ["seine-paris-honfleur", "croisieres", "croisiere_fluviale", "La Seine, de Paris à Honfleur", "Paris", "France", "Fluvial", "Paris", 5, 4, "Pension complète", 990, 10, 8.7, 410, ["Fluvial", "France"]],
  ["rhone-lyon-avignon", "croisieres", "croisiere_fluviale", "Le Rhône, de Lyon à Avignon", "Lyon", "France", "Fluvial", "Lyon", 5, 4, "Pension complète", 940, 10, 8.6, 350, ["Fluvial", "France"]],
  ["douro-porto-vignobles", "croisieres", "croisiere_fluviale", "Le Douro et ses vignobles en terrasses", "Porto", "Portugal", "Fluvial", "Paris", 7, 4, "Pension complète", 1490, 10, 9.0, 260, ["Fluvial", "Coup de cœur"]],
  ["nil-louxor-assouan", "croisieres", "croisiere_fluviale", "Le Nil, de Louxor à Assouan", "Louxor", "Égypte", "Fluvial", "Paris", 7, 5, "Pension complète", 1090, 12, 8.9, 690, ["Fluvial", "Guide francophone"]],

  // ---- Hôtels ----
  ["paris-marais-boutique", "hotels", "hotel_seul", "Boutique-hôtel au cœur du Marais", "Paris", "France", "France", "Paris", 2, 4, "Petit-déjeuner", 289, 10, 8.7, 3120, ["Ville", "France"]],
  ["paris-montmartre-charme", "hotels", "hotel_seul", "Hôtel de charme à Montmartre", "Paris", "France", "France", "Paris", 2, 3, "Petit-déjeuner", 199, 10, 8.4, 2410, ["Ville", "France"]],
  ["nice-promenade-des-anglais", "hotels", "hotel_seul", "Face à la Promenade des Anglais", "Nice", "France", "France", "Nice", 3, 4, "Petit-déjeuner", 349, 10, 8.4, 1544, ["France"]],
  ["lyon-presqu-ile", "hotels", "hotel_seul", "Presqu'île, entre Rhône et Saône", "Lyon", "France", "France", "Lyon", 2, 4, "Petit-déjeuner", 219, 10, 8.5, 980, ["Ville", "France"]],
  ["marseille-vieux-port", "hotels", "hotel_seul", "Vue sur le Vieux-Port", "Marseille", "France", "France", "Marseille", 2, 4, "Petit-déjeuner", 239, 10, 8.3, 870, ["Ville", "France"]],
  ["bordeaux-chartrons", "hotels", "hotel_seul", "Dans le quartier des Chartrons", "Bordeaux", "France", "France", "Bordeaux", 2, 4, "Petit-déjeuner", 229, 10, 8.6, 640, ["Ville", "France"]],
  ["barcelone-eixample", "hotels", "hotel_seul", "Boutique-hôtel dans l'Eixample", "Barcelone", "Espagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 259, 10, 8.8, 3120, ["Ville"]],
  ["madrid-gran-via", "hotels", "hotel_seul", "Sur la Gran Vía", "Madrid", "Espagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 239, 10, 8.6, 1840, ["Ville"]],
  ["seville-santa-cruz", "hotels", "hotel_seul", "Patio andalou dans le quartier Santa Cruz", "Séville", "Espagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 219, 10, 8.9, 1210, ["Ville", "Coup de cœur"]],
  ["rome-trastevere", "hotels", "hotel_seul", "Maison d'hôtes au Trastevere", "Rome", "Italie", "Europe", "Paris", 3, 3, "Petit-déjeuner", 229, 10, 8.6, 2450, ["Ville"]],
  ["venise-cannaregio", "hotels", "hotel_seul", "Palais vénitien à Cannaregio", "Venise", "Italie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 349, 10, 8.7, 1620, ["Ville", "Romantique"]],
  ["florence-duomo", "hotels", "hotel_seul", "À deux pas du Duomo", "Florence", "Italie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 289, 10, 8.8, 1340, ["Ville"]],
  ["milan-brera", "hotels", "hotel_seul", "Dans le quartier de Brera", "Milan", "Italie", "Europe", "Paris", 2, 4, "Petit-déjeuner", 249, 10, 8.5, 910, ["Ville"]],
  ["lisbonne-alfama", "hotels", "hotel_seul", "Vue sur le Tage depuis l'Alfama", "Lisbonne", "Portugal", "Atlantique", "Paris", 3, 4, "Petit-déjeuner", 249, 10, 9.0, 1877, ["Ville", "Coup de cœur"]],
  ["porto-ribeira", "hotels", "hotel_seul", "Sur les quais de la Ribeira", "Porto", "Portugal", "Atlantique", "Paris", 3, 4, "Petit-déjeuner", 219, 10, 8.9, 1460, ["Ville"]],
  ["amsterdam-canaux", "hotels", "hotel_seul", "Hôtel design le long des canaux", "Amsterdam", "Pays-Bas", "Europe", "Paris", 3, 4, "Sans repas", 289, 10, 8.5, 1290, ["Ville"]],
  ["bruxelles-sablon", "hotels", "hotel_seul", "Dans le quartier du Sablon", "Bruxelles", "Belgique", "Europe", "Paris", 2, 4, "Petit-déjeuner", 189, 10, 8.3, 720, ["Ville"]],
  ["londres-south-bank", "hotels", "hotel_seul", "South Bank, face à la Tamise", "Londres", "Royaume-Uni", "Europe du Nord", "Paris", 3, 4, "Sans repas", 399, 10, 8.6, 2140, ["Ville"]],
  ["berlin-mitte", "hotels", "hotel_seul", "Mitte, à côté de l'île aux Musées", "Berlin", "Allemagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 229, 10, 8.4, 1080, ["Ville"]],
  ["prague-vieille-ville", "hotels", "hotel_seul", "Vieille ville, près du pont Charles", "Prague", "Tchéquie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 199, 10, 8.8, 1122, ["Ville"]],
  ["budapest-danube", "hotels", "hotel_seul", "Face au Danube, côté Pest", "Budapest", "Hongrie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 189, 10, 8.7, 940, ["Ville"]],
  ["vienne-ring", "hotels", "hotel_seul", "Sur le Ring, à Vienne", "Vienne", "Autriche", "Europe", "Paris", 3, 4, "Petit-déjeuner", 249, 10, 8.6, 810, ["Ville"]],
  ["dublin-temple-bar", "hotels", "hotel_seul", "À côté de Temple Bar", "Dublin", "Irlande", "Europe du Nord", "Paris", 3, 3, "Petit-déjeuner", 269, 10, 8.2, 690, ["Ville"]],
  ["istanbul-sultanahmet", "hotels", "hotel_seul", "Terrasse sur Sultanahmet", "Istanbul", "Turquie", "Méditerranée", "Paris", 4, 5, "Petit-déjeuner", 289, 10, 8.9, 2011, ["Ville", "Coup de cœur"]],
  ["marrakech-medina-riad", "hotels", "hotel_seul", "Riad traditionnel dans la médina", "Marrakech", "Maroc", "Afrique du Nord", "Paris", 4, 4, "Petit-déjeuner", 199, 10, 9.2, 986, ["Coup de cœur"]],
  ["dubai-marina-tour", "hotels", "hotel_seul", "Tour vitrée sur la Marina", "Dubaï", "Émirats arabes unis", "Moyen-Orient", "Paris", 5, 5, "Petit-déjeuner", 699, 10, 9.0, 1402, ["Luxe"]],
  ["new-york-midtown", "hotels", "hotel_seul", "Midtown, à dix minutes de Times Square", "New York", "États-Unis", "Amérique du Nord", "Paris", 4, 4, "Sans repas", 890, 10, 8.5, 1930, ["Ville", "Longue distance"]],

  // ---- Vols ----
  ["vol-paris-marrakech", "vols", "vol_seul", "Vol Paris-Marrakech aller-retour", "Marrakech", "Maroc", "Afrique du Nord", "Paris", 0, 0, "Vol seul", 149, 10, 8.1, 4210, ["Vol direct"]],
  ["vol-paris-agadir", "vols", "vol_seul", "Vol Paris-Agadir aller-retour", "Agadir", "Maroc", "Afrique du Nord", "Paris", 0, 0, "Vol seul", 169, 10, 8.0, 2140, ["Vol direct"]],
  ["vol-paris-tunis", "vols", "vol_seul", "Vol Paris-Tunis aller-retour", "Tunis", "Tunisie", "Afrique du Nord", "Paris", 0, 0, "Vol seul", 139, 10, 7.9, 1890, ["Vol direct"]],
  ["vol-paris-djerba", "vols", "vol_seul", "Vol Paris-Djerba aller-retour", "Djerba", "Tunisie", "Afrique du Nord", "Paris", 0, 0, "Vol seul", 159, 10, 7.8, 980, ["Vol direct"]],
  ["vol-paris-le-caire", "vols", "vol_seul", "Vol Paris-Le Caire aller-retour", "Le Caire", "Égypte", "Mer Rouge", "Paris", 0, 0, "Vol seul", 289, 10, 8.0, 1240, ["Vol direct"]],
  ["vol-paris-lisbonne", "vols", "vol_seul", "Vol Paris-Lisbonne aller-retour", "Lisbonne", "Portugal", "Atlantique", "Paris", 0, 0, "Vol seul", 119, 10, 8.3, 5210, ["Vol direct"]],
  ["vol-paris-porto", "vols", "vol_seul", "Vol Paris-Porto aller-retour", "Porto", "Portugal", "Atlantique", "Paris", 0, 0, "Vol seul", 109, 10, 8.2, 3410, ["Vol direct", "Petit prix"]],
  ["vol-paris-barcelone", "vols", "vol_seul", "Vol Paris-Barcelone aller-retour", "Barcelone", "Espagne", "Europe", "Paris", 0, 0, "Vol seul", 99, 10, 8.2, 6120, ["Vol direct", "Petit prix"]],
  ["vol-paris-madrid", "vols", "vol_seul", "Vol Paris-Madrid aller-retour", "Madrid", "Espagne", "Europe", "Paris", 0, 0, "Vol seul", 109, 10, 8.1, 4380, ["Vol direct"]],
  ["vol-paris-rome", "vols", "vol_seul", "Vol Paris-Rome aller-retour", "Rome", "Italie", "Europe", "Paris", 0, 0, "Vol seul", 109, 10, 8.2, 4910, ["Vol direct"]],
  ["vol-paris-venise", "vols", "vol_seul", "Vol Paris-Venise aller-retour", "Venise", "Italie", "Europe", "Paris", 0, 0, "Vol seul", 119, 10, 8.1, 2310, ["Vol direct"]],
  ["vol-paris-athenes", "vols", "vol_seul", "Vol Paris-Athènes aller-retour", "Athènes", "Grèce", "Îles grecques", "Paris", 0, 0, "Vol seul", 149, 10, 8.2, 2740, ["Vol direct"]],
  ["vol-paris-istanbul", "vols", "vol_seul", "Vol Paris-Istanbul aller-retour", "Istanbul", "Turquie", "Méditerranée", "Paris", 0, 0, "Vol seul", 179, 10, 8.4, 2190, ["Vol direct"]],
  ["vol-paris-londres", "vols", "vol_seul", "Vol Paris-Londres aller-retour", "Londres", "Royaume-Uni", "Europe du Nord", "Paris", 0, 0, "Vol seul", 89, 10, 8.0, 7210, ["Vol direct", "Petit prix"]],
  ["vol-paris-amsterdam", "vols", "vol_seul", "Vol Paris-Amsterdam aller-retour", "Amsterdam", "Pays-Bas", "Europe", "Paris", 0, 0, "Vol seul", 99, 10, 8.1, 3120, ["Vol direct", "Petit prix"]],
  ["vol-paris-dublin", "vols", "vol_seul", "Vol Paris-Dublin aller-retour", "Dublin", "Irlande", "Europe du Nord", "Paris", 0, 0, "Vol seul", 119, 10, 8.0, 1640, ["Vol direct"]],
  ["vol-paris-reykjavik", "vols", "vol_seul", "Vol Paris-Reykjavik aller-retour", "Reykjavik", "Islande", "Europe du Nord", "Paris", 0, 0, "Vol seul", 219, 10, 8.3, 890, ["Vol direct"]],
  ["vol-paris-dubai", "vols", "vol_seul", "Vol Paris-Dubaï aller-retour", "Dubaï", "Émirats arabes unis", "Moyen-Orient", "Paris", 0, 0, "Vol seul", 449, 10, 8.6, 2410, ["Vol direct", "Longue distance"]],
  ["vol-paris-new-york", "vols", "vol_seul", "Vol Paris-New York aller-retour", "New York", "États-Unis", "Amérique du Nord", "Paris", 0, 0, "Vol seul", 449, 10, 8.4, 5120, ["Vol direct", "Longue distance"]],
  ["vol-paris-montreal", "vols", "vol_seul", "Vol Paris-Montréal aller-retour", "Montréal", "Canada", "Amérique du Nord", "Paris", 0, 0, "Vol seul", 499, 10, 8.3, 2840, ["Vol direct", "Longue distance"]],
  ["vol-paris-bangkok", "vols", "vol_seul", "Vol Paris-Bangkok aller-retour", "Bangkok", "Thaïlande", "Asie du Sud-Est", "Paris", 0, 0, "Vol seul", 649, 10, 8.5, 3210, ["Longue distance"]],
  ["vol-paris-tokyo", "vols", "vol_seul", "Vol Paris-Tokyo aller-retour", "Tokyo", "Japon", "Asie", "Paris", 0, 0, "Vol seul", 799, 10, 8.7, 1740, ["Vol direct", "Longue distance"]],
  ["vol-paris-bali", "vols", "vol_seul", "Vol Paris-Bali aller-retour", "Denpasar", "Indonésie", "Asie du Sud-Est", "Paris", 0, 0, "Vol seul", 799, 10, 8.4, 1290, ["Longue distance"]],
  ["vol-paris-cancun", "vols", "vol_seul", "Vol Paris-Cancún aller-retour", "Cancún", "Mexique", "Caraïbes", "Paris", 0, 0, "Vol seul", 699, 10, 8.3, 1610, ["Vol direct", "Longue distance"]],
  ["vol-paris-rio", "vols", "vol_seul", "Vol Paris-Rio de Janeiro aller-retour", "Rio de Janeiro", "Brésil", "Amérique du Sud", "Paris", 0, 0, "Vol seul", 749, 10, 8.2, 980, ["Vol direct", "Longue distance"]],
  ["vol-paris-pointe-a-pitre", "vols", "vol_seul", "Vol Paris-Pointe-à-Pitre aller-retour", "Pointe-à-Pitre", "Guadeloupe", "Caraïbes", "Paris", 0, 0, "Vol seul", 549, 10, 8.1, 3410, ["Vol direct", "Antilles françaises"]],
  ["vol-paris-fort-de-france", "vols", "vol_seul", "Vol Paris-Fort-de-France aller-retour", "Fort-de-France", "Martinique", "Caraïbes", "Paris", 0, 0, "Vol seul", 559, 10, 8.1, 3120, ["Vol direct", "Antilles françaises"]],
  ["vol-paris-saint-denis-reunion", "vols", "vol_seul", "Vol Paris-Saint-Denis de La Réunion aller-retour", "Saint-Denis", "La Réunion", "Océan Indien", "Paris", 0, 0, "Vol seul", 799, 10, 8.2, 2410, ["Vol direct", "Longue distance"]],
  ["vol-paris-dakar", "vols", "vol_seul", "Vol Paris-Dakar aller-retour", "Dakar", "Sénégal", "Atlantique", "Paris", 0, 0, "Vol seul", 449, 10, 8.0, 1180, ["Vol direct"]],
  ["vol-lyon-porto", "vols", "vol_seul", "Vol Lyon-Porto aller-retour", "Porto", "Portugal", "Atlantique", "Lyon", 0, 0, "Vol seul", 129, 10, 8.1, 940, ["Vol direct", "Petit prix"]],
  ["vol-marseille-casablanca", "vols", "vol_seul", "Vol Marseille-Casablanca aller-retour", "Casablanca", "Maroc", "Afrique du Nord", "Marseille", 0, 0, "Vol seul", 159, 10, 7.9, 820, ["Vol direct"]],
  ["vol-nice-londres", "vols", "vol_seul", "Vol Nice-Londres aller-retour", "Londres", "Royaume-Uni", "Europe du Nord", "Nice", 0, 0, "Vol seul", 99, 10, 8.0, 1340, ["Vol direct", "Petit prix"]],
  ["vol-toulouse-madrid", "vols", "vol_seul", "Vol Toulouse-Madrid aller-retour", "Madrid", "Espagne", "Europe", "Toulouse", 0, 0, "Vol seul", 109, 10, 7.9, 610, ["Vol direct"]],
  ["vol-bordeaux-seville", "vols", "vol_seul", "Vol Bordeaux-Séville aller-retour", "Séville", "Espagne", "Europe", "Bordeaux", 0, 0, "Vol seul", 119, 10, 8.0, 540, ["Vol direct"]],

  // ---- Camping ----
  ["camping-landes-biscarrosse", "camping-escapades", "camping", "Camping 5★ entre pins et océan", "Biscarrosse", "France", "France", "Bordeaux", 7, 5, "Sans repas", 429, 10, 8.6, 1340, ["Famille", "Piscine", "France"]],
  ["camping-ardeche-vallon", "camping-escapades", "camping", "Mobil-home au bord de l'Ardèche", "Vallon-Pont-d'Arc", "France", "France", "Lyon", 7, 4, "Sans repas", 389, 10, 8.4, 1105, ["Famille", "France"]],
  ["camping-var-frejus", "camping-escapades", "camping", "Résidence club à Fréjus", "Fréjus", "France", "France", "Marseille", 7, 4, "Demi-pension", 479, 10, 8.5, 762, ["Famille", "Piscine", "France"]],
  ["camping-vendee-saint-jean-de-monts", "camping-escapades", "camping", "Camping familial à Saint-Jean-de-Monts", "Saint-Jean-de-Monts", "France", "France", "Nantes", 7, 4, "Sans repas", 359, 10, 8.3, 890, ["Famille", "France"]],
  ["camping-royan-pins", "camping-escapades", "camping", "Pins et plage à Royan", "Royan", "France", "France", "Bordeaux", 7, 4, "Sans repas", 369, 10, 8.2, 640, ["Famille", "France"]],
  ["camping-cap-agde-aquatique", "camping-escapades", "camping", "Espace aquatique au Cap d'Agde", "Le Cap d'Agde", "France", "France", "Toulouse", 7, 4, "Sans repas", 399, 10, 8.1, 720, ["Famille", "Piscine", "France"]],
  ["camping-bretagne-benodet", "camping-escapades", "camping", "Bord de mer à Bénodet", "Bénodet", "France", "France", "Nantes", 7, 4, "Sans repas", 379, 10, 8.4, 510, ["Famille", "France"]],
  ["camping-corse-porto-vecchio", "camping-escapades", "camping", "Camping près des plages de Porto-Vecchio", "Porto-Vecchio", "France", "France", "Marseille", 7, 4, "Sans repas", 549, 10, 8.5, 430, ["France", "Nature"]],
  ["camping-costa-brava-lloret", "camping-escapades", "camping", "Village vacances sur la Costa Brava", "Lloret de Mar", "Espagne", "Méditerranée", "Paris", 7, 4, "Sans repas", 329, 10, 8.2, 980, ["Famille", "Petit prix"]],
  ["camping-toscane-viareggio", "camping-escapades", "camping", "Camping en Toscane, près de Viareggio", "Viareggio", "Italie", "Méditerranée", "Nice", 7, 4, "Sans repas", 449, 10, 8.3, 380, ["Famille"]],
  ["camping-croatie-porec", "camping-escapades", "camping", "Camping bord de mer à Poreč", "Poreč", "Croatie", "Méditerranée", "Paris", 7, 4, "Sans repas", 419, 10, 8.4, 340, ["Famille", "Nature"]],

  // ---- Escapades ----
  ["escapade-bruges", "camping-escapades", "week_end", "Week-end canaux et chocolat à Bruges", "Bruges", "Belgique", "Europe", "Paris", 2, 4, "Petit-déjeuner", 169, 10, 8.7, 690, ["Week-end", "Petit prix"]],
  ["escapade-prague", "camping-escapades", "week_end", "Trois nuits sur la Vltava", "Prague", "Tchéquie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 219, 10, 8.8, 1122, ["Week-end"]],
  ["escapade-amsterdam", "camping-escapades", "week_end", "Deux nuits le long des canaux", "Amsterdam", "Pays-Bas", "Europe", "Paris", 2, 4, "Petit-déjeuner", 229, 10, 8.5, 840, ["Week-end"]],
  ["escapade-barcelone", "camping-escapades", "week_end", "Barcelone en trois jours", "Barcelone", "Espagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 239, 10, 8.8, 1240, ["Week-end"]],
  ["escapade-seville", "camping-escapades", "week_end", "Séville en trois jours", "Séville", "Espagne", "Europe", "Paris", 3, 4, "Petit-déjeuner", 229, 10, 8.9, 875, ["Week-end"]],
  ["escapade-porto", "camping-escapades", "week_end", "Porto, la ville et la vallée du Douro", "Porto", "Portugal", "Atlantique", "Paris", 3, 4, "Petit-déjeuner", 219, 10, 8.9, 690, ["Week-end"]],
  ["escapade-lisbonne", "camping-escapades", "week_end", "Lisbonne en long week-end", "Lisbonne", "Portugal", "Atlantique", "Paris", 3, 4, "Petit-déjeuner", 239, 10, 8.8, 910, ["Week-end"]],
  ["escapade-rome", "camping-escapades", "week_end", "Rome en trois jours", "Rome", "Italie", "Europe", "Paris", 3, 4, "Petit-déjeuner", 249, 10, 8.7, 1080, ["Week-end"]],
  ["escapade-venise", "camping-escapades", "week_end", "Venise, deux nuits hors saison", "Venise", "Italie", "Europe", "Paris", 2, 4, "Petit-déjeuner", 259, 10, 8.6, 720, ["Week-end", "Romantique"]],
  ["escapade-londres", "camping-escapades", "week_end", "Londres en long week-end", "Londres", "Royaume-Uni", "Europe du Nord", "Paris", 3, 4, "Sans repas", 329, 10, 8.5, 1340, ["Week-end"]],
  ["escapade-edimbourg", "camping-escapades", "week_end", "Édimbourg, la ville et son château", "Édimbourg", "Royaume-Uni", "Europe du Nord", "Paris", 3, 3, "Petit-déjeuner", 289, 10, 8.6, 420, ["Week-end"]],
  ["escapade-deauville", "camping-escapades", "week_end", "Bord de mer et thalasso à Deauville", "Deauville", "France", "France", "Paris", 2, 4, "Demi-pension", 299, 10, 8.5, 540, ["Week-end", "Spa", "France"]],
  ["escapade-annecy", "camping-escapades", "week_end", "Lac et vieille ville à Annecy", "Annecy", "France", "France", "Lyon", 2, 4, "Petit-déjeuner", 269, 10, 8.7, 480, ["Week-end", "France"]],
  ["escapade-colmar", "camping-escapades", "week_end", "Colmar et la route des vins", "Colmar", "France", "France", "Strasbourg", 2, 3, "Petit-déjeuner", 219, 10, 8.6, 390, ["Week-end", "France"]],
  ["escapade-biarritz", "camping-escapades", "week_end", "Biarritz, océan et thalasso", "Biarritz", "France", "France", "Bordeaux", 2, 4, "Demi-pension", 319, 10, 8.5, 610, ["Week-end", "Spa", "France"]],
  ["escapade-saint-malo", "camping-escapades", "week_end", "Saint-Malo intra-muros", "Saint-Malo", "France", "France", "Nantes", 2, 3, "Petit-déjeuner", 199, 10, 8.4, 520, ["Week-end", "France"]],

  // ---- Location de voiture ----
  ["voiture-malaga-compacte", "location-voiture", "location", "Compacte à l'aéroport de Malaga", "Malaga", "Espagne", "Méditerranée", "Paris", 7, 0, "Sans repas", 129, 10, 8.3, 2210, ["Annulation gratuite"]],
  ["voiture-faro-citadine", "location-voiture", "location", "Citadine à Faro, kilométrage illimité", "Faro", "Portugal", "Atlantique", "Paris", 7, 0, "Sans repas", 109, 10, 8.5, 1740, ["Annulation gratuite", "Petit prix"]],
  ["voiture-palma-compacte", "location-voiture", "location", "Compacte à Palma de Majorque", "Palma de Majorque", "Espagne", "Baléares", "Paris", 7, 0, "Sans repas", 139, 10, 8.2, 1420, ["Annulation gratuite"]],
  ["voiture-tenerife-suv", "location-voiture", "location", "SUV à Ténérife Sud", "Ténérife", "Espagne", "Canaries", "Paris", 7, 0, "Sans repas", 189, 10, 8.4, 890, ["Annulation gratuite"]],
  ["voiture-lanzarote-citadine", "location-voiture", "location", "Citadine à Arrecife", "Lanzarote", "Espagne", "Canaries", "Paris", 7, 0, "Sans repas", 129, 10, 8.3, 640, ["Annulation gratuite"]],
  ["voiture-reykjavik-4x4", "location-voiture", "location", "4x4 à Reykjavik, assurance incluse", "Reykjavik", "Islande", "Europe du Nord", "Paris", 8, 0, "Sans repas", 690, 10, 8.7, 460, ["Nature"]],
  ["voiture-athenes-compacte", "location-voiture", "location", "Compacte à l'aéroport d'Athènes", "Athènes", "Grèce", "Îles grecques", "Paris", 7, 0, "Sans repas", 159, 10, 8.1, 720, ["Annulation gratuite"]],
  ["voiture-heraklion-citadine", "location-voiture", "location", "Citadine à Héraklion", "Crète", "Grèce", "Îles grecques", "Paris", 7, 0, "Sans repas", 149, 10, 8.2, 810, ["Annulation gratuite"]],
  ["voiture-catane-compacte", "location-voiture", "location", "Compacte à Catane, en Sicile", "Catane", "Italie", "Méditerranée", "Paris", 7, 0, "Sans repas", 169, 10, 8.0, 590, ["Annulation gratuite"]],
  ["voiture-naples-citadine", "location-voiture", "location", "Citadine à Naples", "Naples", "Italie", "Europe", "Paris", 7, 0, "Sans repas", 159, 10, 7.9, 480, ["Annulation gratuite"]],
  ["voiture-lisbonne-compacte", "location-voiture", "location", "Compacte à Lisbonne", "Lisbonne", "Portugal", "Atlantique", "Paris", 7, 0, "Sans repas", 139, 10, 8.4, 1120, ["Annulation gratuite"]],
  ["voiture-marrakech-suv", "location-voiture", "location", "SUV à Marrakech Ménara", "Marrakech", "Maroc", "Afrique du Nord", "Paris", 7, 0, "Sans repas", 219, 10, 8.1, 540, ["Annulation gratuite"]],
  ["voiture-dubai-berline", "location-voiture", "location", "Berline à Dubaï", "Dubaï", "Émirats arabes unis", "Moyen-Orient", "Paris", 7, 0, "Sans repas", 249, 10, 8.5, 390, ["Annulation gratuite"]],
  ["voiture-miami-suv", "location-voiture", "location", "SUV à Miami International", "Miami", "États-Unis", "Amérique du Nord", "Paris", 7, 0, "Sans repas", 329, 10, 8.2, 610, ["Annulation gratuite"]],
  ["voiture-fort-de-france-suv", "location-voiture", "location", "SUV à Fort-de-France", "Fort-de-France", "Martinique", "Caraïbes", "Paris", 10, 0, "Sans repas", 429, 10, 8.2, 615, ["Antilles françaises"]],
  ["voiture-pointe-a-pitre-compacte", "location-voiture", "location", "Compacte à Pointe-à-Pitre", "Pointe-à-Pitre", "Guadeloupe", "Caraïbes", "Paris", 10, 0, "Sans repas", 399, 10, 8.3, 580, ["Antilles françaises"]],
  ["voiture-nice-cabriolet", "location-voiture", "location", "Cabriolet à Nice Côte d'Azur", "Nice", "France", "France", "Nice", 5, 0, "Sans repas", 259, 10, 8.4, 420, ["France"]],
  ["voiture-ajaccio-compacte", "location-voiture", "location", "Compacte à Ajaccio", "Ajaccio", "France", "France", "Marseille", 7, 0, "Sans repas", 209, 10, 8.3, 470, ["France", "Annulation gratuite"]],

  // ---- Parcs de loisirs ----
  ["disneyland-paris-2-jours", "parcs-loisirs", "", "Disneyland Paris, 2 jours et 1 nuit", "Marne-la-Vallée", "France", "France", "Paris", 1, 3, "Petit-déjeuner", 249, 10, 8.5, 2140, ["Famille", "France"]],
  ["parc-asterix-sejour", "parcs-loisirs", "", "Parc Astérix, 2 jours et 1 nuit", "Plailly", "France", "France", "Paris", 1, 3, "Petit-déjeuner", 179, 10, 8.4, 940, ["Famille", "France"]],
  ["puy-du-fou-sejour", "parcs-loisirs", "", "Le Puy du Fou, 2 jours et 1 nuit", "Les Epesses", "France", "France", "Nantes", 1, 3, "Petit-déjeuner", 229, 10, 9.1, 1610, ["Famille", "France", "Coup de cœur"]],
  ["futuroscope-sejour", "parcs-loisirs", "", "Futuroscope, 2 jours et 1 nuit", "Poitiers", "France", "France", "Paris", 1, 3, "Petit-déjeuner", 189, 10, 8.6, 880, ["Famille", "France"]],
  ["portaventura-salou", "parcs-loisirs", "", "PortAventura World, 3 jours et 2 nuits", "Salou", "Espagne", "Méditerranée", "Paris", 2, 4, "Petit-déjeuner", 289, 10, 8.5, 720, ["Famille"]],
  ["europa-park-rust", "parcs-loisirs", "", "Europa-Park, 3 jours et 2 nuits", "Rust", "Allemagne", "Europe", "Strasbourg", 2, 4, "Petit-déjeuner", 319, 10, 8.9, 640, ["Famille", "Coup de cœur"]],
  ["orlando-parcs-semaine", "parcs-loisirs", "", "Orlando, une semaine au pays des parcs", "Orlando", "États-Unis", "Amérique du Nord", "Paris", 7, 3, "Sans repas", 1290, 10, 8.7, 410, ["Famille", "Longue distance"]],
];

// ---------------------------------------------------------------------------
// Dérivation des offres complètes
// ---------------------------------------------------------------------------

/**
 * Durée en jours.
 *
 * Un vol se compte en trajet, une location en jours de mise à disposition, un
 * séjour en jours calendaires : une nuit de plus que de nuitées, le jour du
 * retour comptant dans la durée annoncée.
 */
function daysFor(category: string, nights: number): number {
  if (category === "vols") return 1;
  if (category === "location-voiture") return nights;
  return nights + 1;
}

const AMENITIES_BY_SUBTYPE: Record<string, string[]> = {
  tout_compris: ["Repas et boissons inclus", "Piscine", "Animations", "Club enfants", "Wi-Fi gratuit"],
  vol_hotel: ["Piscine", "Wi-Fi gratuit", "Climatisation", "Restaurant", "Transfert aéroport"],
  hotel_seul: ["Wi-Fi gratuit", "Climatisation", "Petit-déjeuner buffet", "Bar", "Réception 24 h/24"],
  vol_seul: ["Bagage cabine", "Enregistrement en ligne", "Choix du siège"],
  circuit_accompagne: ["Guide francophone", "Transferts inclus", "Entrées des sites", "Autocar climatisé"],
  circuit_libre: ["Véhicule de location", "Hébergements réservés", "Feuille de route détaillée"],
  croisiere_maritime: ["Pont piscine", "Spectacles", "Restaurants inclus", "Salle de sport", "Excursions"],
  croisiere_fluviale: ["Cabine extérieure", "Pension complète", "Conférences à bord", "Vélos à disposition"],
  camping: ["Piscine chauffée", "Club enfants", "Animations", "Parking", "Aire de jeux"],
  week_end: ["Wi-Fi gratuit", "Petit-déjeuner", "Centre-ville", "Annulation flexible"],
  location: ["Kilométrage illimité", "Annulation gratuite", "2e conducteur", "Climatisation"],
};

const AMENITIES_BY_CATEGORY: Record<string, string[]> = {
  "parcs-loisirs": ["Billet d'entrée inclus", "Hôtel à proximité", "Parking", "Accès anticipé"],
};

function describe(o: RawOffer): string {
  const [, category, subtype, title, city, country, , departureCity, nights, , board] = o;
  switch (category) {
    case "vols":
      return `${title} au départ de ${departureCity}. Tarif par personne, taxes et frais de service compris, sur une sélection de compagnies régulières et à bas coût.`;
    case "location-voiture":
      return `${title}. Prise en charge à ${city} (${country}), ${nights} jours de location avec assurance de base, kilométrage illimité et annulation gratuite jusqu'à 48 heures avant le départ.`;
    case "croisieres":
      return subtype === "croisiere_fluviale"
        ? `${title}. ${nights + 1} jours à bord en ${board.toLowerCase()}, cabine extérieure, escales quotidiennes et conférences à bord.`
        : `${title}. ${nights + 1} jours de navigation en ${board.toLowerCase()}, escales et animations comprises, cabine au choix selon disponibilité.`;
    case "circuits":
      return subtype === "circuit_libre"
        ? `${title}. Un autotour de ${nights + 1} jours : véhicule, hébergements et feuille de route réservés, mais vous menez le voyage à votre rythme.`
        : `${title}. Un itinéraire de ${nights + 1} jours en petit groupe, guide francophone, transferts et visites principales inclus.`;
    case "parcs-loisirs":
      return `${title}. Billets d'entrée et hébergement réservés ensemble, à ${city}. L'entrée au parc est comprise pour toute la durée du séjour.`;
    case "hotels":
      return `${title}. ${nights} nuit${nights > 1 ? "s" : ""} à ${city} en ${board.toLowerCase()}, confirmation immédiate et annulation possible sur une sélection de chambres.`;
    default:
      return `${title}, à ${city} (${country}). ${nights} nuits en ${board.toLowerCase()}, vol au départ de ${departureCity} et assistance francophone pendant tout le séjour.`;
  }
}

function highlightsFor(o: RawOffer): string[] {
  const [, category, subtype, , city, , region, departureCity, nights] = o;
  const base: Record<string, string[]> = {
    tout_compris: [
      "Repas, boissons et snacks compris du premier au dernier jour",
      "Animations en journée et spectacles en soirée",
      `Vol aller-retour au départ de ${departureCity} et transferts inclus`,
    ],
    vol_hotel: [
      `Vol aller-retour vers ${city} inclus`,
      "Transfert entre l'aéroport et l'hébergement",
      "Chambre réservée avec annulation possible",
    ],
    hotel_seul: [
      "Emplacement central, tout se fait à pied",
      "Réservation confirmée immédiatement",
      "Paiement à l'arrivée sur une sélection de chambres",
    ],
    vol_seul: [
      "Comparaison des compagnies régulières et à bas coût",
      "Bagage cabine inclus sur la plupart des tarifs",
      "Modification possible selon les conditions du billet",
    ],
    circuit_accompagne: [
      "Groupe limité, pour garder un rythme agréable",
      "Guide francophone pendant tout le parcours",
      "Hébergements sélectionnés à chaque étape",
    ],
    circuit_libre: [
      "Voiture de location comprise sur toute la durée",
      "Étapes réservées, itinéraire modifiable",
      "Feuille de route et adresses testées",
    ],
    croisiere_maritime: [
      "Pension complète à bord du premier au dernier jour",
      "Escales quotidiennes, excursions en option",
      "Animations, spectacles et espaces piscine inclus",
    ],
    croisiere_fluviale: [
      "Cabine extérieure avec vue sur la berge",
      "Amarrage en centre-ville à chaque escale",
      "Pension complète et conférences à bord",
    ],
    camping: [
      "Mobil-home équipé pour 4 à 6 personnes",
      "Club enfants et animations en haute saison",
      "Espace aquatique en accès libre",
    ],
    week_end: [
      "Format court, du vendredi soir au dimanche",
      "Hébergement choisi pour sa proximité du centre",
      "Aucun congé à poser",
    ],
    location: [
      "Kilométrage illimité sur toute la durée",
      "Aucun frais caché au comptoir",
      "Annulation gratuite jusqu'à 48 heures avant",
    ],
  };

  const parcs = [
    "Billets d'entrée au parc compris",
    "Hébergement à quelques minutes de l'entrée",
    "Accès anticipé aux attractions selon l'hébergement",
  ];

  const chosen = category === "parcs-loisirs" ? parcs : (base[subtype] ?? []);
  const contexte =
    category === "vols"
      ? `Ligne au départ de ${departureCity}`
      : `Découverte de la région : ${region}`;
  const duree =
    category === "vols"
      ? "Aller-retour, dates flexibles selon disponibilité"
      : `${daysFor(category, nights)} jours sur place`;

  return [...chosen, contexte, duree];
}

function includedFor(category: string, subtype: string, board: Board): string[] {
  if (category === "vols") return ["Vol aller-retour", "Taxes d'aéroport", "Bagage cabine"];
  if (category === "location-voiture")
    return ["Location du véhicule", "Assurance responsabilité civile", "Kilométrage illimité"];
  if (category === "parcs-loisirs")
    return ["Billets d'entrée au parc", `Hébergement en ${board.toLowerCase()}`, "Taxes de séjour"];

  const commun = [
    `Hébergement en ${board.toLowerCase()}`,
    "Taxes et frais de dossier",
    "Assistance francophone 24 h/24",
  ];
  if (subtype === "hotel_seul" || subtype === "camping") return commun;
  if (subtype === "week_end") return ["Vol ou train aller-retour", ...commun];
  return ["Vol aller-retour", "Transferts", ...commun];
}

/**
 * Écarts au départ, en jours, appliqués en boucle au catalogue.
 *
 * Les valeurs sous le seuil des 21 jours alimentent Dernière Minute, les autres
 * s'étalent sur l'année. Les dates réelles sont calculées au moment du seed :
 * un catalogue daté en dur cesserait de déclencher le badge dès le lendemain.
 */
export const DEPARTURE_OFFSETS = [
  38, 12, 96, 6, 145, 61, 19, 220, 44, 9, 178, 75, 27, 120, 15, 260, 52, 88, 4, 310,
  33, 160, 23, 68, 195, 11, 105, 47, 240, 17,
];

/** Offre du catalogue source : la référence est attribuée par la base, pas ici. */
export type SourceOffer = Omit<Offer, "reference"> & {
  /** Départ dans N jours, converti en date réelle au moment du seed. */
  departureInDays: number;
  /** Remise appliquée au prix de référence, en pourcentage. */
  discount: number;
};

export const OFFERS: SourceOffer[] = RAW.map((o, index) => {
  const [slug, category, subtype, title, city, country, region, departureCity, nights, stars, board, referencePrice, discount, rating, reviews, tags] = o;

  // Le prix GoSéjour se déduit du prix marché, jamais l'inverse : c'est la
  // remise qui est la donnée commerciale, et l'arrondi à l'euro inférieur
  // évite d'afficher un prix supérieur à la promesse annoncée.
  const price = Math.floor(referencePrice * (1 - discount / 100));

  return {
    slug,
    category,
    subtype,
    title,
    destination: city,
    country,
    region,
    continent: continentOf(country),
    imageSeed: slug,
    days: daysFor(category, nights),
    nights,
    stars,
    board,
    departureCity,
    price,
    oldPrice: referencePrice,
    discount,
    rating,
    reviews,
    departureInDays: DEPARTURE_OFFSETS[index % DEPARTURE_OFFSETS.length],
    dates: "Départs garantis toute l'année, selon disponibilité",
    tags,
    amenities: AMENITIES_BY_SUBTYPE[subtype] ?? AMENITIES_BY_CATEGORY[category] ?? [],
    description: describe(o),
    highlights: highlightsFor(o),
    included: includedFor(category, subtype, board),
  };
});

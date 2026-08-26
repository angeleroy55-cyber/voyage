/**
 * Villes de départ et d'arrivée du moteur de recherche.
 *
 * Deux listes séparées, parce que ce ne sont pas les mêmes objets. Une ville de
 * départ est un aéroport desservi depuis lequel nos clients partent : la liste
 * est fermée, elle tient dans un menu déroulant, et une valeur absente doit
 * être refusée. Une ville d'arrivée est n'importe quel point du monde : la
 * liste est ouverte, elle sert de suggestions à un champ libre.
 */

export type PlaceGroup = { label: string; cities: string[] };

/**
 * Villes de départ, groupées comme le visiteur les cherche.
 *
 * Les groupes sont rendus en `<optgroup>` : une liste plate de soixante entrées
 * oblige à lire toute la liste, alors que « Grand Est » ou « Outre-mer » se
 * repère d'un coup d'œil. Paris est isolé en tête, c'est le départ de plus de la
 * moitié des recherches.
 */
export const DEPARTURE_GROUPS: PlaceGroup[] = [
  {
    label: "Île-de-France",
    cities: ["Paris", "Paris Beauvais"],
  },
  {
    label: "Nord et Est",
    cities: ["Lille", "Strasbourg", "Metz", "Nancy", "Mulhouse", "Reims", "Dijon", "Besançon"],
  },
  {
    label: "Ouest",
    cities: [
      "Nantes", "Rennes", "Brest", "Quimper", "Lorient", "Saint-Brieuc", "Dinard",
      "Caen", "Deauville", "Rouen", "Le Havre", "Angers", "Le Mans", "Tours",
    ],
  },
  {
    label: "Sud-Ouest",
    cities: [
      "Bordeaux", "Toulouse", "Biarritz", "Pau", "Bergerac", "La Rochelle",
      "Poitiers", "Limoges", "Agen", "Tarbes", "Rodez", "Brive",
    ],
  },
  {
    label: "Sud-Est et Méditerranée",
    cities: [
      "Nice", "Marseille", "Lyon", "Montpellier", "Toulon", "Perpignan",
      "Nîmes", "Avignon", "Béziers", "Carcassonne", "Grenoble", "Chambéry",
      "Clermont-Ferrand", "Saint-Étienne",
    ],
  },
  {
    label: "Corse",
    cities: ["Ajaccio", "Bastia", "Calvi", "Figari"],
  },
  {
    label: "Outre-mer",
    cities: [
      "Pointe-à-Pitre", "Fort-de-France", "Saint-Denis de La Réunion",
      "Cayenne", "Mamoudzou",
    ],
  },
  {
    label: "Belgique, Suisse et Luxembourg",
    cities: ["Bruxelles", "Charleroi", "Liège", "Genève", "Bâle", "Zurich", "Luxembourg"],
  },
];

/** Liste plate, pour la validation et les listes déroulantes simples. */
export const DEPARTURE_CITIES: string[] = DEPARTURE_GROUPS.flatMap((g) => g.cities);

/** Ville de départ par défaut, quand rien n'est détecté ni choisi. */
export const DEFAULT_DEPARTURE = "Paris";

/** La ville proposée est-elle une ville de départ connue ? */
export function isDepartureCity(value: string | undefined | null): boolean {
  return !!value && DEPARTURE_CITIES.includes(value);
}

/**
 * Destinations suggérées à la saisie.
 *
 * Elles alimentent un `<datalist>`, donc elles guident sans contraindre : le
 * visiteur peut taper une ville absente de la liste, la recherche fonctionnera
 * quand même. Y figurent les villes du catalogue et les grandes destinations
 * mondiales, celles qu'on tape en premier dans un moteur de voyage.
 */
export const WORLD_DESTINATIONS: string[] = [
  // France
  "Paris", "Nice", "Marseille", "Lyon", "Bordeaux", "Toulouse", "Biarritz",
  "Ajaccio", "Porto-Vecchio", "Annecy", "Colmar", "Deauville", "Saint-Malo",
  "La Rochelle", "Chamonix", "Cannes", "Saint-Tropez", "Avignon", "Carcassonne",
  // Espagne et Portugal
  "Barcelone", "Madrid", "Séville", "Valence", "Malaga", "Bilbao", "Grenade",
  "Palma de Majorque", "Ibiza", "Minorque", "Ténérife", "Fuerteventura",
  "Lanzarote", "Grande Canarie", "La Palma", "Torremolinos", "Lloret de Mar",
  "Alicante", "Saint-Sébastien", "Lisbonne", "Porto", "Madère", "Albufeira",
  "Faro", "Lagos", "Açores",
  // Italie, Grèce, Croatie, Malte, Chypre
  "Rome", "Venise", "Florence", "Milan", "Naples", "Turin", "Vérone", "Bologne",
  "Palerme", "Catane", "Taormine", "Olbia", "Cagliari", "Capri", "Amalfi",
  "Athènes", "Santorin", "Mykonos", "Crète", "Rhodes", "Corfou", "Kos", "Zante",
  "Dubrovnik", "Split", "Zadar", "Pula", "Sliema", "La Valette", "Larnaca",
  "Paphos", "Ayia Napa",
  // Europe du Nord et centrale
  "Londres", "Édimbourg", "Dublin", "Amsterdam", "Bruxelles", "Bruges",
  "Berlin", "Munich", "Hambourg", "Cologne", "Vienne", "Salzbourg", "Prague",
  "Budapest", "Cracovie", "Varsovie", "Copenhague", "Stockholm", "Oslo",
  "Bergen", "Helsinki", "Reykjavik", "Zurich", "Genève", "Bucarest", "Sofia",
  "Tirana", "Ljubljana", "Riga", "Vilnius", "Tallinn", "Porto Santo",
  // Afrique du Nord et Moyen-Orient
  "Marrakech", "Agadir", "Casablanca", "Fès", "Tanger", "Essaouira", "Rabat",
  "Ouarzazate", "Tunis", "Djerba", "Hammamet", "Sousse", "Monastir",
  "Le Caire", "Hurghada", "Charm el-Cheikh", "Louxor", "Marsa Alam", "Assouan",
  "Istanbul", "Antalya", "Cappadoce", "Bodrum", "Izmir", "Dubaï", "Abou Dabi",
  "Doha", "Mascate", "Amman", "Petra", "Aqaba", "Tel-Aviv", "Beyrouth",
  // Afrique subsaharienne et océan Indien
  "Île Maurice", "Seychelles", "Maldives", "Zanzibar", "La Réunion",
  "Madagascar", "Nosy Be", "Sal", "Boa Vista", "São Vicente", "Dakar", "Saly",
  "Nairobi", "Mombasa", "Le Cap", "Johannesburg", "Marrakesh", "Victoria",
  "Arusha", "Kilimandjaro", "Windhoek",
  // Amérique du Nord et Caraïbes
  "New York", "Miami", "Los Angeles", "San Francisco", "Las Vegas", "Orlando",
  "Chicago", "Boston", "Washington", "La Nouvelle-Orléans", "Montréal",
  "Québec", "Toronto", "Vancouver", "Cancún", "Riviera Maya", "Mexico",
  "Tulum", "Punta Cana", "Saint-Domingue", "La Havane", "Varadero",
  "Montego Bay", "Pointe-à-Pitre", "Fort-de-France", "Saint-Martin",
  "Sainte-Lucie", "Bahamas", "Barbade", "Aruba", "Curaçao",
  // Amérique du Sud
  "Rio de Janeiro", "São Paulo", "Salvador de Bahia", "Buenos Aires",
  "Santiago", "Lima", "Cusco", "Machu Picchu", "La Paz", "Bogota",
  "Carthagène", "San José", "Panama", "Quito", "Galápagos", "Montevideo",
  "Ushuaia", "Iguaçu",
  // Asie
  "Bangkok", "Phuket", "Krabi", "Koh Samui", "Chiang Mai", "Tokyo", "Kyoto",
  "Osaka", "Séoul", "Pékin", "Shanghai", "Hong Kong", "Singapour",
  "Kuala Lumpur", "Bali", "Java", "Lombok", "Hanoï", "Hô Chi Minh-Ville",
  "Baie d'Along", "Hoi An", "Siem Reap", "Phnom Penh", "Vientiane", "Colombo",
  "Delhi", "Jaipur", "Goa", "Kerala", "Katmandou", "Tachkent", "Samarcande",
  "Bakou", "Tbilissi", "Erevan",
  // Océanie
  "Sydney", "Melbourne", "Brisbane", "Auckland", "Queenstown", "Papeete",
  "Bora-Bora", "Moorea", "Nouméa", "Nadi", "Fidji",
];

/**
 * Traductions EN/ES du contenu catalogue, lues par `prisma/seed.ts`.
 *
 * Écrites à la main (catégories, destinations, articles), ou composées par un
 * petit générateur qui traduit le vocabulaire fini du catalogue (titres et
 * descriptions d'offres) : `src/lib/catalogue-source.ts` compose chaque titre
 * et chaque description à partir d'un nombre restreint de gabarits et de
 * mots-clés (type d'hébergement, pension, ville, pays) — traduire ce
 * vocabulaire une fois, plutôt que chacune des 469 offres, donne un résultat
 * fiable et vérifiable pour l'ensemble du catalogue.
 *
 * `country`/`region`/`destination` (valeurs de filtre, utilisées dans les URLs
 * `?q=`) ne sont volontairement PAS traduits ici : ce fichier ne traduit que
 * la présentation (titres, descriptions, blurbs), jamais les clés techniques.
 */

import type { SourceOffer } from "@/lib/catalogue-source";
import offerTitles from "@/lib/offer-title-translations.json";

// ---------------------------------------------------------------------------
// Catégories (15)
// ---------------------------------------------------------------------------

export const CATEGORY_TRANSLATIONS: Record<
  string,
  { en: { label: string; title: string; blurb: string }; es: { label: string; title: string; blurb: string } }
> = {
  "bons-plans-promos": {
    en: { label: "Deals", title: "Deals & Promotions", blurb: "All our discounted offers, across every type of trip." },
    es: { label: "Ofertas", title: "Ofertas y Promociones", blurb: "Todas nuestras ofertas a precio reducido, para cualquier tipo de viaje." },
  },
  "derniere-minute": {
    en: { label: "Last minute", title: "Last Minute", blurb: "Imminent departures, limited availability: the best deals right now." },
    es: { label: "Última hora", title: "Última Hora", blurb: "Salidas inminentes, plazas limitadas: las mejores ofertas del momento." },
  },
  destinations: {
    en: { label: "Destinations", title: "All destinations", blurb: "Continent, country, city: find your trip on the map." },
    es: { label: "Destinos", title: "Todos los destinos", blurb: "Continente, país, ciudad: encuentra tu viaje en el mapa." },
  },
  sejours: {
    en: { label: "Package holidays", title: "Package Holidays & Flight + Hotel", blurb: "Flight and hotel booked together, from a weekend to all-inclusive." },
    es: { label: "Estancias", title: "Estancias y Vuelo + Hotel", blurb: "Vuelo y hotel reservados juntos, desde un fin de semana hasta el todo incluido." },
  },
  circuits: {
    en: { label: "Tours", title: "Tours", blurb: "Guided itineraries to see the essentials without organising a thing." },
    es: { label: "Circuitos", title: "Circuitos", blurb: "Itinerarios guiados para ver lo esencial sin organizar nada." },
  },
  croisieres: {
    en: { label: "Cruises", title: "Cruises", blurb: "Mediterranean, Caribbean, fjords or rivers: set sail at the best price." },
    es: { label: "Cruceros", title: "Cruceros", blurb: "Mediterráneo, Caribe, fiordos o ríos: embárquese al mejor precio." },
  },
  hotels: {
    en: { label: "Hotels", title: "Hotels", blurb: "Negotiated rooms in more than 400,000 properties." },
    es: { label: "Hoteles", title: "Hoteles", blurb: "Habitaciones negociadas en más de 400 000 establecimientos." },
  },
  "camping-escapades": {
    en: { label: "Camping & Getaways", title: "Camping & Getaways", blurb: "Mobile homes, nature clubs and short breaks, no time off needed." },
    es: { label: "Camping y Escapadas", title: "Camping y Escapadas", blurb: "Casas móviles, clubes de naturaleza y escapadas cortas, sin pedir vacaciones." },
  },
  vols: {
    en: { label: "Flights", title: "Flights", blurb: "Compare 600 airlines in a single search." },
    es: { label: "Vuelos", title: "Vuelos", blurb: "Compare 600 aerolíneas en una sola búsqueda." },
  },
  "location-voiture": {
    en: { label: "Car rental", title: "Car Rental", blurb: "No hidden fees, free cancellation up to 48 hours before." },
    es: { label: "Alquiler de coches", title: "Alquiler de Coches", blurb: "Sin cargos ocultos, cancelación gratuita hasta 48 h antes." },
  },
  "tout-compris-clubs": {
    en: { label: "All-inclusive & clubs", title: "All-Inclusive & Clubs", blurb: "Meals, drinks and activities included: the budget is known upfront." },
    es: { label: "Todo incluido y clubes", title: "Todo Incluido y Clubes", blurb: "Comidas, bebidas y animación incluidas: el presupuesto se conoce desde el inicio." },
  },
  "sejours-france": {
    en: { label: "Trips in France", title: "Trips in France", blurb: "From the Atlantic coast to the Alps, without leaving the country." },
    es: { label: "Estancias en Francia", title: "Estancias en Francia", blurb: "De la costa atlántica a los Alpes, sin salir del país." },
  },
  "parcs-loisirs": {
    en: { label: "Theme parks", title: "Theme Parks", blurb: "Tickets and hotel nights booked together, for the big parks." },
    es: { label: "Parques de ocio", title: "Parques de Ocio", blurb: "Entradas y noches de hotel reservadas juntas, para los grandes parques." },
  },
  "sur-mesure": {
    en: { label: "Tailor-made trips", title: "Tailor-Made Trips", blurb: "An advisor builds your itinerary around what you want to see." },
    es: { label: "Viajes a medida", title: "Viajes a Medida", blurb: "Un asesor diseña su itinerario a partir de sus deseos." },
  },
  "groupes-entreprises": {
    en: { label: "Groups & companies", title: "Group & Corporate Travel", blurb: "Seminars, incentives and groups of ten or more: a quote within 48 hours." },
    es: { label: "Grupos y empresas", title: "Viajes de Grupo y Empresa", blurb: "Seminarios, incentivos y salidas de más de diez personas: presupuesto en 48 h." },
  },
  "voyages-responsables": {
    en: { label: "Responsible travel", title: "Responsible Travel", blurb: "Committed accommodation, short journeys, local providers." },
    es: { label: "Viajes responsables", title: "Viajes Responsables", blurb: "Alojamientos comprometidos, trayectos cortos, proveedores locales." },
  },
  "assurance-voyage": {
    en: { label: "Travel insurance", title: "Travel Insurance", blurb: "Cancellation, luggage, medical costs: the cover and its price." },
    es: { label: "Seguro de viaje", title: "Seguro de Viaje", blurb: "Cancelación, equipaje, gastos médicos: las coberturas y su precio." },
  },
};

// ---------------------------------------------------------------------------
// Destinations (69)
// ---------------------------------------------------------------------------

export const DESTINATION_TRANSLATIONS: Record<
  string,
  { en: { name: string; blurb: string }; es: { name: string; blurb: string } }
> = {
  maroc: {
    en: { name: "Morocco", blurb: "Three hours by air, UNESCO-listed medinas, the Atlas an hour away, and a season that never really stops." },
    es: { name: "Marruecos", blurb: "Tres horas de vuelo, medinas declaradas patrimonio, el Atlas a una hora en coche y una temporada que casi nunca se detiene." },
  },
  marrakech: {
    en: { name: "Marrakech", blurb: "The medina, courtyard riads and the palm grove: walk the city in the morning, take it easy in the afternoon." },
    es: { name: "Marrakech", blurb: "La medina, los riads con patio y el palmeral: la ciudad se visita a pie por la mañana y se disfruta con calma por la tarde." },
  },
  agadir: {
    en: { name: "Agadir", blurb: "Six miles of west-facing sand, water warm enough to swim from March to November, and affordable clubs." },
    es: { name: "Agadir", blurb: "Diez kilómetros de arena orientados al oeste, un agua que sigue siendo agradable de marzo a noviembre y clubes a precios contenidos." },
  },
  tunisie: {
    en: { name: "Tunisia", blurb: "The most accessible all-inclusive destination on the Mediterranean, two and a half hours by air." },
    es: { name: "Túnez", blurb: "El destino todo incluido más accesible del Mediterráneo, a dos horas y media de vuelo." },
  },
  djerba: {
    en: { name: "Djerba", blurb: "A flat island, fine sandy beaches in the north-east, and a milder climate than the mainland in the shoulder season." },
    es: { name: "Yerba", blurb: "Una isla llana, playas de arena fina al noreste y un clima más suave que en el continente fuera de temporada alta." },
  },
  egypte: {
    en: { name: "Egypt", blurb: "Two trips in one: the pharaonic sites of the Nile Valley, and Red Sea reefs among the richest in the world." },
    es: { name: "Egipto", blurb: "Dos viajes en uno: los yacimientos faraónicos del valle del Nilo y los arrecifes del mar Rojo, de los más ricos del mundo." },
  },
  hurghada: {
    en: { name: "Hurghada", blurb: "The gateway to the Red Sea: reefs reachable from the beach, steady wind, and sunshine all year round." },
    es: { name: "Hurghada", blurb: "La puerta de entrada al mar Rojo: arrecifes accesibles desde la playa, viento constante y sol todo el año." },
  },
  espagne: {
    en: { name: "Spain", blurb: "From the Balearics to the Canaries via Andalusia: the top destination for French travellers, by far." },
    es: { name: "España", blurb: "De las Baleares a las Canarias pasando por Andalucía: el primer destino de los viajeros franceses, con diferencia." },
  },
  canaries: {
    en: { name: "Canary Islands", blurb: "Seventy-two degrees Fahrenheit in January. The only archipelago in Europe where summer doesn't end in October." },
    es: { name: "Canarias", blurb: "Veintidós grados en enero. El único archipiélago de Europa donde el verano no termina en octubre." },
  },
  baleares: {
    en: { name: "Balearic Islands", blurb: "Mallorca for the coves in the north, Ibiza for the sunsets, Menorca for the quiet." },
    es: { name: "Baleares", blurb: "Mallorca por las calas del norte, Ibiza por sus atardeceres, Menorca por la tranquilidad." },
  },
  barcelone: {
    en: { name: "Barcelona", blurb: "Gaudí, the Barri Gòtic and a beach in the city: the only major Mediterranean cultural capital where you can also swim." },
    es: { name: "Barcelona", blurb: "Gaudí, el Barri Gòtic y una playa en la ciudad: la única gran capital cultural mediterránea donde también se puede nadar." },
  },
  andalousie: {
    en: { name: "Andalusia", blurb: "Seville, Cordoba, Granada: eight centuries of Andalusian history across three cities two hours apart by train." },
    es: { name: "Andalucía", blurb: "Sevilla, Córdoba, Granada: ocho siglos de historia andaluza en tres ciudades a dos horas de tren entre sí." },
  },
  portugal: {
    en: { name: "Portugal", blurb: "Lisbon and Porto for the cities, the Algarve for the ochre cliffs, Madeira for hiking all year round." },
    es: { name: "Portugal", blurb: "Lisboa y Oporto por las ciudades, el Algarve por sus acantilados ocres, Madeira para caminar todo el año." },
  },
  lisbonne: {
    en: { name: "Lisbon", blurb: "Seven hills, azulejo tiles, and the Tagus estuary: a capital best explored on foot and by tram." },
    es: { name: "Lisboa", blurb: "Siete colinas, azulejos y el estuario del Tajo: una capital que se recorre a pie y en tranvía." },
  },
  madere: {
    en: { name: "Madeira", blurb: "A volcanic island where you can hike along the levadas in February, in seventy-degree weather." },
    es: { name: "Madeira", blurb: "Una isla volcánica donde se puede caminar junto a las levadas en febrero, con veinte grados." },
  },
  italie: {
    en: { name: "Italy", blurb: "Rome, Florence, Venice, Tuscany, the Amalfi Coast, Sicily: more listed sites than any other country." },
    es: { name: "Italia", blurb: "Roma, Florencia, Venecia, la Toscana, la costa amalfitana, Sicilia: más lugares declarados patrimonio que ningún otro país." },
  },
  rome: {
    en: { name: "Rome", blurb: "The Colosseum, the Vatican and Trastevere: three days cover the essentials, provided you book tickets ahead." },
    es: { name: "Roma", blurb: "El Coliseo, el Vaticano y el Trastevere: tres días bastan para lo esencial, siempre que reserve las entradas con antelación." },
  },
  sicile: {
    en: { name: "Sicily", blurb: "Mount Etna, the Greek temples of Agrigento and Taormina: an island best explored by car, outside of August." },
    es: { name: "Sicilia", blurb: "El Etna, los templos griegos de Agrigento y Taormina: una isla que se recorre en coche, fuera del mes de agosto." },
  },
  grece: {
    en: { name: "Greece", blurb: "Two hundred inhabited islands, ancient sites, and a beach season running from May to October." },
    es: { name: "Grecia", blurb: "Doscientas islas habitadas, yacimientos antiguos y una temporada de playa que va de mayo a octubre." },
  },
  crete: {
    en: { name: "Crete", blurb: "The largest Greek island: beaches in the north, gorges and mountains in the south, enough for two weeks." },
    es: { name: "Creta", blurb: "La isla griega más grande: playas al norte, gargantas y montañas al sur, para llenar dos semanas." },
  },
  santorin: {
    en: { name: "Santorini", blurb: "A caldera, whitewashed villages on the cliffside, and the Oia sunset. A short stay, a lasting impression." },
    es: { name: "Santorini", blurb: "Una caldera, pueblos blancos sobre el acantilado y el atardecer de Oia. Una estancia corta, una impresión duradera." },
  },
  croatie: {
    en: { name: "Croatia", blurb: "A thousand islands, clear water and Venetian old towns: Dubrovnik, Split, Zadar." },
    es: { name: "Croacia", blurb: "Mil islas, agua transparente y cascos antiguos de herencia veneciana: Dubrovnik, Split, Zadar." },
  },
  france: {
    en: { name: "France", blurb: "The world's top tourist destination, and the only one you can reach without flying: coast, mountains, art cities." },
    es: { name: "Francia", blurb: "El primer destino turístico mundial, y el único al que se llega sin avión: litoral, montaña, ciudades de arte." },
  },
  paris: {
    en: { name: "Paris", blurb: "Museums, the banks of the Seine and village-like neighbourhoods: a long weekend is enough to see a good deal of it." },
    es: { name: "París", blurb: "Museos, orillas del Sena y barrios con aire de pueblo: un fin de semana largo basta para ver buena parte de la ciudad." },
  },
  nice: {
    en: { name: "Nice", blurb: "The Baie des Anges, old Nice and the hinterland: the Côte d'Azur stays mild right through November." },
    es: { name: "Niza", blurb: "La bahía de los Ángeles, el casco antiguo y el interior: la Costa Azul sigue siendo agradable hasta noviembre." },
  },
  corse: {
    en: { name: "Corsica", blurb: "From the beaches of Porto-Vecchio to the Bavella needles: the island fits into a week, provided you rent a car." },
    es: { name: "Córcega", blurb: "De las playas de Porto-Vecchio a las agujas de Bavella: la isla se recorre en una semana, alquilando un coche." },
  },
  "royaume-uni": {
    en: { name: "United Kingdom", blurb: "London for the free museums and neighbourhoods, Scotland for the Highlands and the distilleries." },
    es: { name: "Reino Unido", blurb: "Londres por sus museos gratuitos y sus barrios, Escocia por las Highlands y las destilerías." },
  },
  londres: {
    en: { name: "London", blurb: "Two hours fifteen by Eurostar. Free national museums, markets and parks: a city best seen on foot." },
    es: { name: "Londres", blurb: "Dos horas y cuarto en Eurostar. Museos nacionales gratuitos, mercados y parques: una ciudad que se recorre a pie." },
  },
  islande: {
    en: { name: "Iceland", blurb: "Geysers, waterfalls and glaciers along a single ring road. Northern lights from September to March, midnight sun in June." },
    es: { name: "Islandia", blurb: "Géiseres, cascadas y glaciares en una única carretera circular. Auroras boreales de septiembre a marzo, sol de medianoche en junio." },
  },
  norvege: {
    en: { name: "Norway", blurb: "The western fjords and the North Cape, by cruise or by train: Europe's most spectacular scenery." },
    es: { name: "Noruega", blurb: "Los fiordos del oeste y el Cabo Norte, en crucero o en tren: el paisaje europeo más espectacular." },
  },
  turquie: {
    en: { name: "Turkey", blurb: "Istanbul straddling two continents, Cappadocia and the resorts of Antalya: three very different trips." },
    es: { name: "Turquía", blurb: "Estambul a caballo entre dos continentes, Capadocia y los resorts de Antalya: tres viajes muy distintos." },
  },
  prague: {
    en: { name: "Prague", blurb: "An untouched old town, Charles Bridge and the castle: the most accessible capital in Central Europe." },
    es: { name: "Praga", blurb: "Un casco antiguo intacto, el puente de Carlos y el castillo: la capital más accesible de Europa Central." },
  },
  amsterdam: {
    en: { name: "Amsterdam", blurb: "The listed canals, the Rijksmuseum and bikes everywhere: a city made for a two-night stay." },
    es: { name: "Ámsterdam", blurb: "Los canales declarados patrimonio, el Rijksmuseum y bicicletas por todas partes: una ciudad hecha para dos noches." },
  },
  malte: {
    en: { name: "Malta", blurb: "An English-speaking archipelago between Sicily and Tunisia, year-round, with Valletta as your base." },
    es: { name: "Malta", blurb: "Un archipiélago anglófono entre Sicilia y Túnez, visitable todo el año, con La Valeta como base." },
  },
  "ile-maurice": {
    en: { name: "Mauritius", blurb: "A lagoon closed off by a coral reef, hotels at every level, and a dry season from May to December." },
    es: { name: "Isla Mauricio", blurb: "Una laguna cerrada por la barrera de coral, hoteles de todas las categorías y una temporada seca de mayo a diciembre." },
  },
  seychelles: {
    en: { name: "Seychelles", blurb: "Pink granite, turquoise water and three main islands linked by boat: Mahé, Praslin, La Digue." },
    es: { name: "Seychelles", blurb: "Granito rosa, agua turquesa y tres islas principales unidas en barco: Mahé, Praslin, La Digue." },
  },
  maldives: {
    en: { name: "Maldives", blurb: "Twelve hundred islands, one hotel per island, and overwater bungalows above the lagoon." },
    es: { name: "Maldivas", blurb: "Mil doscientas islas, un hotel por isla y bungalós sobre pilotes por encima de la laguna." },
  },
  zanzibar: {
    en: { name: "Zanzibar", blurb: "The listed Stone Town, spice plantations and northern beaches: often combined with a safari." },
    es: { name: "Zanzíbar", blurb: "Stone Town, declarada patrimonio, las plantaciones de especias y las playas del norte: a menudo combinado con un safari." },
  },
  "cap-vert": {
    en: { name: "Cape Verde", blurb: "Seventy-seven degrees year-round, six hours by air, and islands with very different characters: Sal, Boa Vista, São Vicente." },
    es: { name: "Cabo Verde", blurb: "Veinticinco grados todo el año, seis horas de vuelo, e islas de carácter muy distinto: Sal, Boa Vista, São Vicente." },
  },
  "la-reunion": {
    en: { name: "Réunion", blurb: "An active volcano, three listed cirques and a lagoon in the west: an island for hiking as much as sunbathing." },
    es: { name: "La Reunión", blurb: "Un volcán activo, tres circos declarados patrimonio y una laguna al oeste: una isla tanto para caminar como para tomar el sol." },
  },
  kenya: {
    en: { name: "Kenya", blurb: "The Masai Mara, the great migration between July and October, and the Mombasa coast to extend the trip." },
    es: { name: "Kenia", blurb: "El Masai Mara, la gran migración entre julio y octubre, y la costa de Mombasa para prolongar la estancia." },
  },
  "afrique-du-sud": {
    en: { name: "South Africa", blurb: "Cape Town, the Garden Route and the private reserves near Kruger: a long-haul trip with no jet lag." },
    es: { name: "Sudáfrica", blurb: "Ciudad del Cabo, la Garden Route y las reservas privadas de Kruger: un vuelo largo sin desfase horario." },
  },
  senegal: {
    en: { name: "Senegal", blurb: "Five hours by air, no time difference, and the Petite Côte for winter beach stays." },
    es: { name: "Senegal", blurb: "Cinco horas de vuelo, sin diferencia horaria, y la Petite Côte para estancias de playa en invierno." },
  },
  "republique-dominicaine": {
    en: { name: "Dominican Republic", blurb: "Punta Cana and its nineteen miles of white sand: the best value for money in Caribbean all-inclusive." },
    es: { name: "República Dominicana", blurb: "Punta Cana y sus treinta kilómetros de arena blanca: la mejor relación calidad-precio del todo incluido caribeño." },
  },
  mexique: {
    en: { name: "Mexico", blurb: "The Riviera Maya for beaches and cenotes, the Yucatán for Chichén Itzá and its colonial towns." },
    es: { name: "México", blurb: "La Riviera Maya por sus playas y cenotes, Yucatán por Chichén Itzá y sus ciudades coloniales." },
  },
  cuba: {
    en: { name: "Cuba", blurb: "Havana and Trinidad for history, Varadero for the beach: the two combine well over a week." },
    es: { name: "Cuba", blurb: "La Habana y Trinidad por su historia, Varadero por la playa: ambas se combinan bien en una semana." },
  },
  guadeloupe: {
    en: { name: "Guadeloupe", blurb: "Two islands in one: Grande-Terre and its beaches, Basse-Terre and its rainforest. No passport, no currency exchange." },
    es: { name: "Guadalupe", blurb: "Dos islas en una: Grande-Terre y sus playas, Basse-Terre y su selva tropical. Sin pasaporte ni cambio de divisa." },
  },
  martinique: {
    en: { name: "Martinique", blurb: "Les Salines, Mount Pelée and the rum distilleries: the island can be crossed in ninety minutes." },
    es: { name: "Martinica", blurb: "Les Salines, la montaña Pelée y las destilerías: la isla se atraviesa en hora y media." },
  },
  "etats-unis": {
    en: { name: "United States", blurb: "New York for a long weekend, the American West for a two-week road trip, Florida for the parks." },
    es: { name: "Estados Unidos", blurb: "Nueva York para un fin de semana largo, el Oeste americano para un road trip de dos semanas, Florida por los parques." },
  },
  canada: {
    en: { name: "Canada", blurb: "French-speaking Quebec in Indian summer, the Rockies out west: a long-haul trip with no language barrier." },
    es: { name: "Canadá", blurb: "El Quebec francófono en el veranillo indio, las Rocosas al oeste: un vuelo largo sin barrera de idioma." },
  },
  perou: {
    en: { name: "Peru", blurb: "Machu Picchu, the Sacred Valley and Lake Titicaca: best visited between May and September, in the dry season." },
    es: { name: "Perú", blurb: "El Machu Picchu, el Valle Sagrado y el lago Titicaca: mejor entre mayo y septiembre, en temporada seca." },
  },
  bresil: {
    en: { name: "Brazil", blurb: "Rio, the Iguaçu Falls and Salvador de Bahia: three climates and three atmospheres in a single trip." },
    es: { name: "Brasil", blurb: "Río, las cataratas de Iguazú y Salvador de Bahía: tres climas y tres ambientes en un mismo viaje." },
  },
  "costa-rica": {
    en: { name: "Costa Rica", blurb: "A quarter of the country under protection, two oceans, and active volcanoes in between." },
    es: { name: "Costa Rica", blurb: "Un veinticinco por ciento del territorio protegido, dos océanos y volcanes activos entre ambos." },
  },
  thailande: {
    en: { name: "Thailand", blurb: "Bangkok, the northern temples, the southern islands: a tour followed by the beach, over twelve to fifteen days." },
    es: { name: "Tailandia", blurb: "Bangkok, el norte y sus templos, las islas del sur: el circuito y luego la playa, en doce a quince días." },
  },
  bangkok: {
    en: { name: "Bangkok", blurb: "The Grand Palace, floating markets and rooftop bars: two nights as a stopover, or the start of the journey." },
    es: { name: "Bangkok", blurb: "El Gran Palacio, los mercados flotantes y las azoteas: dos noches de escala, o el punto de partida del viaje." },
  },
  japon: {
    en: { name: "Japan", blurb: "Tokyo, Kyoto and the Kansai region linked by Shinkansen. Cherry blossoms in late March, red maples in November." },
    es: { name: "Japón", blurb: "Tokio, Kioto y la región de Kansai unidas por el Shinkansen. Cerezos a finales de marzo, arces rojos en noviembre." },
  },
  vietnam: {
    en: { name: "Vietnam", blurb: "Ha Long Bay, Hue, Hoi An and the Mekong Delta: over a thousand miles from north to south." },
    es: { name: "Vietnam", blurb: "La bahía de Ha Long, Hué, Hoi An y el delta del Mekong: mil setecientos kilómetros de norte a sur." },
  },
  bali: {
    en: { name: "Bali", blurb: "Terraced rice paddies, temples and southern beaches: an island where two weeks never feel too long." },
    es: { name: "Bali", blurb: "Arrozales en terrazas, templos y playas del sur: una isla donde dos semanas nunca se hacen largas." },
  },
  "sri-lanka": {
    en: { name: "Sri Lanka", blurb: "The cultural triangle, tea plantations and southern beaches, on an island the size of Ireland." },
    es: { name: "Sri Lanka", blurb: "El triángulo cultural, las plantaciones de té y las playas del sur, en una isla del tamaño de Irlanda." },
  },
  dubai: {
    en: { name: "Dubai", blurb: "Six hours by air, sunshine from November to April, and a natural stopover towards the Indian Ocean or Asia." },
    es: { name: "Dubái", blurb: "Seis horas de vuelo, sol de noviembre a abril, y una escala natural hacia el océano Índico o Asia." },
  },
  jordanie: {
    en: { name: "Jordan", blurb: "Petra, Wadi Rum and the Dead Sea: a one-week tour on easy roads." },
    es: { name: "Jordania", blurb: "Petra, Wadi Rum y el mar Muerto: un circuito de una semana por carreteras fáciles." },
  },
  australie: {
    en: { name: "Australia", blurb: "Twenty-four hours by air, a six-month season shift: the time to go is when winter sets in back home." },
    es: { name: "Australia", blurb: "Veinticuatro horas de vuelo, seis meses de desfase de temporada: el momento de ir es cuando aquí llega el invierno." },
  },
  "polynesie-francaise": {
    en: { name: "French Polynesia", blurb: "Bora Bora, Moorea and Tahiti: the most photographed lagoons in the Pacific, and French-speaking." },
    es: { name: "Polinesia Francesa", blurb: "Bora Bora, Moorea y Tahití: las lagunas más fotografiadas del Pacífico, en un entorno francófono." },
  },
  singapour: {
    en: { name: "Singapore", blurb: "An ideal stopover towards Asia or Oceania, and a city that fits into three days." },
    es: { name: "Singapur", blurb: "Una escala ideal hacia Asia u Oceanía, y una ciudad que se recorre en tres días." },
  },
  pologne: {
    en: { name: "Poland", blurb: "Kraków and Warsaw: listed cities at Central European prices, two and a half hours by air." },
    es: { name: "Polonia", blurb: "Cracovia y Varsovia: ciudades declaradas patrimonio a precios de Europa Central, a dos horas y media de vuelo." },
  },
  finlande: {
    en: { name: "Finland", blurb: "Lapland in winter: northern lights, sleigh rides and Santa Claus's village." },
    es: { name: "Finlandia", blurb: "Laponia en invierno: auroras boreales, trineos y el pueblo de Papá Noel." },
  },
  suede: {
    en: { name: "Sweden", blurb: "Stockholm spread across fourteen islands, with the archipelago a boat ride away in summer." },
    es: { name: "Suecia", blurb: "Estocolmo repartida en catorce islas, con el archipiélago a un paseo en barco en verano." },
  },
  "alpes-francaises": {
    en: { name: "French Alps", blurb: "The largest ski area in the world, from Chamonix to the Trois Vallées, three hours from Paris." },
    es: { name: "Alpes Franceses", blurb: "El dominio esquiable más grande del mundo, de Chamonix a las Trois Vallées, a tres horas de París." },
  },
  andorre: {
    en: { name: "Andorra", blurb: "Affordable skiing in the Pyrenees, with duty-free shopping along the way." },
    es: { name: "Andorra", blurb: "Esquí a precio contenido en los Pirineos, con compras libres de impuestos de paso." },
  },
};

// ---------------------------------------------------------------------------
// Articles du guide de voyage (5)
// ---------------------------------------------------------------------------

export const POST_TRANSLATIONS: Record<
  string,
  { en: { title: string; excerpt: string; body: string }; es: { title: string; excerpt: string; body: string } }
> = {
  "quand-partir-japon": {
    en: {
      title: "When to visit Japan, depending on what you want to see",
      excerpt: "Cherry blossoms, red maples or summer festivals: each season changes the trip completely. Here's how to choose.",
      body: `Japan changes character with every season, and choosing when to go matters as much as the itinerary itself. There is no single "best time": there is the time that matches what you came to see.

From late March to early April is cherry blossom season (sakura). Tokyo and Kyoto become the most sought-after cities of the year: accommodation books up early, and the best-known parks are packed from the first weekend of bloom. The blossom front moves from south to north over about a month, which leaves some flexibility if your dates aren't fixed.

Autumn, from mid-November to early December, offers the equivalent in maple colour (momiji): Kyoto's temples surrounded by red and orange, with somewhat lighter crowds than in spring and more comfortable temperatures for walking all day.

Summer (July–August) is hot and humid, with a rainy season that usually ends by mid-July depending on the region. It is, however, the season of the great traditional festivals (matsuri) and fireworks — a different angle on the trip.

Winter, from December to February, suits an itinerary focused on nature and winter sports in the north (Hokkaido), with dry air and often clear skies in central Japan.

For a first tour combining Tokyo, Kyoto and Osaka, spring or autumn remain the most balanced choices between weather, light and crowds.`,
    },
    es: {
      title: "Cuándo viajar a Japón según lo que quiera ver",
      excerpt: "Cerezos, arces rojos o festivales de verano: cada estación cambia por completo el viaje. Le contamos cómo elegir.",
      body: `Japón cambia de rostro con cada estación, y la elección del momento pesa tanto como el propio itinerario. No existe un "mejor momento" absoluto: existe el momento que corresponde a lo que ha venido a ver.

De finales de marzo a principios de abril llega la temporada de los cerezos (sakura). Tokio y Kioto se convierten entonces en las ciudades más solicitadas del año: los alojamientos se reservan pronto y los parques más conocidos se llenan desde el primer fin de semana de floración. La floración avanza de sur a norte durante aproximadamente un mes, lo que deja cierto margen si las fechas exactas no están fijadas.

El otoño, entre mediados de noviembre y principios de diciembre, ofrece el equivalente con los arces (momiji): los templos de Kioto rodeados de rojo y naranja, con una afluencia algo menor que en primavera y temperaturas más cómodas para caminar todo el día.

El verano (julio-agosto) es cálido y húmedo, con una temporada de lluvias que suele terminar a mediados de julio según la región. Es, en cambio, la época de los grandes festivales tradicionales (matsuri) y de los fuegos artificiales, un ángulo diferente del viaje.

El invierno, de diciembre a febrero, es adecuado para un circuito centrado en la naturaleza y los deportes de invierno en el norte (Hokkaido), con un aire seco y cielos a menudo despejados en el centro del país.

Para un primer circuito que combine Tokio, Kioto y Osaka, la primavera o el otoño siguen siendo las opciones más equilibradas entre clima, luz y afluencia.`,
    },
  },
  "bagage-cabine-regles": {
    en: {
      title: "Cabin baggage: the rules to know before you reach security",
      excerpt: "Dimensions, liquids, batteries: a rundown of the rules applied by European airlines.",
      body: `Cabin baggage rules vary from one airline to another, even on the same flight+hotel package: the allowed size and weight depend on the ticket, not the destination. The first thing to check is always the airline's own page linked from your booking confirmation, before you pack.

Liquids remain governed by a rule common to most European airports: containers of 100 ml or less, gathered in a single resealable one-litre transparent bag. Anything larger goes in the hold.

Lithium batteries (cameras, power banks, e-cigarettes) must travel in the cabin, never in the hold: this is a safety rule, not something left to the passenger's judgement. High-capacity power banks (above roughly 100 Wh) generally require the airline's prior approval.

On a one-way flight or a round trip with a low-cost carrier, the "free" cabin allowance is often limited to a single bag under the seat in front of you; a standard wheeled cabin case is then a paid extra. Checking this before departure avoids an unpleasant surprise at the check-in desk.

If in doubt about a specific airline, customer service remains reachable by WhatsApp or phone before departure to confirm the rules that apply to your ticket.`,
    },
    es: {
      title: "Equipaje de mano: las normas que hay que conocer antes de llegar al control",
      excerpt: "Dimensiones, líquidos, baterías: el resumen de las normas aplicadas por las aerolíneas europeas.",
      body: `Las normas de equipaje de mano varían de una aerolínea a otra, incluso en un mismo vuelo combinado de vuelo + hotel: el tamaño y el peso permitidos dependen del billete, no del destino. Lo primero que hay que comprobar siempre es la ficha de la aerolínea indicada en su confirmación de reserva, antes de hacer las maletas.

Los líquidos siguen sujetos a una norma común a la mayoría de los aeropuertos europeos: envases de 100 ml como máximo, agrupados en una bolsa transparente y resellable de un litro. Por encima de eso, van a la bodega.

Las baterías de litio (cámaras, baterías externas, cigarrillos electrónicos) deben viajar en cabina, nunca en bodega: es una norma de seguridad, no una opción a criterio del pasajero. Las baterías externas de gran capacidad (por encima de unos 100 Wh) suelen requerir la autorización previa de la aerolínea.

En un vuelo solo ida o un ida y vuelta con una aerolínea de bajo coste, el equipaje de mano "gratuito" suele limitarse a una única bolsa bajo el asiento delantero; la maleta de cabina con ruedas clásica se paga entonces como suplemento. Comprobar este punto antes de salir evita una mala sorpresa en el mostrador de facturación.

En caso de duda sobre una aerolínea concreta, el servicio de atención al cliente sigue disponible por WhatsApp o teléfono antes de la salida para confirmar las normas aplicables a su billete.`,
    },
  },
  "croisiere-premiere-fois": {
    en: {
      title: "First cruise: ten questions everyone asks",
      excerpt: "Seasickness, tips, evening dress, which excursions to book: straight answers.",
      body: `Seasickness is the first worry, and the most often overestimated. On modern large cruise ships, stabilisers greatly reduce rolling in the Mediterranean or the Canaries; a cabin at the centre of the ship, on a mid-level deck, remains the most stable choice for anyone particularly wary of motion.

Crew tips are, on most cruise lines, either included in the advertised price or charged automatically at the end of the trip as a per-day, per-passenger fee: the detail always appears on the offer page and on the final invoice, with no surprises on board.

As for dress, a cruise in the Mediterranean or the Caribbean doesn't call for a special wardrobe day to day (casual dress at the main restaurant during the day), but generally includes one or two smarter evenings during the trip: nothing compulsory, but nice to plan for.

Shore excursions at each port of call are not included in the cruise price itself, unless stated otherwise on the offer page: they are booked separately, on board or in advance. It is entirely possible to go ashore and explore independently, without joining an organised excursion.

An outside cabin (with a porthole or balcony) costs more than an inside cabin, but for a first cruise, seeing the sea from your room changes the experience considerably, especially on a multi-day cruise with days spent entirely at sea.

For a first time, a short format (7 to 8 days) on full board, with an itinerary of closely spaced ports of call such as the western Mediterranean or the Greek islands, remains the best choice.`,
    },
    es: {
      title: "Primer crucero: diez preguntas que todo el mundo se hace",
      excerpt: "Mareo, propinas, código de vestimenta, qué excursiones reservar o no: respuestas sin rodeos.",
      body: `El mareo es el primer temor, y el que más se suele sobrestimar. En los grandes cruceros modernos, los estabilizadores reducen mucho el balanceo en el Mediterráneo o en Canarias; un camarote en el centro del barco y en una cubierta intermedia sigue siendo la opción más estable para quien teme especialmente el movimiento.

Las propinas a la tripulación están, en la mayoría de las navieras, ya incluidas en el precio anunciado o se cobran automáticamente al final de la estancia en forma de tarifa diaria por pasajero: el detalle figura siempre en la ficha de la oferta y en la factura final, sin sorpresas a bordo.

En cuanto a la vestimenta, un crucero por el Mediterráneo o el Caribe no exige un vestuario especial en el día a día (vestimenta informal en el restaurante principal durante el día), pero suele incluir una o dos noches más elegantes durante la estancia: nada obligatorio, pero conviene preverlo.

Las excursiones en cada escala no están incluidas en el precio del crucero en sí, salvo indicación contraria en la ficha de la oferta: se reservan aparte, a bordo o con antelación. Es perfectamente posible bajar a tierra y visitar por cuenta propia, sin pasar por una excursión organizada.

El camarote exterior (con ojo de buey o balcón) cuesta más que uno interior, pero para un primer embarque, ver el mar desde la habitación cambia mucho la experiencia, sobre todo en un crucero de varios días sin escala diaria.

Lo mejor para una primera vez sigue siendo una fórmula corta (de 7 a 8 días) en pensión completa, con un itinerario de escalas cercanas como el Mediterráneo occidental o las islas griegas.`,
    },
  },
  "andalousie-itineraire": {
    en: {
      title: "Andalusia in a week: an itinerary that works",
      excerpt: "Seville, Cordoba, Granada and a detour to Cadiz, without spending your days on the road.",
      body: `Over seven days, the most common mistake is trying to see everything and losing the trip to the road. Andalusia lends itself well to a tight loop around three cities: Seville, Cordoba and Granada are all within two hours of each other by road or train.

Start with two nights in Seville: the cathedral and the Giralda, the Santa Cruz district, and the Alcázar, which should be booked ahead in high season given how busy it gets. Seville is very walkable, especially early in the morning before the afternoon heat if you're travelling in summer.

One night in Cordoba is enough for the essentials: the Mezquita-Catedral, unique in Europe for its architecture, and the historic Judería quarter around it. It's the shortest stop on the itinerary, but not one to skip.

Finish with two to three nights in Granada, capped by the Alhambra: tickets should be booked several weeks ahead, as the daily quota is limited. The Albaicín district, facing the Alhambra, offers the best view at sunset.

For anyone with an extra day, a detour to Cadiz or the white villages of the Sierra de Grazalema brings a welcome coastal or rural contrast to the three main cities.

Spring (April–May) and early autumn remain the most comfortable seasons for walking all day: Andalusian summers regularly exceed 95°F inland.`,
    },
    es: {
      title: "Andalucía en una semana: el itinerario que funciona",
      excerpt: "Sevilla, Córdoba, Granada y una escapada a Cádiz, sin pasar los días en la carretera.",
      body: `En siete días, el error más frecuente es querer verlo todo y perder el viaje en la carretera. Andalucía se presta bien a un itinerario en bucle cerrado en torno a tres ciudades: Sevilla, Córdoba y Granada están unidas entre sí a menos de dos horas de carretera o de tren.

Empiece con dos noches en Sevilla: la catedral y la Giralda, el barrio de Santa Cruz y el Alcázar, que conviene reservar con antelación en temporada alta por la gran afluencia. Sevilla se visita muy bien a pie, sobre todo temprano por la mañana antes del calor de la tarde si el viaje es en verano.

Una noche en Córdoba basta para lo esencial: la Mezquita-Catedral, única en Europa por su arquitectura, y el barrio histórico de la Judería a su alrededor. Es la etapa más corta del itinerario, pero no por ello prescindible.

Termine con dos o tres noches en Granada, con la Alhambra como colofón: las entradas se reservan con varias semanas de antelación, ya que el aforo diario es limitado. El barrio del Albaicín, frente a la Alhambra, ofrece la mejor vista al atardecer.

Para quien disponga de un día más, una escapada a Cádiz o a los pueblos blancos de la Sierra de Grazalema aporta un contraste marítimo o rural muy bienvenido frente a las tres grandes ciudades.

La primavera (abril-mayo) y el principio del otoño siguen siendo las épocas más cómodas para caminar todo el día: el verano andaluz supera con frecuencia los 35 °C en el interior.`,
    },
  },
  "accompagnement-avant-pendant-apres-voyage": {
    en: {
      title: "Before, during, after: how your trip is looked after",
      excerpt: "Booking online doesn't mean travelling alone: what happens once your booking is confirmed.",
      body: `Booking a trip online doesn't mean being left to fend for yourself once payment goes through. Three moments structure the support behind a booking, from the first click to your return home.

Before departure, the booking confirmation arrives by email with all the useful documents (reference, trip details, terms), and stays available at any time from the client area, under "My bookings". Any question about luggage, formalities or timing can be asked directly via WhatsApp, without going through a form or a phone queue.

During the trip, the booking reference (in the GO-XXXXX format) serves as a single point of reference for any request: it is asked for by the accommodation, the airline or customer service whenever needed, sparing you from re-explaining the whole file each time.

After the return, the client area keeps the full history of booked trips, useful for finding an invoice or leaving a review of the experience. It is also the fastest channel for a late question (invoice, supporting document) to get an answer.

This does not replace on-the-ground support from a local professional (as with escorted tours, which include a French-speaking guide from the first day to the last), but it does guarantee that no booking is ever left without someone to reach.`,
    },
    es: {
      title: "Antes, durante y después: cómo se acompaña su viaje",
      excerpt: "Reservar en línea no significa viajar solo: esto es lo que ocurre una vez confirmada la reserva.",
      body: `Reservar un viaje en línea no significa quedarse solo una vez realizado el pago. Tres momentos estructuran el seguimiento de una reserva, desde el primer clic hasta la vuelta a casa.

Antes de la salida, la confirmación de reserva llega por correo electrónico con todos los documentos útiles (referencia, detalle de la estancia, condiciones), y sigue disponible en cualquier momento desde el área de cliente, en el apartado "Mis reservas". Cualquier duda sobre el equipaje, un trámite o un horario puede plantearse directamente por WhatsApp, sin pasar por un formulario ni una espera telefónica.

Durante la estancia, la referencia de reserva (con formato GO-XXXXX) sirve como identificador único para cualquier gestión: el alojamiento, la aerolínea o el servicio de atención al cliente la solicitan cuando es necesario, evitando tener que repetir todo el expediente.

Después del regreso, el área de cliente conserva el historial completo de los viajes reservados, útil para recuperar una factura o dejar una opinión sobre la experiencia vivida. Es también el canal por el que una pregunta tardía (factura, justificante) obtiene la respuesta más rápida.

Este funcionamiento no sustituye el acompañamiento sobre el terreno de un profesional local (como ocurre en los circuitos acompañados, con guía de habla francesa del primer al último día), pero garantiza que ninguna reserva se queda sin un interlocutor disponible.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Offres (469) : titres traduits un par un (fichier généré, relu par
// échantillonnage), descriptions/points forts/inclus composés par gabarit,
// comme en français dans `catalogue-source.ts`.
// ---------------------------------------------------------------------------

type OfferTitleEntry = { fr: string; en: string; es: string };
const OFFER_TITLES = offerTitles as Record<string, OfferTitleEntry>;

export function offerTitleTranslation(slug: string): { en: string; es: string } | null {
  const entry = OFFER_TITLES[slug];
  return entry ? { en: entry.en, es: entry.es } : null;
}

const BOARD_EN: Record<string, string> = {
  "Tout compris": "all-inclusive",
  "Pension complète": "full board",
  "Demi-pension": "half board",
  "Petit-déjeuner": "bed and breakfast",
  "Sans repas": "room only",
  "Vol seul": "flight only",
};
const BOARD_ES: Record<string, string> = {
  "Tout compris": "todo incluido",
  "Pension complète": "pensión completa",
  "Demi-pension": "media pensión",
  "Petit-déjeuner": "alojamiento y desayuno",
  "Sans repas": "solo alojamiento",
  "Vol seul": "solo vuelo",
};

function describeEn(o: SourceOffer, title: string): string {
  const { category, subtype, destination: city, country, departureCity, nights, board } = o;
  const b = BOARD_EN[board] ?? board.toLowerCase();
  switch (category) {
    case "vols":
      return `${title}, departing from ${departureCity}. Price per person, taxes and service fees included, across a selection of scheduled and low-cost airlines.`;
    case "location-voiture":
      return `${title}. Pick-up in ${city} (${country}), ${nights} days of rental with basic insurance, unlimited mileage and free cancellation up to 48 hours before departure.`;
    case "croisieres":
      return subtype === "croisiere_fluviale"
        ? `${title}. ${nights + 1} days on board on ${b}, outside cabin, daily ports of call and onboard lectures.`
        : `${title}. ${nights + 1} days at sea on ${b}, ports of call and entertainment included, cabin choice subject to availability.`;
    case "circuits":
      return subtype === "circuit_libre"
        ? `${title}. A ${nights + 1}-day self-drive tour: vehicle, accommodation and route booked for you, but you set your own pace.`
        : `${title}. A ${nights + 1}-day small-group itinerary, French-speaking guide, transfers and main visits included.`;
    case "parcs-loisirs":
      return `${title}. Entry tickets and accommodation booked together, in ${city}. Park admission is included for the whole stay.`;
    case "hotels":
      return `${title}. ${nights} night${nights > 1 ? "s" : ""} in ${city} on ${b}, instant confirmation and cancellation available on a selection of rooms.`;
    default:
      return `${title}, in ${city} (${country}). ${nights} nights on ${b}, flight departing from ${departureCity} and French-speaking assistance throughout the stay.`;
  }
}

function describeEs(o: SourceOffer, title: string): string {
  const { category, subtype, destination: city, country, departureCity, nights, board } = o;
  const b = BOARD_ES[board] ?? board.toLowerCase();
  switch (category) {
    case "vols":
      return `${title}, con salida desde ${departureCity}. Precio por persona, tasas y gastos de gestión incluidos, en una selección de aerolíneas regulares y de bajo coste.`;
    case "location-voiture":
      return `${title}. Recogida en ${city} (${country}), ${nights} días de alquiler con seguro básico, kilometraje ilimitado y cancelación gratuita hasta 48 horas antes de la salida.`;
    case "croisieres":
      return subtype === "croisiere_fluviale"
        ? `${title}. ${nights + 1} días a bordo en ${b}, camarote exterior, escalas diarias y conferencias a bordo.`
        : `${title}. ${nights + 1} días de navegación en ${b}, escalas y animación incluidas, camarote a elegir según disponibilidad.`;
    case "circuits":
      return subtype === "circuit_libre"
        ? `${title}. Un autotour de ${nights + 1} días: vehículo, alojamientos y hoja de ruta reservados, pero usted marca el ritmo del viaje.`
        : `${title}. Un itinerario de ${nights + 1} días en grupo reducido, guía de habla francesa, traslados y visitas principales incluidos.`;
    case "parcs-loisirs":
      return `${title}. Entradas y alojamiento reservados juntos, en ${city}. La entrada al parque está incluida durante toda la estancia.`;
    case "hotels":
      return `${title}. ${nights} noche${nights > 1 ? "s" : ""} en ${city} en ${b}, confirmación inmediata y cancelación posible en una selección de habitaciones.`;
    default:
      return `${title}, en ${city} (${country}). ${nights} noches en ${b}, vuelo con salida desde ${departureCity} y asistencia en español durante toda la estancia.`;
  }
}

const HIGHLIGHTS_BASE_EN: Record<string, string[]> = {
  tout_compris: [
    "Meals, drinks and snacks included from the first day to the last",
    "Daytime activities and evening shows",
    "included round-trip flight and transfers",
  ],
  vol_hotel: ["included round-trip flight", "Airport-to-hotel transfer", "Room booked with free cancellation"],
  hotel_seul: ["Central location, everything within walking distance", "Instant confirmation", "Pay on arrival on a selection of rooms"],
  vol_seul: ["Compare scheduled and low-cost airlines", "Cabin bag included on most fares", "Changes possible depending on ticket conditions"],
  circuit_accompagne: ["Small group, for a comfortable pace", "French-speaking guide throughout", "Handpicked accommodation at each stage"],
  circuit_libre: ["Rental car included for the whole trip", "Stages booked, itinerary flexible", "Route sheet and tested addresses"],
  croisiere_maritime: ["Full board on board from first to last day", "Daily ports of call, optional excursions", "Entertainment, shows and pool areas included"],
  croisiere_fluviale: ["Outside cabin with riverside views", "Docking in the city centre at every stop", "Full board and onboard lectures"],
  camping: ["Mobile home equipped for 4 to 6 people", "Kids' club and activities in high season", "Free access to the water park"],
  week_end: ["Short format, Friday evening to Sunday", "Accommodation chosen for its central location", "No time off needed"],
  location: ["Unlimited mileage for the whole rental", "No hidden fees at the counter", "Free cancellation up to 48 hours before"],
};
const HIGHLIGHTS_BASE_ES: Record<string, string[]> = {
  tout_compris: ["Comidas, bebidas y snacks incluidos del primer al último día", "Animación diurna y espectáculos nocturnos", "Vuelo ida y vuelta y traslados incluidos"],
  vol_hotel: ["Vuelo ida y vuelta incluido", "Traslado entre el aeropuerto y el alojamiento", "Habitación reservada con cancelación posible"],
  hotel_seul: ["Ubicación céntrica, todo a pie", "Confirmación inmediata", "Pago a la llegada en una selección de habitaciones"],
  vol_seul: ["Comparación de aerolíneas regulares y de bajo coste", "Equipaje de cabina incluido en la mayoría de tarifas", "Modificación posible según las condiciones del billete"],
  circuit_accompagne: ["Grupo reducido, para un ritmo agradable", "Guía de habla francesa durante todo el recorrido", "Alojamientos seleccionados en cada etapa"],
  circuit_libre: ["Coche de alquiler incluido durante todo el recorrido", "Etapas reservadas, itinerario modificable", "Hoja de ruta y direcciones probadas"],
  croisiere_maritime: ["Pensión completa a bordo del primer al último día", "Escalas diarias, excursiones opcionales", "Animación, espectáculos y zonas de piscina incluidos"],
  croisiere_fluviale: ["Camarote exterior con vistas a la orilla", "Atraque en el centro de la ciudad en cada escala", "Pensión completa y conferencias a bordo"],
  camping: ["Casa móvil equipada para 4 a 6 personas", "Club infantil y animación en temporada alta", "Acceso libre al parque acuático"],
  week_end: ["Formato corto, de la tarde del viernes al domingo", "Alojamiento elegido por su cercanía al centro", "Sin necesidad de pedir vacaciones"],
  location: ["Kilometraje ilimitado durante todo el alquiler", "Sin cargos ocultos en el mostrador", "Cancelación gratuita hasta 48 horas antes"],
};
const PARK_HIGHLIGHTS_EN = ["Park entry tickets included", "Accommodation a few minutes from the entrance", "Early access to attractions depending on accommodation"];
const PARK_HIGHLIGHTS_ES = ["Entradas al parque incluidas", "Alojamiento a pocos minutos de la entrada", "Acceso anticipado a las atracciones según el alojamiento"];

function highlightsForEn(o: SourceOffer): string[] {
  const { category, subtype, region, departureCity, nights, days } = o;
  const chosen = category === "parcs-loisirs" ? PARK_HIGHLIGHTS_EN : (HIGHLIGHTS_BASE_EN[subtype ?? ""] ?? []);
  const contexte = category === "vols" ? `Route departing from ${departureCity}` : `Exploring the region: ${region}`;
  const duree = category === "vols" ? "Round trip, flexible dates subject to availability" : `${days} days on site`;
  void nights;
  return [...chosen, contexte, duree];
}
function highlightsForEs(o: SourceOffer): string[] {
  const { category, subtype, region, departureCity, nights, days } = o;
  const chosen = category === "parcs-loisirs" ? PARK_HIGHLIGHTS_ES : (HIGHLIGHTS_BASE_ES[subtype ?? ""] ?? []);
  const contexte = category === "vols" ? `Ruta con salida desde ${departureCity}` : `Descubrimiento de la región: ${region}`;
  const duree = category === "vols" ? "Ida y vuelta, fechas flexibles según disponibilidad" : `${days} días en destino`;
  void nights;
  return [...chosen, contexte, duree];
}

function includedForEn(category: string, subtype: string, board: string): string[] {
  const b = BOARD_EN[board] ?? board.toLowerCase();
  if (category === "vols") return ["Round-trip flight", "Airport taxes", "Cabin bag"];
  if (category === "location-voiture") return ["Vehicle rental", "Third-party liability insurance", "Unlimited mileage"];
  if (category === "parcs-loisirs") return ["Park entry tickets", `Accommodation, ${b}`, "Tourist tax"];
  const commun = [`Accommodation, ${b}`, "Taxes and booking fees", "French-speaking assistance 24/7"];
  if (subtype === "hotel_seul" || subtype === "camping") return commun;
  if (subtype === "week_end") return ["Round-trip flight or train", ...commun];
  return ["Round-trip flight", "Transfers", ...commun];
}
function includedForEs(category: string, subtype: string, board: string): string[] {
  const b = BOARD_ES[board] ?? board.toLowerCase();
  if (category === "vols") return ["Vuelo ida y vuelta", "Tasas de aeropuerto", "Equipaje de cabina"];
  if (category === "location-voiture") return ["Alquiler del vehículo", "Seguro de responsabilidad civil", "Kilometraje ilimitado"];
  if (category === "parcs-loisirs") return ["Entradas al parque", `Alojamiento en ${b}`, "Tasa turística"];
  const commun = [`Alojamiento en ${b}`, "Tasas y gastos de gestión", "Asistencia en español 24 h"];
  if (subtype === "hotel_seul" || subtype === "camping") return commun;
  if (subtype === "week_end") return ["Vuelo o tren ida y vuelta", ...commun];
  return ["Vuelo ida y vuelta", "Traslados", ...commun];
}

/** Traduction complète d'une offre du catalogue source, prête pour le seed. */
export function translateOffer(o: SourceOffer): {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  highlightsEn: string[];
  highlightsEs: string[];
  includedEn: string[];
  includedEs: string[];
} {
  const titles = offerTitleTranslation(o.slug) ?? { en: o.title, es: o.title };
  return {
    titleEn: titles.en,
    titleEs: titles.es,
    descriptionEn: describeEn(o, titles.en),
    descriptionEs: describeEs(o, titles.es),
    highlightsEn: highlightsForEn(o),
    highlightsEs: highlightsForEs(o),
    includedEn: includedForEn(o.category, o.subtype ?? "", o.board),
    includedEs: includedForEs(o.category, o.subtype ?? "", o.board),
  };
}

// ---------------------------------------------------------------------------
// Continents du hub Destinations (8) : liste statique de src/lib/data.ts.
// ---------------------------------------------------------------------------

export const CONTINENT_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  europe: { en: "Europe", es: "Europa" },
  "afrique-du-nord": { en: "North Africa", es: "Norte de África" },
  "afrique-ocean-indien": { en: "Sub-Saharan Africa & Indian Ocean", es: "África subsahariana y Océano Índico" },
  "amerique-du-nord-caraibes": { en: "North America & Caribbean", es: "Norteamérica y Caribe" },
  "amerique-du-sud": { en: "South America", es: "Sudamérica" },
  asie: { en: "Asia", es: "Asia" },
  "moyen-orient": { en: "Middle East", es: "Oriente Medio" },
  oceanie: { en: "Oceania", es: "Oceanía" },
};

/** Libellé de continent selon la locale, avec repli sur le français. */
export function translateContinentLabel(id: string, label: string, locale: "fr" | "en" | "es"): string {
  const t9n = CONTINENT_TRANSLATIONS[id];
  if (!t9n || locale === "fr") return label;
  return locale === "en" ? t9n.en : t9n.es;
}

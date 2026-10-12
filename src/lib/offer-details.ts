import type { Offer } from "@/lib/types";

/**
 * Compléments d'information de la fiche offre : programme, « ce prix ne
 * comprend pas », informations pratiques, conditions d'annulation.
 *
 * Règle de contenu : rien d'inventé. Ces textes sont génériques et se
 * déduisent uniquement des données déjà en base pour l'offre (catégorie,
 * formule, durée, ville de départ, pays) et des engagements déjà affichés
 * ailleurs sur le site. Pas de nom d'hôtel, pas d'horaire précis, pas de
 * règle d'entrée par pays recopiée de mémoire (elles changent) : on renvoie
 * vers la source officielle. Dès que l'équipe saisit un texte précis au
 * back-office (`Offer.itinerary`, `notIncluded`, `practicalInfo`), il
 * remplace le texte générique.
 */

type DetailsInput = Pick<
  Offer,
  "category" | "subtype" | "title" | "destination" | "country" | "departureCity" | "nights" | "days" | "stars" | "board"
>;

/** Collectivités françaises : pas de passeport pour un ressortissant français. */
const FRENCH_TERRITORIES = new Set([
  "France",
  "Guadeloupe",
  "Martinique",
  "La Réunion",
  "Guyane",
  "Mayotte",
  "Polynésie française",
  "Nouvelle-Calédonie",
  "Saint-Martin",
  "Saint-Barthélemy",
]);

/** Produits qui comprennent un vol (tout sauf l'hébergement ou la voiture seuls). */
function includesFlight(o: DetailsInput): boolean {
  if (o.category === "vols") return true;
  if (["hotels", "location-voiture", "parcs-loisirs"].includes(o.category)) return false;
  if (o.subtype === "camping") return false;
  // Croisière qui embarque dans la ville de départ du client : pas de vol.
  if (o.category === "croisieres" && o.departureCity === o.destination) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Programme (circuits et croisières)
// ---------------------------------------------------------------------------

/**
 * Programme indicatif, étape par étape.
 *
 * Il décrit le déroulé réel d'un produit de ce type (arrivée, itinéraire,
 * retour) avec les données de l'offre, sans inventer de visites jour par
 * jour que nous ne pourrions pas garantir. Le détail jour par jour se saisit
 * au back-office, offre par offre, une ligne par jour.
 */
export function defaultItinerary(o: DetailsInput): string[] {
  const days = o.days ?? o.nights + 1;
  const last = Math.max(days, 2);
  const middle = last > 2 ? (last === 3 ? "Jour 2" : `Jours 2 à ${last - 1}`) : "";
  const board = o.board.toLowerCase();

  if (o.category === "circuits") {
    if (o.subtype === "circuit_libre") {
      return [
        `Jour 1 : vol au départ de ${o.departureCity} vers ${o.destination}, prise en charge du véhicule de location à l'arrivée.`,
        middle &&
          `${middle} : autotour « ${o.title} » à votre rythme, étapes réservées et feuille de route fournie, nuits en ${board}.`,
        `Jour ${last} : restitution du véhicule et vol retour vers ${o.departureCity}.`,
      ].filter(Boolean);
    }
    return [
      `Jour 1 : vol au départ de ${o.departureCity} vers ${o.destination}, accueil et transfert à l'hôtel.`,
      middle &&
        `${middle} : circuit « ${o.title} » en petit groupe avec guide francophone, visites principales incluses, hôtels ${o.stars}★ en ${board}.`,
      `Jour ${last} : transfert à l'aéroport et vol retour vers ${o.departureCity}.`,
    ].filter(Boolean);
  }

  if (o.category === "croisieres") {
    const flight = includesFlight(o);
    const river = o.subtype === "croisiere_fluviale";
    return [
      flight
        ? `Jour 1 : vol au départ de ${o.departureCity}, transfert au port et embarquement à ${o.destination}.`
        : `Jour 1 : embarquement à ${o.destination}, installation en cabine.`,
      middle &&
        (river
          ? `${middle} : navigation « ${o.title} », escales quotidiennes avec amarrage en centre-ville, ${board} à bord.`
          : `${middle} : navigation « ${o.title} », escales selon l'itinéraire du navire, ${board} à bord, excursions en option.`),
      flight
        ? `Jour ${last} : débarquement, transfert à l'aéroport et vol retour vers ${o.departureCity}.`
        : `Jour ${last} : débarquement après le petit-déjeuner.`,
    ].filter(Boolean);
  }

  return [];
}

// ---------------------------------------------------------------------------
// Ce prix ne comprend pas
// ---------------------------------------------------------------------------

export function defaultNotIncluded(o: DetailsInput): string[] {
  const insurance = "L'assurance annulation (proposée à l'étape suivante)";
  const meals =
    o.board === "Tout compris" || o.board === "Pension complète"
      ? null
      : `Les repas non prévus par la formule (${o.board.toLowerCase()})`;

  switch (o.category) {
    case "vols":
      return [
        "Le bagage en soute, selon le tarif choisi",
        "Les transferts entre l'aéroport et votre hébergement",
        insurance,
      ];
    case "location-voiture":
      return ["Le carburant", "Les péages et le stationnement", insurance];
    case "parcs-loisirs":
      return [
        "Le transport jusqu'au parc",
        meals ?? "Les repas pris dans le parc",
        "Les dépenses personnelles",
        insurance,
      ].filter(Boolean) as string[];
    case "hotels":
      return [
        "Le transport jusqu'à l'hôtel",
        meals,
        "Les dépenses personnelles (minibar, room service…)",
        insurance,
      ].filter(Boolean) as string[];
    case "croisieres":
      return [
        "Les excursions en escale (proposées en option)",
        o.board === "Tout compris" ? null : "Les boissons hors forfait",
        "Les frais de service à bord éventuels, selon la compagnie",
        "Les dépenses personnelles",
        insurance,
      ].filter(Boolean) as string[];
    case "circuits":
      return o.subtype === "circuit_libre"
        ? [
            "Le carburant, les péages et le stationnement",
            meals,
            "Les entrées des sites et musées",
            "Les dépenses personnelles",
            insurance,
          ].filter((x): x is string => Boolean(x))
        : [
            meals,
            "Les visites et activités facultatives",
            "Les pourboires au guide et au chauffeur (usage local, à votre discrétion)",
            "Les frais de visa éventuels",
            "Les dépenses personnelles",
            insurance,
          ].filter((x): x is string => Boolean(x));
    default:
      return [
        o.subtype === "camping" ? "Le transport jusqu'au camping" : null,
        meals,
        "Les excursions facultatives",
        "Les dépenses personnelles",
        insurance,
      ].filter((x): x is string => Boolean(x));
  }
}

// ---------------------------------------------------------------------------
// Informations pratiques
// ---------------------------------------------------------------------------

export function defaultPracticalInfo(o: DetailsInput): string[] {
  const info: string[] = [];

  info.push(
    FRENCH_TERRITORIES.has(o.country)
      ? `Formalités : pour un ressortissant français, une carte d'identité en cours de validité suffit (${o.country}).`
      : `Formalités : passeport ou carte d'identité selon votre nationalité, visa éventuel. Les conditions d'entrée (${o.country}) évoluent : vérifiez-les avant de réserver sur la fiche « Conseils aux voyageurs » de diplomatie.gouv.fr.`,
  );

  if (o.category === "location-voiture") {
    info.push(
      "Permis de conduire en cours de validité exigé à la prise en charge ; les conditions de caution sont précisées sur le bon de réservation.",
      "Horaires du comptoir de location : indiqués sur le bon de réservation.",
    );
    return info;
  }

  if (includesFlight(o)) {
    info.push(
      "Bagages : la franchise cabine et soute dépend de la compagnie et du tarif, elle figure sur votre confirmation. Voir aussi notre article sur les règles du bagage cabine.",
      "Horaires de vol : communiqués avec la confirmation. Les compagnies peuvent les modifier jusqu'au départ ; tout changement vous est transmis.",
    );
  }

  if (o.category === "croisieres") {
    info.push("Heures d'embarquement et de débarquement : communiquées avec vos documents de voyage.");
  } else if (o.category === "hotels" || o.category === "parcs-loisirs" || o.subtype === "camping") {
    info.push("Heures d'arrivée et de départ : selon l'établissement, précisées sur le bon d'échange.");
  }

  info.push("Assistance francophone joignable 24 h/24 pendant le voyage, au numéro figurant sur votre bon d'échange.");
  return info;
}

// ---------------------------------------------------------------------------
// Annulation
// ---------------------------------------------------------------------------

/**
 * Conditions d'annulation : reprises mot pour mot des engagements déjà
 * affichés sur le site, sans nouveau chiffre ni nouvelle politique.
 *   - 30 jours : encart de réservation, tunnel de paiement, espace client
 *     (calcul de la date limite dans compte/reservations/[reference]).
 *   - 48 heures pour la location de voiture : présentation de la catégorie et
 *     descriptif de chaque offre de location.
 *   - 14 jours de remboursement et conditions du prestataire au-delà :
 *     fenêtre d'annulation de l'espace client (CancelBooking).
 *   - Confirmation sous 48 h : message renvoyé après une demande d'annulation.
 *   - Assurance : FAQ du site (motifs couverts, souscription à la réservation).
 */
export function cancellationPolicyFor(category: string): string[] {
  return [
    category === "location-voiture"
      ? "Annulation gratuite jusqu'à 48 heures avant la prise en charge du véhicule."
      : "Annulation gratuite jusqu'à 30 jours avant le départ.",
    "Les sommes déjà réglées sont remboursées sous 14 jours sur le moyen de paiement d'origine. Passée la date d'annulation gratuite, les conditions du prestataire s'appliquent.",
    "La demande se fait depuis votre espace client, rubrique « Mes réservations » ; un conseiller confirme le remboursement sous 48 h.",
    "L'assurance annulation, proposée uniquement au moment de la réservation, couvre notamment la maladie, l'accident et le licenciement, selon les motifs listés dans ses conditions.",
  ];
}

/** Ligne courte de l'encart de réservation. */
export function freeCancellationLine(category: string): string {
  return category === "location-voiture"
    ? "Annulation gratuite jusqu'à 48 h avant la prise en charge"
    : "Annulation gratuite jusqu'à 30 jours avant le départ";
}

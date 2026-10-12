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
export function includesFlight(o: DetailsInput): boolean {
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

// ---------------------------------------------------------------------------
// L'essentiel avant de réserver
// ---------------------------------------------------------------------------

/**
 * Réponses aux questions que posent les clients avant de valider une demande
 * (relevées dans de vrais messages reçus) : hébergement, vols et horaires,
 * bagages, repas et boissons, transferts, prix final. Chaque ligne se déduit
 * des données de l'offre ; ce que la base ne contient pas (nom de l'hôtel,
 * compagnie, horaires) est dit tel quel, avec le moment où l'information est
 * donnée, plutôt que d'être inventé.
 */
export function essentialsFor(o: DetailsInput & Pick<Offer, "included">): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const has = (needle: string) => o.included.some((i) => i.toLowerCase().includes(needle.toLowerCase()));
  const flight = includesFlight(o);
  const beforePayment = "précisés avec la confirmation de disponibilité, avant tout paiement";

  // Hébergement / produit.
  if (o.category === "location-voiture") {
    rows.push({
      label: "Véhicule",
      value: `${o.title}, prise en charge à ${o.destination} (${o.country}). Modèle exact selon le parc de l'agence de location, indiqué sur le bon de réservation.`,
    });
  } else if (o.category === "croisieres") {
    rows.push({
      label: "Navire et cabine",
      value: `${o.title}, embarquement à ${o.destination}. Nom du navire et catégorie de cabine ${beforePayment}.`,
    });
  } else if (o.category !== "vols") {
    const stars = o.stars > 0 ? ` ${o.stars}★` : "";
    rows.push({
      label: "Hébergement",
      value: `Établissement${stars} à ${o.destination} (${o.country}) : « ${o.title} ». Nom et adresse exacts ${beforePayment}.`,
    });
  }

  // Transport.
  if (o.category === "location-voiture") {
    // Pas de transport : la ligne n'aurait pas de sens.
  } else if (flight) {
    const mode = has("Vol ou train") ? "Vol ou train aller-retour" : "Vol aller-retour";
    rows.push({
      label: "Vols",
      value: `${mode} au départ de ${o.departureCity} compris. Compagnie et horaires ${beforePayment} : ils dépendent des places disponibles au jour de la demande, aucun horaire n'est annoncé avant.`,
    });
  } else {
    rows.push({
      label: "Transport",
      value:
        o.category === "croisieres"
          ? `Pas de vol : embarquement directement à ${o.destination}.`
          : `Non compris : vous rejoignez ${o.destination} par vos propres moyens.`,
    });
  }

  // Bagages.
  if (o.category === "vols") {
    rows.push({
      label: "Bagages",
      value: "Bagage cabine compris. Bagage en soute selon le tarif de la compagnie, précisé avant tout paiement.",
    });
  } else if (flight) {
    rows.push({
      label: "Bagages",
      value: "Franchise cabine et soute selon la compagnie et le tarif retenus, indiquée sur la confirmation avant tout paiement.",
    });
  }

  // Repas et boissons.
  const meals: Record<string, string> = {
    "Tout compris": "Tout compris : repas, boissons et snacks pendant tout le séjour, aux horaires et points de restauration de l'établissement.",
    "Pension complète": "Pension complète : petit-déjeuner, déjeuner et dîner. Boissons selon les conditions précisées avec la confirmation.",
    "Demi-pension": "Demi-pension : petit-déjeuner et dîner. Déjeuners et boissons non compris.",
    "Petit-déjeuner": "Petit-déjeuner compris. Autres repas et boissons non compris.",
    "Sans repas": "Aucun repas compris.",
  };
  if (meals[o.board]) rows.push({ label: "Repas et boissons", value: meals[o.board] });

  // Transferts.
  if (o.category !== "location-voiture") {
    rows.push({
      label: "Transferts",
      value: has("Transferts")
        ? "Transferts entre l'aéroport et l'hébergement compris, à l'aller et au retour."
        : "Non compris.",
    });
  }

  // Prix.
  rows.push({
    label: "Prix",
    value: `Prix par personne, ${has("frais de dossier") ? "taxes et frais de dossier compris" : "taxes comprises"}. Le montant du récapitulatif est celui enregistré pour votre demande : aucun frais de service ou de dossier n'y est ajouté. Seule option payante, l'assurance annulation, que vous cochez vous-même.`,
  });

  return rows;
}

/**
 * Le client peut-il indiquer une autre ville de départ ? Oui pour les forfaits
 * avec vol (séjours, circuits, croisières avec vol, week-ends) ; non pour un
 * vol sec, dont la ligne est le produit lui-même, ni pour ce qui n'a pas de
 * vol. Le choix est un souhait transmis au conseiller : aucune disponibilité
 * ni aucun prix par ville n'est connu en base, rien n'est donc affiché comme
 * garanti.
 */
export function allowsDepartureChoice(o: DetailsInput): boolean {
  return includesFlight(o) && o.category !== "vols";
}

/** Engagement répété sur la fiche, l'encart de réservation et le tunnel. */
export const NO_COMMITMENT_LINE = "Demande sans engagement : aucun paiement avant confirmation.";

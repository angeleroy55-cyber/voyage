import type { Offer, OfferDetails, OfferFlights, OfferVenue } from "@/lib/types";

/**
 * Compléments d'information de la fiche offre : programme, « ce prix ne
 * comprend pas », informations pratiques, conditions d'annulation.
 *
 * Règle de contenu : rien d'inventé. Deux niveaux :
 *   - Offre relevée sur le marché (`Offer.details` renseigné) : la fiche
 *     affiche l'établissement nommé, les vols, les repas et les transferts tels
 *     que relevés, rubrique par rubrique. Une rubrique que le relevé ne
 *     contient pas n'est pas affichée comme connue : elle renvoie à la
 *     confirmation de disponibilité, avant tout paiement.
 *   - Offre sans relevé : textes génériques déduits uniquement des données de
 *     l'offre (catégorie, formule, durée, ville de départ, pays) et des
 *     engagements déjà affichés ailleurs sur le site. Pas de nom d'hôtel, pas
 *     d'horaire, pas de règle d'entrée recopiée de mémoire (elles changent) :
 *     on renvoie vers la source officielle.
 * Dès que l'équipe saisit un texte précis au back-office (`Offer.itinerary`,
 * `notIncluded`, `practicalInfo`), il remplace le texte générique.
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

// ---------------------------------------------------------------------------
// Lecture de la colonne JSON `Offer.details`
// ---------------------------------------------------------------------------

function text(value: unknown, max = 400): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function list(value: unknown, maxItems = 40, maxLen = 160): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((v) => text(v, maxLen))
    .filter((v): v is string => Boolean(v))
    .slice(0, maxItems);
  return items.length > 0 ? items : undefined;
}

const VENUE_KINDS: OfferVenue["kind"][] = [
  "hotel",
  "residence",
  "club",
  "camping",
  "navire",
  "parc",
  "loueur",
];

/**
 * Lit la colonne JSON sans lui faire confiance : elle peut avoir été écrite
 * par un script de relevé ou, plus tard, par le back-office. Tout ce qui n'a
 * pas la bonne forme est ignoré plutôt que de faire échouer la page.
 */
export function parseOfferDetails(raw: unknown): OfferDetails | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const out: OfferDetails = {};

  const v = r.venue as Record<string, unknown> | undefined;
  const venueName = v && text(v.name, 160);
  if (v && venueName) {
    const kind = VENUE_KINDS.includes(v.kind as OfferVenue["kind"])
      ? (v.kind as OfferVenue["kind"])
      : "hotel";
    out.venue = {
      name: venueName,
      kind,
      stars: typeof v.stars === "number" && v.stars >= 1 && v.stars <= 5 ? v.stars : undefined,
      address: text(v.address, 200),
      distances: list(v.distances, 8, 80),
      facilities: list(v.facilities, 30, 60),
      dining: list(v.dining, 10, 120),
      rooms: list(v.rooms, 10, 100),
      checkIn: text(v.checkIn, 40),
      checkOut: text(v.checkOut, 40),
      localTax: text(v.localTax, 200),
    };
  }

  const f = r.flights as Record<string, unknown> | undefined;
  const from = f && text(f.from, 120);
  const to = f && text(f.to, 120);
  if (f && from && to) {
    out.flights = {
      from,
      to,
      direct: typeof f.direct === "boolean" ? f.direct : null,
      duration: text(f.duration, 120),
      airlines: list(f.airlines, 6, 60),
      baggage: text(f.baggage, 300),
      note: text(f.note, 300),
    };
  }

  out.meals = text(r.meals, 300);
  out.transfers = text(r.transfers, 300);

  if (Array.isArray(r.extra)) {
    const extra = r.extra
      .map((e) => {
        const o = e as Record<string, unknown> | null;
        const label = o && text(o.label, 60);
        const value = o && text(o.value, 400);
        return label && value ? { label, value } : null;
      })
      .filter((e): e is { label: string; value: string } => e !== null)
      .slice(0, 8);
    if (extra.length > 0) out.extra = extra;
  }

  return out.venue || out.flights || out.meals || out.transfers || out.extra ? out : undefined;
}

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
    o.board === "Tout compris" || o.board === "Pension complète" || o.board === "Formule à confirmer"
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

/**
 * Informations pratiques affichées sur la fiche.
 *
 * Une offre relevée sur le marché porte ses formalités d'entrée, sa monnaie et
 * son décalage horaire (sources officielles, voir `catalogue-market.json`) : on
 * y ajoute les lignes de service communes (bagages, horaires, assistance), sans
 * répéter la ligne « Formalités » générique. Un texte saisi au back-office reste,
 * lui, un remplacement complet, comme avant.
 */
export function practicalInfoFor(o: DetailsInput & { practicalInfo?: string[] }): string[] {
  const generic = defaultPracticalInfo(o);
  const own = o.practicalInfo ?? [];
  if (own.length === 0) return generic;
  const fromMarket = own[0].startsWith("Formalités d'entrée pour un ressortissant français (relevé du");
  return fromMarket ? [...own, ...generic.slice(1)] : own;
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
export function essentialsFor(
  o: DetailsInput & Pick<Offer, "included"> & { details?: OfferDetails },
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const has = (needle: string) => o.included.some((i) => i.toLowerCase().includes(needle.toLowerCase()));
  const flight = includesFlight(o);
  const beforePayment = "précisés avec la confirmation de disponibilité, avant tout paiement";
  const d = o.details;

  // Hébergement / produit.
  if (o.category === "location-voiture") {
    rows.push({
      label: d?.venue ? venueLabel(d.venue) : "Véhicule",
      value: d?.venue
        ? venueSentence(d.venue)
        : `${o.title}, prise en charge à ${o.destination} (${o.country}). Modèle exact selon le parc de l'agence de location, indiqué sur le bon de réservation.`,
    });
  } else if (o.category === "croisieres") {
    rows.push({
      label: d?.venue ? venueLabel(d.venue) : "Navire et cabine",
      value: d?.venue
        ? venueSentence(d.venue)
        : `${o.title}, embarquement à ${o.destination}. Nom du navire et catégorie de cabine ${beforePayment}.`,
    });
  } else if (o.category !== "vols") {
    // Un circuit relevé décrit son hébergement dans ses rubriques libres : pas de ligne générique en double.
    const accommodationInExtra = o.category === "circuits" && d?.extra?.some((e) => e.label === "Hébergement");
    if (accommodationInExtra) {
      // rien : la rubrique « Hébergement » de `extra` est affichée plus bas
    } else if (d?.venue) {
      rows.push({ label: venueLabel(d.venue), value: venueSentence(d.venue) });
    } else {
      const stars = o.stars > 0 ? ` ${o.stars}★` : "";
      rows.push({
        label: "Hébergement",
        value: `Établissement${stars} à ${o.destination} (${o.country}) : « ${o.title} ». Nom et adresse exacts ${beforePayment}.`,
      });
    }
  }

  // Transport.
  if (o.category === "location-voiture") {
    // Pas de transport : la ligne n'aurait pas de sens.
  } else if (flight) {
    const mode = has("Vol ou train") ? "Vol ou train aller-retour" : "Vol aller-retour";
    rows.push({
      label: "Vols",
      value: d?.flights
        ? flightSentence(mode, d.flights, o.departureCity)
        : `${mode} au départ de ${o.departureCity} compris. Compagnie et horaires ${beforePayment} : ils dépendent des places disponibles au jour de la demande, aucun horaire n'est annoncé avant.`,
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
      value:
        d?.flights?.baggage ??
        "Bagage cabine compris. Bagage en soute selon le tarif de la compagnie, précisé avant tout paiement.",
    });
  } else if (flight) {
    rows.push({
      label: "Bagages",
      value:
        d?.flights?.baggage ??
        "Franchise cabine et soute selon la compagnie et le tarif retenus, indiquée sur la confirmation avant tout paiement.",
    });
  }

  // Repas et boissons.
  const meals: Record<string, string> = {
    "Tout compris": "Tout compris : repas, boissons et snacks pendant tout le séjour, aux horaires et points de restauration de l'établissement.",
    "Pension complète": "Pension complète : petit-déjeuner, déjeuner et dîner. Boissons selon les conditions précisées avec la confirmation.",
    "Demi-pension": "Demi-pension : petit-déjeuner et dîner. Déjeuners et boissons non compris.",
    "Petit-déjeuner": "Petit-déjeuner compris. Autres repas et boissons non compris.",
    "Sans repas": "Aucun repas compris.",
    "Formule à confirmer": "Formule repas non précisée par l'organisateur : détaillée avec la confirmation de disponibilité, avant tout paiement.",
  };
  const mealsLine = d?.meals ?? meals[o.board];
  if (mealsLine) rows.push({ label: "Repas et boissons", value: mealsLine });

  // Transferts.
  if (o.category !== "location-voiture") {
    rows.push({
      label: "Transferts",
      value:
        d?.transfers ??
        (has("Transferts")
          ? "Transferts entre l'aéroport et l'hébergement compris, à l'aller et au retour."
          : "Non compris."),
    });
  }

  // Rubriques libres du relevé (taxe de séjour, formalités propres au produit…).
  for (const extra of d?.extra ?? []) rows.push(extra);

  // Prix.
  rows.push({
    label: "Prix",
    value: `Prix par personne, ${has("frais de dossier") ? "taxes et frais de dossier compris" : "taxes comprises"}. Le montant du récapitulatif est celui enregistré pour votre demande : aucun frais de service ou de dossier n'y est ajouté. Seule option payante, l'assurance annulation, que vous cochez vous-même.`,
  });

  return rows;
}

/** Intitulé de la rubrique selon le type d'établissement. */
export function venueLabel(venue: OfferVenue): string {
  switch (venue.kind) {
    case "navire":
      return "Navire";
    case "parc":
      return "Parc";
    case "loueur":
      return "Loueur";
    case "camping":
      return "Camping";
    default:
      return "Hébergement";
  }
}

/** Une phrase par établissement : nom, catégorie, adresse, chambres, horaires. */
function venueSentence(venue: OfferVenue): string {
  const head = `${venue.name}${venue.stars ? ` ${venue.stars}★` : ""}${venue.address ? `, ${venue.address}` : ""}.`;
  const parts = [head];
  if (venue.rooms?.length) parts.push(`Chambres : ${venue.rooms.join(", ")}.`);
  const times = [
    venue.checkIn ? `arrivée à partir de ${venue.checkIn}` : "",
    venue.checkOut ? `départ avant ${venue.checkOut}` : "",
  ].filter(Boolean);
  if (times.length) parts.push(`${times.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()));
  return parts.join(" ");
}

function flightSentence(mode: string, f: OfferFlights, departureCity: string): string {
  const route = `${f.from || departureCity} vers ${f.to}`;
  const stops = f.direct === true ? "vol direct" : f.direct === false ? "avec escale" : "";
  const detail = [stops, f.duration].filter(Boolean).join(", ");
  const parts = [`${mode} compris, ${route}${detail ? ` (${detail})` : ""}.`];
  parts.push(
    f.airlines?.length
      ? `Compagnies relevées sur cette route : ${f.airlines.join(", ")}. Horaires précisés avec la confirmation de disponibilité, avant tout paiement.`
      : "Compagnie et horaires précisés avec la confirmation de disponibilité, avant tout paiement.",
  );
  if (f.note) parts.push(f.note);
  return parts.join(" ");
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

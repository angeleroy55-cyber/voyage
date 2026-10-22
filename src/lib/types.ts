import type { BookingRules } from "./booking-rules";
/**
 * Slugs de navigation. Ils servent d'URL de premier niveau (`/sejours`,
 * `/circuits`), donc les renommer casse des liens : toute évolution passe par
 * une redirection dans `next.config.ts`.
 */
export type CategoryId =
  // Les 10 entrées du menu principal, dans l'ordre d'affichage.
  | "bons-plans-promos"
  | "derniere-minute"
  | "destinations"
  | "sejours"
  | "circuits"
  | "croisieres"
  | "hotels"
  | "vols"
  | "camping-escapades"
  | "location-voiture"
  // Regroupées sous « Voir plus de voyages ».
  | "tout-compris-clubs"
  | "sejours-france"
  | "parcs-loisirs"
  | "sur-mesure"
  | "groupes-entreprises"
  | "voyages-responsables"
  | "assurance-voyage";

export type Board =
  | "Tout compris"
  | "Pension complète"
  | "Demi-pension"
  | "Petit-déjeuner"
  | "Sans repas"
  | "Formule à confirmer"
  | "Vol seul";

export interface Category {
  id: CategoryId;
  /** Intitulé court, celui du menu. */
  label: string;
  /** Intitulé long pour le H1 et la balise title ; `label` si absent. */
  title?: string;
  icon: string;
  /** Fields the search form should render for this category. */
  form: Array<"origin" | "destination" | "dates" | "travellers" | "driver">;
  blurb: string;
  /** Voir `Category.kind` dans le schéma Prisma. */
  kind: CategoryKind;
  /** Règle de sélection, pour une catégorie `dynamique`. */
  rule?: OfferRule;
  /** Regroupée sous « Voir plus de voyages » au lieu du menu principal. */
  isOverflow?: boolean;
  /** Affiche le taux de remise en pourcentage sur les cartes. */
  showDiscountPercent?: boolean;
  /** Couleur du badge « type d'offre ». */
  accent?: CategoryAccent;
}

export type CategoryKind = "catalogue" | "dynamique" | "hub" | "editorial";
export type OfferRule = "promos" | "derniere-minute" | "tout-compris" | "france";
export type CategoryAccent = "navy" | "gold" | "teal" | "rose" | "violet" | "emerald";

/**
 * Établissement nommé par une offre : hôtel, résidence, club, camping, navire,
 * parc ou loueur de voiture. Tous les champs hors `name` et `kind` sont
 * facultatifs : une rubrique inconnue reste absente plutôt que remplie à la
 * main, et la fiche n'affiche que ce qui a été relevé.
 */
export interface OfferVenue {
  name: string;
  kind: "hotel" | "residence" | "club" | "camping" | "navire" | "parc" | "loueur";
  stars?: number;
  /** Adresse ou quartier. */
  address?: string;
  /** Repères de distance : « Plage : 150 m », « Centre-ville : 2 km ». */
  distances?: string[];
  /** Équipements et services, en mots-clés courts. */
  facilities?: string[];
  /** Restauration sur place : buffet, restaurants à la carte, bars. */
  dining?: string[];
  /** Types de chambre, de cabine ou de véhicule proposés. */
  rooms?: string[];
  checkIn?: string;
  checkOut?: string;
  /** Taxe de séjour ou frais locaux à régler sur place. */
  localTax?: string;
}

/** Vols compris dans l'offre, tels que relevés pour la route concernée. */
export interface OfferFlights {
  /** « Paris (CDG ou Orly) ». */
  from: string;
  /** « Bangkok (BKK) ». */
  to: string;
  /** `null` = non relevé : la fiche ne dit ni oui ni non. */
  direct: boolean | null;
  /** « environ 11 h 20 en vol direct ». */
  duration?: string;
  /** Compagnies, seulement quand le relevé les nomme. */
  airlines?: string[];
  baggage?: string;
  note?: string;
}

/** Fiche détaillée d'une offre (colonne JSON `Offer.details`). */
export interface OfferDetails {
  venue?: OfferVenue;
  flights?: OfferFlights;
  /** Formule repas en une phrase, si le relevé la précise. */
  meals?: string;
  /** Transferts aéroport, en une phrase. */
  transfers?: string;
  /** Rubriques libres de « L'essentiel avant de réserver ». */
  extra?: { label: string; value: string }[];
}

export interface Offer {
  slug: string;
  /** Numéro public GO-74990, visible de la carte à l'e-mail de confirmation. */
  reference: string;
  category: CategoryId;
  /** Libellé de la catégorie propriétaire, pour le badge « type d'offre ». */
  categoryLabel?: string;
  /** Couleur de ce badge. */
  categoryAccent?: CategoryAccent;
  /** Le pourcentage de remise est-il affiché pour cette catégorie ? */
  showDiscountPercent?: boolean;
  /** Sous-type interne : `vol_hotel`, `tout_compris`, `club`… */
  subtype?: string;
  title: string;
  /** Visuel principal. Absent sur le catalogue de démonstration, qui retombe sur `imageSeed`. */
  image?: string;
  /** Galerie complète, dans l'ordre défini au back-office. */
  images?: string[];
  /**
   * Crédits des visuels dont la licence impose une mention. Vide pour les
   * photos fournies par l'agence ou tombées dans le domaine public : il n'y a
   * alors personne à créditer, et une mention inutile alourdit la page.
   */
  imageCredits?: { text: string; href: string }[];
  destination: string;
  country: string;
  region: string;
  /** Continent du hub /destinations, déduit du pays si la base ne l'a pas. */
  continent?: string;
  imageSeed: string;
  /** Durée en jours ; `nights + 1` quand la donnée n'est pas saisie. */
  days?: number;
  nights: number;
  stars: number;
  board: Board;
  departureCity: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  /** Date de départ ferme, au format ISO `AAAA-MM-JJ`. */
  departureDate?: string;
  dates: string;
  tags: string[];
  amenities: string[];
  description: string;
  highlights: string[];
  included: string[];
  /** Saison commerciale (src/lib/seasons.ts), vide si l'offre se vend toute l'année. */
  season?: string;
  /** Compléments saisis au back-office ; vides, la fiche affiche un texte générique. */
  itinerary?: string[];
  notIncluded?: string[];
  practicalInfo?: string[];
  /** Fiche détaillée relevée sur le marché ; absente, la fiche reste générique. */
  details?: OfferDetails;
  /**
   * Règles du calendrier et de la fourchette de prix, résolues côté serveur
   * (offre > catégorie > défaut). Absentes sur le catalogue source statique,
   * qui n'est jamais rendu tel quel : le calendrier retombe alors sur les
   * valeurs par défaut de la catégorie.
   */
  rules?: BookingRules;
}

export interface Destination {
  slug: string;
  name: string;
  country: string;
  /** Continent du hub : Europe, Asie, Afrique du Nord… */
  continent?: string;
  /** Libellé commercial : Canaries, Îles grecques, Fluvial… */
  region?: string;
  /** Texte éditorial : ce qu'on vient chercher à cette destination. */
  blurb?: string;
  imageSeed: string;
  /** Visuel servi par la base ; à défaut, `imageSeed` fournit un placeholder. */
  image?: string;
  imageAlt?: string;
  /** Mention obligatoire du visuel, quand sa licence l'exige. */
  imageCredit?: string;
  imageCreditUrl?: string;
  fromPrice: number;
  offersCount: number;
}

export interface Review {
  author: string;
  city: string;
  score: number;
  date: string;
  trip: string;
  text: string;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** Corps de l'article : un paragraphe par ligne vide, comme au back-office. */
  body: string;
  category: string;
  readingTime: number;
  imageSeed: string;
  image?: string;
  imageAlt?: string;
}

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  promoTags: string[];
  position: number;
}

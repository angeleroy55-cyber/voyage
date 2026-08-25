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

export interface Offer {
  slug: string;
  /** Numéro public GSJ-XXXXXX, visible de la carte à l'e-mail de confirmation. */
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
  category: string;
  readingTime: number;
  imageSeed: string;
  image?: string;
}

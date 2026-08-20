export type CategoryId =
  | "vol-hotel"
  | "hotels"
  | "croisieres"
  | "circuits"
  | "vols"
  | "escapades"
  | "campings"
  | "voitures";

export type Board =
  | "Tout compris"
  | "Pension complète"
  | "Demi-pension"
  | "Petit-déjeuner"
  | "Sans repas"
  | "Vol seul";

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  /** Fields the search form should render for this category. */
  form: Array<"origin" | "destination" | "dates" | "travellers" | "driver">;
  blurb: string;
}

export interface Offer {
  slug: string;
  category: CategoryId;
  title: string;
  /** Visuel principal. Absent sur le catalogue de démonstration, qui retombe sur `imageSeed`. */
  image?: string;
  /** Galerie complète, dans l'ordre défini au back-office. */
  images?: string[];
  destination: string;
  country: string;
  region: string;
  imageSeed: string;
  nights: number;
  stars: number;
  board: Board;
  departureCity: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
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
  imageSeed: string;
  /** Visuel servi par la base ; à défaut, `imageSeed` fournit un placeholder. */
  image?: string;
  imageAlt?: string;
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
  position: number;
}

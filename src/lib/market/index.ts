import raw from "./catalogue-market.json";
import { continentOf } from "@/lib/data";
import { DEPARTURE_OFFSETS, type SourceOffer } from "@/lib/catalogue-source";
import type { Board, CategoryId, Offer, OfferDetails } from "@/lib/types";

/**
 * Catalogue de marché : produits réels relevés le 21 octobre 2026 chez
 * Logitravel (hôtels, forfaits, circuits, croisières) et Kayak (vols), puis
 * appliqués au catalogue source.
 *
 * `catalogue-market.json` est produit par le relevé (hors dépôt) et versionné,
 * comme `media/photos.json` : le seed n'appelle aucun réseau et deux
 * installations donnent le même catalogue. Il contient deux choses :
 *
 *   - `overlays` : pour une offre déjà au catalogue (clé = slug), ce qui change.
 *       mode « produit » : l'offre est rattachée à un produit réel (hôtel nommé,
 *                          circuit, croisière) ; titre, durée, formule, prix et
 *                          fiche détaillée sont remplacés ;
 *       mode « vol »     : même chose pour un vol sec (le titre reste la route) ;
 *       mode « prix_seul » : l'identité de l'offre ne change pas, seul le prix
 *                          est recalé sur le marché. C'est le cas des offres
 *                          visées par une demande client en cours, et de celles
 *                          pour lesquelles aucun produit comparable n'a été relevé.
 *   - `newOffers` : les offres ajoutées, déjà complètes.
 *
 * Règle de prix, appliquée à tout le fichier : prix GoSéjour = prix du marché
 * relevé moins 4 à 11 %, jamais sous un plancher (vols). La remise de chaque
 * offre est tirée de façon déterministe sur son slug.
 *
 * Aucune note ni aucun avis : un produit relevé sur le marché n'a pas d'avis
 * GoSéjour, et `rating` / `reviews` valent donc 0 (la fiche n'affiche rien).
 */

type Overlay = {
  mode: "produit" | "vol" | "prix_seul";
  gele?: boolean;
  title?: string;
  subtype?: string;
  departureCity?: string;
  days?: number;
  nights?: number;
  stars?: number;
  board?: Board;
  price: number;
  oldPrice: number;
  priceFloor?: number;
  referencePriceSource?: string;
  description?: string;
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  itinerary?: string[];
  practicalInfo?: string[];
  amenities?: string[];
  tags?: string[];
  details?: OfferDetails;
  rating?: number;
  reviews?: number;
};

type NewOffer = Overlay & {
  slug: string;
  category: CategoryId;
  subtype: string;
  title: string;
  destination: string;
  country: string;
  region: string;
  departureCity: string;
  nights: number;
  days: number;
  stars: number;
  board: Board;
};

const MARKET = raw as unknown as {
  releve: string;
  overlays: Record<string, Overlay>;
  newOffers: NewOffer[];
};

/** Étiquettes commerciales qui annonçaient des remises que la politique actuelle ne permet plus. */
const OBSOLETE_TAGS = new Set(["Vente flash", "Petit prix"]);

function cleanTags(tags: string[]): string[] {
  return tags.filter((t) => !OBSOLETE_TAGS.has(t));
}

function discountOf(price: number, oldPrice: number): number {
  return oldPrice > 0 ? Math.round((100 * (oldPrice - price)) / oldPrice) : 0;
}

/** Empreinte stable pour répartir les nouvelles offres parmi les existantes. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mergeOverlay(offer: SourceOffer, ov: Overlay): SourceOffer {
  const base: SourceOffer = {
    ...offer,
    price: ov.price,
    oldPrice: ov.oldPrice,
    discount: discountOf(ov.price, ov.oldPrice),
    referencePriceSource: ov.referencePriceSource,
    priceFloor: ov.priceFloor,
    tags: cleanTags(offer.tags),
  };
  if (ov.mode === "prix_seul") return base;

  if (ov.mode === "vol") {
    return {
      ...base,
      description: ov.description ?? offer.description,
      highlights: ov.highlights ?? offer.highlights,
      included: ov.included ?? offer.included,
      details: ov.details,
      rating: 0,
      reviews: 0,
    };
  }

  return {
    ...base,
    title: ov.title ?? offer.title,
    subtype: ov.subtype ?? offer.subtype,
    departureCity: ov.departureCity ?? offer.departureCity,
    days: ov.days ?? offer.days,
    nights: ov.nights ?? offer.nights,
    stars: ov.stars ?? offer.stars,
    board: ov.board ?? offer.board,
    description: ov.description ?? offer.description,
    highlights: ov.highlights ?? [],
    included: ov.included ?? [],
    amenities: ov.amenities ?? [],
    tags: ov.tags ?? [],
    itinerary: ov.itinerary,
    notIncluded: ov.notIncluded,
    practicalInfo: ov.practicalInfo,
    details: ov.details,
    rating: 0,
    reviews: 0,
  };
}

function toSourceOffer(n: NewOffer, index: number): SourceOffer {
  return {
    slug: n.slug,
    category: n.category,
    subtype: n.subtype,
    title: n.title,
    destination: n.destination,
    country: n.country,
    region: n.region,
    continent: continentOf(n.country),
    imageSeed: n.slug,
    days: n.days,
    nights: n.nights,
    stars: n.stars,
    board: n.board,
    departureCity: n.departureCity,
    price: n.price,
    oldPrice: n.oldPrice,
    discount: discountOf(n.price, n.oldPrice),
    priceFloor: n.priceFloor,
    referencePriceSource: n.referencePriceSource,
    rating: 0,
    reviews: 0,
    departureInDays: DEPARTURE_OFFSETS[index % DEPARTURE_OFFSETS.length],
    dates: "Départs plusieurs fois par semaine, selon disponibilité",
    tags: cleanTags(n.tags ?? []),
    amenities: n.amenities ?? [],
    description: n.description ?? "",
    highlights: n.highlights ?? [],
    included: n.included ?? [],
    notIncluded: n.notIncluded,
    itinerary: n.itinerary,
    practicalInfo: n.practicalInfo,
    details: n.details,
  };
}

/**
 * Applique le catalogue de marché au catalogue source : recouvre les offres
 * existantes puis y répartit les nouvelles, en les entrelaçant pour qu'aucune
 * catégorie ne voie ses nouveautés reléguées en fin de liste.
 */
export function applyMarket(base: SourceOffer[]): SourceOffer[] {
  const merged = base.map((o) => {
    const ov = MARKET.overlays[o.slug];
    return ov ? mergeOverlay(o, ov) : { ...o, tags: cleanTags(o.tags) };
  });

  const known = new Set(base.map((o) => o.slug));
  const added = MARKET.newOffers
    .filter((n) => !known.has(n.slug))
    .map((n, i) => toSourceOffer(n, base.length + i))
    // Ordre pseudo-aléatoire mais stable : les nouveautés se répartissent sur toute la liste.
    .sort((a, b) => hash(a.slug) - hash(b.slug));

  const out: SourceOffer[] = [];
  const step = added.length > 0 ? merged.length / added.length : Infinity;
  let next = 0;
  merged.forEach((o, i) => {
    while (next < added.length && i >= Math.floor(next * step + step / 2)) {
      out.push(added[next++]);
    }
    out.push(o);
  });
  while (next < added.length) out.push(added[next++]);
  return out;
}

export const MARKET_RELEVE = MARKET.releve;

/** Pour les vérifications : nombre de recouvrements par mode. */
export function marketStats() {
  const modes: Record<string, number> = {};
  for (const ov of Object.values(MARKET.overlays)) modes[ov.mode] = (modes[ov.mode] ?? 0) + 1;
  return { overlays: modes, newOffers: MARKET.newOffers.length };
}

export type { Offer };

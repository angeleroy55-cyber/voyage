import catalogue from "./photos.json";


/**
 * Photographies du catalogue, résolues à l'avance.
 *
 * Le fichier `photos.json` est produit par `npm run photos`, qui interroge
 * Wikimedia Commons, ne retient que des images utilisables commercialement et
 * enregistre pour chacune son auteur, sa licence et sa page d'origine.
 *
 * Il est versionné, et lu ici sans aucun appel réseau : le seed reste
 * reproductible et hors ligne, et une image ne peut pas disparaître entre deux
 * installations parce qu'un service tiers a bougé.
 *
 * Ces visuels illustrent la destination, jamais un établissement précis. Ils
 * tiennent la place des photos du prestataire, qui arriveront avec le flux
 * d'affiliation ou seront téléversées depuis le back-office : dans les deux
 * cas, l'image en base l'emporte sur celle-ci.
 */

export type CataloguePhoto = {
  url: string;
  licence: string;
  auteur: string;
  page: string;
};

const PHOTOS = catalogue as Record<string, CataloguePhoto[]>;

/**
 * Mention à afficher sous l'image.
 *
 * Vide pour le domaine public et CC0, qui n'imposent rien. Les licences à
 * attribution rendent la mention obligatoire : elle est donc calculée ici, au
 * même endroit que l'image, pour qu'on ne puisse pas afficher l'une sans
 * l'autre.
 */
export function creditFor(photo: CataloguePhoto): string {
  const licence = photo.licence.toLowerCase();
  if (!licence || licence.includes("public domain") || licence.includes("cc0")) return "";
  const auteur = photo.auteur?.trim();
  return auteur ? `${auteur} / ${photo.licence}` : photo.licence;
}

/** Les `count` premières photos d'une requête ; tableau vide si rien n'a été trouvé. */
export function photosFor(query: string, count = 5): CataloguePhoto[] {
  return (PHOTOS[query] ?? []).slice(0, count);
}

/** Première photo d'une requête, ou `null` si la recherche n'a rien donné. */
export function photoFor(query: string): CataloguePhoto | null {
  return PHOTOS[query]?.[0] ?? null;
}

export { photoQueryFor } from "./photo-query";

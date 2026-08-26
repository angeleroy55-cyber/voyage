import { randomInt } from "node:crypto";

/**
 * Référence lisible communiquée au client, sans caractères ambigus (0/O, 1/I) :
 * elle est dictée au téléphone et recopiée à la main.
 *
 * Le back-office enregistre les demandes prises par téléphone et le site les
 * demandes en ligne ; les deux passent par ici pour que le format reste unique.
 */
export function bookingReference(): string {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `GS-${suffix}`;
}

/**
 * Numéro public d'une offre : GSJ- suivi de six chiffres, ex. GSJ-048213.
 *
 * Six chiffres et un seul format pour toutes les catégories : c'est plus court
 * à dicter au téléphone qu'un code porteur de sens, et un numéro n'a pas à
 * révéler la catégorie d'une offre, qui peut changer.
 *
 * Le tirage n'est pas aléatoire, contrairement à celui d'une réservation : le
 * numéro vient d'un compteur strictement croissant (`src/server/references.ts`),
 * pour qu'aucun ne soit réattribué après une suppression.
 */
export function offerReference(counter: number): string {
  return `GSJ-${String(counter).padStart(6, "0")}`;
}

/** Clé du compteur dans la table `Counter`. */
export const OFFER_REFERENCE_COUNTER = "offer.reference";

/** Dernier numéro considéré comme déjà pris : la série commence à GSJ-048001. */
export const OFFER_REFERENCE_START = 48000;

/** Reconnaît un numéro d'offre, tel qu'il apparaît dans une URL ou une recherche. */
export function isOfferReference(value: string): boolean {
  return /^GSJ-\d{6}$/i.test(value.trim());
}

/** Forme canonique d'un numéro saisi à la main : « gsj 48213 » devient GSJ-048213. */
export function normaliseOfferReference(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits || digits.length > 6) return null;
  return offerReference(Number(digits));
}

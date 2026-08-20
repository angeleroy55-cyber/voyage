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

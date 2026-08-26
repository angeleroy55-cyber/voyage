import "server-only";
import { prisma } from "@/server/prisma";
import {
  OFFER_REFERENCE_COUNTER,
  OFFER_REFERENCE_START,
  offerReference,
} from "@/lib/reference";

/**
 * Attribution des numéros de référence des offres.
 *
 * Le cahier de catégorisation impose un numéro unique, persistant et jamais
 * recyclé, y compris après suppression : le support client doit pouvoir
 * retrouver un dossier des années plus tard. Un tirage aléatoire ne le garantit
 * pas, puisque rien ne l'empêche de retomber sur un numéro libéré. D'où un
 * compteur strictement croissant.
 *
 * Il vit dans la table `Counter` plutôt que dans une séquence PostgreSQL, que
 * `prisma db push` ne sait pas créer. L'incrément se fait côté serveur, par un
 * `UPDATE ... SET value = value + 1` : deux créations simultanées obtiennent
 * donc deux numéros distincts, sans verrou applicatif.
 */
export async function nextOfferReference(): Promise<string> {
  const row = await prisma.counter.upsert({
    where: { key: OFFER_REFERENCE_COUNTER },
    create: { key: OFFER_REFERENCE_COUNTER, value: OFFER_REFERENCE_START + 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });
  return offerReference(row.value);
}

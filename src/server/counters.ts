import { prisma } from "@/server/prisma";

/**
 * Recalcul des compteurs dénormalisés.
 *
 * `Offer.rating`, `Offer.reviewsCount`, `Destination.offersCount` et
 * `Destination.fromPrice` sont stockés plutôt que dérivés à la lecture : ils
 * apparaissent sur des listes de plusieurs dizaines de cartes, où les recalculer
 * à la volée imposerait une agrégation par ligne à chaque affichage.
 *
 * La contrepartie, c'est qu'ils se périment en silence. Toute action du
 * back-office qui touche un avis, une offre ou son rattachement doit donc
 * appeler la fonction correspondante — et `/admin/parametres` expose une reprise
 * complète pour rattraper les écarts hérités.
 */

/** Note et nombre d'avis d'une offre, à partir des seuls avis publiés. */
export async function recomputeOfferRating(offerId: string | null | undefined) {
  if (!offerId) return;

  const stats = await prisma.review.aggregate({
    where: { offerId, status: "published" },
    _avg: { score: true },
    _count: { _all: true },
  });

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      // Arrondi au dixième : c'est la précision affichée sur les cartes, et la
      // stocker évite que deux écrans affichent deux arrondis différents.
      rating: Math.round((stats._avg.score ?? 0) * 10) / 10,
      reviewsCount: stats._count._all,
    },
  });
}

/**
 * Nombre d'offres et prix d'appel d'une destination, à partir des seules offres
 * publiées qui lui sont rattachées.
 */
export async function recomputeDestinationStats(destinationId: string | null | undefined) {
  if (!destinationId) return;

  const stats = await prisma.offer.aggregate({
    where: { destinationId, status: "published" },
    _count: { _all: true },
    _min: { price: true },
  });

  await prisma.destination.update({
    where: { id: destinationId },
    data: {
      offersCount: stats._count._all,
      // Sans offre publiée, le prix d'appel saisi à la main est conservé : une
      // destination annoncée avant l'ouverture des ventes garde son « dès X € »
      // éditorial au lieu de tomber à 0 €.
      ...(stats._min.price != null ? { fromPrice: stats._min.price } : {}),
    },
  });
}

/**
 * Nombre de lignes dont le compteur stocké diverge de la réalité.
 *
 * Sert à annoncer l'effet de la reprise avant de la lancer : les valeurs du jeu
 * de démonstration sont éditoriales — des chiffres d'affichage saisis par le
 * seed, sans avis ni offre derrière — et la reprise les remplacerait par les
 * valeurs réelles, le plus souvent nulles. Compter d'abord évite de vider le
 * catalogue sur un clic.
 *
 * Les deux requêtes sont brutes : l'écart se mesure entre une colonne et une
 * agrégation de la table liée, ce que l'API de Prisma ne sait pas exprimer.
 * Elles ne portent aucune saisie, donc rien à échapper.
 */
export async function counterDrift(): Promise<{ offers: number; destinations: number }> {
  const [offers, destinations] = await Promise.all([
    prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT o.id
        FROM "Offer" o
        LEFT JOIN "Review" r ON r."offerId" = o.id AND r.status = 'published'
        GROUP BY o.id
        HAVING o.rating <> COALESCE(ROUND(AVG(r.score)::numeric, 1), 0)::double precision
            OR o."reviewsCount" <> COUNT(r.id)
      ) AS diverging
    `),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT d.id
        FROM "Destination" d
        LEFT JOIN "Offer" o ON o."destinationId" = d.id AND o.status = 'published'
        GROUP BY d.id
        HAVING d."offersCount" <> COUNT(o.id)
            OR (MIN(o.price) IS NOT NULL AND d."fromPrice" <> MIN(o.price))
      ) AS diverging
    `),
  ]);

  return {
    offers: Number(offers[0]?.count ?? 0),
    destinations: Number(destinations[0]?.count ?? 0),
  };
}

/** Reprise complète du catalogue, déclenchée depuis les réglages. */
export async function recomputeAllCounters(): Promise<{
  offers: number;
  destinations: number;
}> {
  const offers = await prisma.offer.findMany({ select: { id: true } });
  for (const offer of offers) {
    await recomputeOfferRating(offer.id);
  }

  const destinations = await prisma.destination.findMany({ select: { id: true } });
  for (const destination of destinations) {
    await recomputeDestinationStats(destination.id);
  }

  return { offers: offers.length, destinations: destinations.length };
}

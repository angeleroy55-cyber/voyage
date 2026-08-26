/**
 * Contrôle rapide de la reprise « catégorisation » : arborescence, numéros de
 * référence, dates de départ, sous-types.
 *
 *   npx tsx scripts/probe-categorisation.mts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 }),
});

const categories = await prisma.category.findMany({
  orderBy: { position: "asc" },
  include: { _count: { select: { offers: true } } },
});

console.log("MENU PRINCIPAL");
for (const c of categories.filter((c) => !c.isOverflow)) {
  console.log(
    `  /${c.slug.padEnd(20)} ${c.kind.padEnd(10)} ${String(c._count.offers).padStart(3)} offres  ${c.label}`,
  );
}
console.log("VOIR PLUS DE VOYAGES");
for (const c of categories.filter((c) => c.isOverflow)) {
  console.log(
    `  /${c.slug.padEnd(20)} ${c.kind.padEnd(10)} ${String(c._count.offers).padStart(3)} offres  ${c.label}`,
  );
}

const offres = await prisma.offer.findMany({
  select: { reference: true, subtype: true, continent: true, departureDate: true, days: true, nights: true },
  orderBy: { reference: "asc" },
});
console.log(`\nOFFRES : ${offres.length}`);
console.log(`  références    : ${offres[0]?.reference} … ${offres[offres.length - 1]?.reference}`);
console.log(`  uniques       : ${new Set(offres.map((o) => o.reference)).size}`);
console.log(`  sans sous-type: ${offres.filter((o) => !o.subtype).length}`);
console.log(`  sans continent: ${offres.filter((o) => !o.continent).length}`);
console.log(`  sans date     : ${offres.filter((o) => !o.departureDate).length}`);

const limite = new Date();
limite.setDate(limite.getDate() + 21);
console.log(
  `  dernière minute (départ < 21 j) : ${offres.filter((o) => o.departureDate && o.departureDate <= limite).length}`,
);

const promos = await prisma.offer.count({ where: { oldPrice: { not: null } } });
console.log(`  avec prix de référence : ${promos}`);

await prisma.$disconnect();

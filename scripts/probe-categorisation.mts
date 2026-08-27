/**
 * Contrôle du catalogue et de l'arborescence.
 *
 *   npx tsx scripts/probe-categorisation.mts
 *
 * Vérifie ce qu'aucun type ne garantit : que chaque catégorie a bien des offres
 * derrière, que les numéros de référence sont uniques et au bon format, que les
 * saisons sont toutes pourvues, et que la remise annoncée tient la fourchette.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { SEASONS, inSeason } from "../src/lib/seasons";
import { subtypeLabel } from "../src/lib/constants";

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
    `  /${c.slug.padEnd(21)} ${c.kind.padEnd(10)} ${String(c._count.offers).padStart(3)} offres  ${c.label}`,
  );
}
console.log("VOIR PLUS DE VOYAGES");
for (const c of categories.filter((c) => c.isOverflow)) {
  console.log(
    `  /${c.slug.padEnd(21)} ${c.kind.padEnd(10)} ${String(c._count.offers).padStart(3)} offres  ${c.label}`,
  );
}

const offres = await prisma.offer.findMany({
  where: { status: "published" },
  select: {
    reference: true,
    subtype: true,
    continent: true,
    departureDate: true,
    price: true,
    oldPrice: true,
    category: { select: { slug: true } },
  },
});

console.log(`\nOFFRES : ${offres.length}`);
const refs = offres.map((o) => o.reference).sort();
console.log(`  références    : ${refs[0]} … ${refs[refs.length - 1]}`);
console.log(`  uniques       : ${new Set(refs).size}`);
console.log(`  format GO-    : ${refs.filter((r) => /^GO-\d{5}$/.test(r)).length}`);
console.log(`  sans continent: ${offres.filter((o) => !o.continent).length}`);
console.log(`  sans date     : ${offres.filter((o) => !o.departureDate).length}`);

const remises = offres
  .filter((o) => o.oldPrice && o.oldPrice > o.price)
  .map((o) => Math.round(((o.oldPrice! - o.price) / o.oldPrice!) * 100));
console.log(
  `  remises       : de ${Math.min(...remises)} % à ${Math.max(...remises)} % (moyenne ${Math.round(remises.reduce((a, b) => a + b, 0) / remises.length)} %)`,
);

console.log("\nFORMULES");
const parFormule = new Map<string, number>();
for (const o of offres) {
  if (!o.subtype) continue;
  parFormule.set(o.subtype, (parFormule.get(o.subtype) ?? 0) + 1);
}
for (const [id, n] of [...parFormule.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${id.padEnd(20)} ${String(n).padStart(3)}  ${subtypeLabel(id) || "INCONNU"}`);
}

console.log("\nSAISONS");
for (const s of SEASONS) {
  const n = offres.filter(
    (o) => o.departureDate && inSeason(o.departureDate, s),
  ).length;
  console.log(`  ${s.id.padEnd(14)} ${String(n).padStart(3)} départs  ${s.label}`);
}

await prisma.$disconnect();

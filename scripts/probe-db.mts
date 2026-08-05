// Sonde de diagnostic : compare requêtes séquentielles et concurrentes.
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const max = Number(process.argv[2] ?? 1);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max }),
});

try {
  const one = await prisma.offer.count();
  console.log(`séquentiel (max=${max}) : ${one} offres`);

  const results = await Promise.all([
    prisma.offer.count(),
    prisma.destination.count(),
    prisma.review.count(),
    prisma.post.count(),
    prisma.category.count(),
    prisma.setting.count(),
  ]);
  console.log(`concurrent (max=${max}) : ${results.join(", ")}`);
} catch (error) {
  const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.log(`ECHEC (max=${max}) : ${detail}`);
} finally {
  await prisma.$disconnect();
}

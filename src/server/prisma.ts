import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * La connexion ne dépend que de DATABASE_URL. Le schéma est figé sur le
 * provider « postgresql » : en local PGlite parle le même protocole, en
 * production on pointe vers un PostgreSQL hébergé sans rien changer d'autre.
 */
function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL est absente. Lancer `npm run db:local` ou renseigner .env.local.",
    );
  }

  // PGlite exécute les requêtes une par une : un pool large n'accélère rien en
  // local et multiplie les connexions à garder ouvertes. Un PostgreSQL
  // classique, lui, gagne à en avoir plusieurs.
  const local = /(^|@)(127\.0\.0\.1|localhost)[:/]/.test(url);

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      max: local ? 4 : 10,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 30_000,
    }),
  });
}

// Le client est mémorisé dans une variable de module : une seule instance par
// processus. `globalThis` ne sert qu'au rechargement à chaud du développement,
// qui réévalue les modules et ouvrirait sinon un pool à chaque sauvegarde.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let client: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  client ??= globalForPrisma.prisma ?? createClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/**
 * Client ouvert à la première utilisation plutôt qu'à l'import, pour qu'un
 * module qui n'a besoin que de logique pure n'exige pas une base disponible.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const target = getPrisma();
    const value: unknown = Reflect.get(target, property);
    // Les méthodes Prisma utilisent `this` : les renvoyer nues depuis le Proxy
    // les détacherait du client réel.
    return typeof value === "function" ? value.bind(target) : value;
  },
});

/**
 * PostgreSQL local, sans rien installer.
 *
 *   npm run db:local
 *
 * PGlite est un vrai PostgreSQL compilé en WebAssembly. Ce script l'expose sur
 * le protocole réseau de PostgreSQL : Prisma, psql ou n'importe quel client s'y
 * connectent comme à un serveur classique, via DATABASE_URL.
 *
 * Les données vivent dans .pglite/ (ignoré par git). Pour repartir de zéro :
 * supprimer ce dossier, puis relancer `npm run db:push && npm run db:seed`.
 *
 * En production, on ne lance pas ce script : il suffit de pointer DATABASE_URL
 * vers un PostgreSQL hébergé (Neon, Supabase, RDS…), le schéma est identique.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.PGLITE_PORT ?? 5432);
const HOST = process.env.PGLITE_HOST ?? "127.0.0.1";
const DATA_DIR = process.env.PGLITE_DIR ?? ".pglite";

const db = await PGlite.create({ dataDir: DATA_DIR });
await db.waitReady;

// maxConnections vaut 1 par défaut : la deuxième connexion serait fermée, et
// Next en ouvre plusieurs (pool applicatif, workers de rendu). Les requêtes
// restent sérialisées par la file interne de PGlite ; ce réglage n'autorise que
// des connexions simultanées, pas des requêtes simultanées.
const server = new PGLiteSocketServer({
  db,
  port: PORT,
  host: HOST,
  maxConnections: Number(process.env.PGLITE_MAX_CONNECTIONS ?? 40),
});
await server.start();

console.log(`PostgreSQL (PGlite) en écoute sur ${HOST}:${PORT}`);
console.log(`Données : ${DATA_DIR}`);
console.log("Ctrl+C pour arrêter.");

async function shutdown() {
  console.log("\nArrêt du serveur…");
  await server.stop();
  await db.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

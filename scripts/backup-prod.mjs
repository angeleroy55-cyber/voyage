/**
 * Sauvegarde JSON des tables touchées par la mise à jour du catalogue.
 *
 *   node scripts/backup-prod.mjs [dossier]
 *
 * Lit DATABASE_URL (ordre .env.local puis .env, comme le reste du projet) et écrit
 * un fichier daté dans `dossier` (par défaut ~/gosejour-sauvegardes). Ce dossier est
 * volontairement hors du dépôt : `Booking` contient des noms et des e-mails de clients.
 *
 * Lecture seule : aucune écriture en base.
 */
import { config as loadEnv } from "dotenv";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import pg from "pg";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL est absente.");

const TABLES = ["Offer", "OfferImage", "Destination", "Counter", "Booking", "Setting", "Category"];
const dossier = process.argv[2] ?? join(homedir(), "gosejour-sauvegardes");
// Droits réservés au propriétaire : la sauvegarde contient des noms et e-mails de clients.
mkdirSync(dossier, { recursive: true, mode: 0o700 });
chmodSync(dossier, 0o700); // au cas où le dossier existait déjà avec des droits plus larges

const client = new pg.Client({ connectionString: url });
await client.connect();

const sauvegarde = { date: new Date().toISOString(), base: new URL(url).host, tables: {} };
for (const table of TABLES) {
  const { rows } = await client.query(`SELECT * FROM "${table}"`);
  sauvegarde.tables[table] = rows;
  console.log(`${table} : ${rows.length} ligne(s)`);
}
await client.end();

const fichier = join(dossier, `sauvegarde-${sauvegarde.date.slice(0, 19).replace(/[:T]/g, "-")}.json`);
writeFileSync(fichier, JSON.stringify(sauvegarde), { mode: 0o600 });
console.log(`Écrit : ${fichier}`);

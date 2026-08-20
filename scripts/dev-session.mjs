/**
 * Imprime un cookie de session du back-office pour le compte « owner » du seed.
 *
 * Sert à vérifier le rendu des pages protégées sans passer par le formulaire de
 * connexion (utile en test automatisé ou avec curl). Strictement réservé au
 * développement : la commande refuse de s'exécuter en production, où fabriquer
 * une session hors du parcours de connexion n'a aucune raison d'être.
 *
 *   node scripts/dev-session.mjs
 */
import "dotenv/config";
import { createHmac } from "node:crypto";
import pg from "pg";

if (process.env.NODE_ENV === "production") {
  console.error("Refusé : cette commande est réservée au développement.");
  process.exit(1);
}

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret) {
  console.error("ADMIN_SESSION_SECRET est absente de .env.");
  process.exit(1);
}

// Requête SQL directe plutôt que le client Prisma généré : ce script tourne
// hors du bundle Next, où le client ESM n'est pas résolvable tel quel.
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(
  `SELECT id, email, name, role FROM "AdminUser"
   WHERE role = 'owner' AND active = true
   ORDER BY "createdAt" ASC LIMIT 1`,
);
await client.end();

const owner = rows[0];
if (!owner) {
  console.error("Aucun compte « owner » actif : lancez `npm run db:seed`.");
  process.exit(1);
}

const payload = Buffer.from(
  JSON.stringify({
    sub: owner.id,
    email: owner.email,
    name: owner.name,
    role: owner.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  }),
  "utf8",
).toString("base64url");

const signature = createHmac("sha256", secret).update(payload).digest("base64url");
console.log(`gosejour_admin=${payload}.${signature}`);

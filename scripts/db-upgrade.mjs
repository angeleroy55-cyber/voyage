/**
 * Préparation de la base avant `prisma db push`.
 *
 *   npm run db:upgrade
 *
 * `db push` ne sait pas ajouter une colonne à la fois obligatoire et unique sur
 * une table déjà peuplée : il propose de tout effacer. Ce script comble l'écart
 * en amont, en ajoutant la colonne, en la remplissant, puis en laissant Prisma
 * poser la contrainte sur des données déjà valides.
 *
 * Il est idempotent et sans effet sur une base vide : à la première
 * installation, les tables n'existent pas encore et chaque bloc est ignoré.
 */
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL est absente.");

/** Premier numéro attribué : les références commencent donc à GSJ-048001. */
const REFERENCE_START = 48000;

const client = new pg.Client({ connectionString });
await client.connect();

try {
  // Le compteur de références doit exister avant la reprise : c'est lui qui
  // garantit qu'un numéro rendu par une suppression n'est jamais réattribué.
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Counter" (
      "key"   TEXT PRIMARY KEY,
      "value" INTEGER NOT NULL DEFAULT 0
    )
  `);
  await client.query(
    `INSERT INTO "Counter" ("key", "value") VALUES ('offer.reference', $1)
     ON CONFLICT ("key") DO NOTHING`,
    [REFERENCE_START],
  );

  const hasOffers = await client.query(`SELECT to_regclass('"Offer"') AS table`);
  if (!hasOffers.rows[0]?.table) {
    console.log("Base neuve : rien à reprendre.");
  } else {
    await client.query(`ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "reference" TEXT`);

    // Les offres déjà en base reçoivent leur numéro dans l'ordre de création,
    // pour que l'ancienneté d'un dossier se lise dans sa référence.
    const filled = await client.query(`
      WITH manquantes AS (
        SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rang
        FROM "Offer"
        WHERE "reference" IS NULL OR "reference" = ''
      ),
      depart AS (
        SELECT "value" AS base FROM "Counter" WHERE "key" = 'offer.reference'
      )
      UPDATE "Offer" o
      SET "reference" = 'GSJ-' || lpad((depart.base + manquantes.rang)::text, 6, '0')
      FROM manquantes, depart
      WHERE o.id = manquantes.id
    `);

    // Le compteur repart du plus grand numéro attribué, jamais en dessous.
    await client.query(`
      UPDATE "Counter" c
      SET "value" = GREATEST(
        c."value",
        COALESCE((SELECT MAX(NULLIF(substring("reference" from 5), '')::int) FROM "Offer"), 0)
      )
      WHERE c."key" = 'offer.reference'
    `);

    if (filled.rowCount > 0) {
      console.log(`Références attribuées : ${filled.rowCount} offre(s).`);
    }

    // La contrainte est posée ici, sur des données déjà remplies et uniques.
    // Laissée à `db push`, elle déclencherait un avertissement de perte de
    // données et exigerait --accept-data-loss, un drapeau qu'on ne veut pas
    // rendre banal dans les scripts du projet.
    await client.query(`ALTER TABLE "Offer" ALTER COLUMN "reference" SET NOT NULL`);
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Offer_reference_key" ON "Offer" ("reference")`,
    );

    // Origine des offres.
    //
    // La colonne est ajoutée sans valeur par défaut : les lignes déjà en base
    // reçoivent donc NULL, et ce sont exactement celles d'avant la bascule vers
    // le catalogue réel. On les marque `catalogue` pour que le seed puisse
    // retirer celles qui n'y figurent plus. `db push` posera ensuite la valeur
    // par défaut `admin`, qui protège toute offre saisie au back-office.
    await client.query(`ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "origin" TEXT`);
    const marquees = await client.query(
      `UPDATE "Offer" SET "origin" = 'catalogue' WHERE "origin" IS NULL`,
    );
    if (marquees.rowCount > 0) {
      console.log(`Offres rattachées au catalogue : ${marquees.rowCount}.`);
    }
  }

  const aDestinations = await client.query(`SELECT to_regclass('"Destination"') AS table`);
  if (aDestinations.rows[0]?.table) {
    // Même logique que pour les offres : les lignes antérieures à la bascule
    // sont celles du catalogue, les suivantes viendront du back-office.
    await client.query(`ALTER TABLE "Destination" ADD COLUMN IF NOT EXISTS "origin" TEXT`);
    const marquees = await client.query(
      `UPDATE "Destination" SET "origin" = 'catalogue' WHERE "origin" IS NULL`,
    );
    if (marquees.rowCount > 0) {
      console.log(`Destinations rattachées au catalogue : ${marquees.rowCount}.`);
    }
  }

  const { rows } = await client.query(
    `SELECT "value" FROM "Counter" WHERE "key" = 'offer.reference'`,
  );
  console.log(`Compteur de références : ${rows[0]?.value ?? REFERENCE_START}.`);
} finally {
  await client.end();
}

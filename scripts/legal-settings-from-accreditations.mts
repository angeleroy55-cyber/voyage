/**
 * Renseigne les réglages `legal.*` à partir du texte « Accréditations &
 * garanties » déjà saisi au back-office (`site.accreditations`).
 *
 *   npx tsx scripts/legal-settings-from-accreditations.mts           # simulation
 *   npx tsx scripts/legal-settings-from-accreditations.mts --ecrire  # applique
 *
 * Les valeurs sont extraites du texte existant, ligne par ligne, jamais
 * tapées ici : le script n'invente aucune mention légale. Une clé déjà
 * renseignée n'est jamais écrasée, et une ligne introuvable laisse la clé vide.
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const write = process.argv.includes("--ecrire");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }),
});

try {
  const row = await prisma.setting.findUnique({ where: { key: "site.accreditations" } });
  const lines = (row?.value ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const after = (pattern: RegExp) => {
    const line = lines.find((l) => pattern.test(l));
    return line ? line.replace(pattern, "").replace(/^[\s:]+/, "").trim() : "";
  };

  // La raison sociale est la ligne qui précède celle du SIRET.
  const siretIndex = lines.findIndex((l) => /^SIRET\b/i.test(l));
  const values: Record<string, string> = {
    "legal.company": siretIndex > 0 ? lines[siretIndex - 1] : "",
    "legal.siret": after(/^SIRET\s*:?/i),
    "legal.address": after(/^Adresse\s*:?/i),
    "legal.registration": after(/^Agent de voyages immatricul[ée]+\s*:?/i),
    "legal.guarantee": after(/^Garantie financi[èe]re\s*:?/i),
  };

  for (const [key, value] of Object.entries(values)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (existing?.value) {
      console.log(`${key} : déjà renseignée, conservée (${existing.value})`);
      continue;
    }
    if (!value) {
      console.log(`${key} : introuvable dans le texte, laissée vide`);
      continue;
    }
    console.log(`${key} : ${value}`);
    if (write) await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(write ? "Écritures appliquées." : "Simulation : rien n'a été écrit (ajouter --ecrire).");
} finally {
  await prisma.$disconnect();
}

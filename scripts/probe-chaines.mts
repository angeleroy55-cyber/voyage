/**
 * Vérifie que chaque action du back-office se répercute réellement sur le site
 * public. Le contrôle ne se fait pas sur des fonctions isolées mais sur le HTML
 * servi par l'application : c'est le seul niveau qui prouve que la chaîne
 * complète (base, requête, rendu) tient debout.
 *
 *   npx tsx scripts/probe-chaines.mts          (le serveur doit tourner)
 *
 * Le script restaure l'état initial de chaque enregistrement qu'il touche.
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const BASE = process.env.PROBE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 4 }),
});

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  OK   ${label}`);
  } else {
    failed++;
    console.log(`  ECHEC ${label}${detail ? ` : ${detail}` : ""}`);
  }
}

async function html(path: string): Promise<string> {
  const response = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} a répondu ${response.status}`);
  return response.text();
}

async function main() {
  console.log(`Cible : ${BASE}\n`);

  // --- 1. Publication d'une offre -----------------------------------------
  console.log("1. Offre : brouillon masqué / publiée visible");
  const offer = await prisma.offer.findFirst({
    where: { status: "published" },
    include: { category: true },
  });
  if (!offer) throw new Error("aucune offre publiée pour le test");

  const listUrl = `/recherche/${offer.category.slug}`;
  check("offre publiée présente en liste", (await html(listUrl)).includes(offer.title));

  await prisma.offer.update({ where: { id: offer.id }, data: { status: "draft" } });
  check("passée en brouillon, retirée de la liste", !(await html(listUrl)).includes(offer.title));

  const detail = await fetch(`${BASE}/offre/${offer.slug}`, { cache: "no-store" });
  check("fiche du brouillon introuvable (404)", detail.status === 404, `reçu ${detail.status}`);

  await prisma.offer.update({ where: { id: offer.id }, data: { status: "published" } });
  check("republiée, de nouveau visible", (await html(listUrl)).includes(offer.title));

  // --- 2. Modération des avis ---------------------------------------------
  console.log("\n2. Avis : en attente masqué / publié visible");
  const marker = `Temoignage de controle ${Date.now()}`;
  const review = await prisma.review.create({
    data: { author: "Sonde Automatique", score: 9, text: marker, status: "pending" },
  });
  check("avis en attente absent de l'accueil", !(await html("/")).includes(marker));

  await prisma.review.update({ where: { id: review.id }, data: { status: "published" } });
  check("avis publié visible sur l'accueil", (await html("/")).includes(marker));
  await prisma.review.delete({ where: { id: review.id } });

  // --- 3. Réglages ---------------------------------------------------------
  console.log("\n3. Réglages : en-tête et pied de page");
  const previousPhone = (await prisma.setting.findUnique({ where: { key: "site.phone" } }))?.value;
  const testPhone = "01 23 45 67 89";
  await prisma.setting.upsert({
    where: { key: "site.phone" },
    update: { value: testPhone },
    create: { key: "site.phone", value: testPhone },
  });
  check("téléphone modifié repris sur la vitrine", (await html("/")).includes(testPhone));
  if (previousPhone !== undefined) {
    await prisma.setting.update({ where: { key: "site.phone" }, data: { value: previousPhone } });
  }

  // --- 4. Catégories -------------------------------------------------------
  console.log("\n4. Catégorie désactivée : retirée de la navigation");
  const category = await prisma.category.findFirst({ where: { active: true, slug: "campings" } });
  if (category) {
    await prisma.category.update({ where: { id: category.id }, data: { active: false } });
    const withoutIt = await html("/");
    check(
      "catégorie désactivée absente du menu",
      !withoutIt.includes(`/recherche/${category.slug}`),
    );
    await prisma.category.update({ where: { id: category.id }, data: { active: true } });
    check("réactivée, de retour dans le menu", (await html("/")).includes(`/recherche/${category.slug}`));
  }

  // --- 5. Réservation ------------------------------------------------------
  console.log("\n5. Réservation : écriture puis lecture back-office");
  const booking = await prisma.booking.create({
    data: {
      reference: `GS-TEST${Date.now() % 100000}`,
      offerId: offer.id,
      customerName: "Sonde Automatique",
      customerEmail: "sonde@example.test",
      travellers: 2,
      totalPrice: offer.price * 2,
      status: "pending",
    },
  });
  const pending = await prisma.booking.count({ where: { status: "pending" } });
  check("réservation enregistrée et comptée « à traiter »", pending > 0);
  await prisma.booking.delete({ where: { id: booking.id } });

  // --- 6. Abonnés ----------------------------------------------------------
  console.log("\n6. Newsletter : inscription idempotente");
  const address = `sonde-${Date.now()}@example.test`;
  await prisma.subscriber.upsert({
    where: { email: address },
    update: { interests: ["Croisières"] },
    create: { email: address, interests: ["Croisières"] },
  });
  await prisma.subscriber.upsert({
    where: { email: address },
    update: { interests: ["Circuits"] },
    create: { email: address, interests: ["Circuits"] },
  });
  const subscribers = await prisma.subscriber.count({ where: { email: address } });
  check("réinscription met à jour au lieu de dupliquer", subscribers === 1);
  await prisma.subscriber.delete({ where: { email: address } });

  // --- 7. Avis rattaché à une offre ---------------------------------------
  console.log("\n7. Avis d'offre : visible sur la fiche une fois publié");
  const offerMarker = `Avis de controle offre ${Date.now()}`;
  const offerReview = await prisma.review.create({
    data: {
      author: "Sonde Offre",
      score: 8.5,
      text: offerMarker,
      status: "pending",
      offerId: offer.id,
    },
  });
  const offerUrl = `/offre/${offer.slug}`;
  check("avis en attente absent de la fiche", !(await html(offerUrl)).includes(offerMarker));
  await prisma.review.update({ where: { id: offerReview.id }, data: { status: "published" } });
  check("avis publié visible sur la fiche", (await html(offerUrl)).includes(offerMarker));
  await prisma.review.delete({ where: { id: offerReview.id } });

  // --- 8. Article de blog ---------------------------------------------------
  console.log("\n8. Article : brouillon masqué / publié lisible");
  const postTitle = `Article de controle ${Date.now()}`;
  const post = await prisma.post.create({
    data: {
      slug: `controle-${Date.now()}`,
      title: postTitle,
      excerpt: "Article créé par la sonde de vérification.",
      body: "Premier paragraphe.\n\nSecond paragraphe.",
      status: "draft",
    },
  });
  check("brouillon absent de la liste du blog", !(await html("/blog")).includes(postTitle));
  const draftPage = await fetch(`${BASE}/blog/${post.slug}`, { cache: "no-store" });
  check("page du brouillon introuvable (404)", draftPage.status === 404, `reçu ${draftPage.status}`);

  await prisma.post.update({ where: { id: post.id }, data: { status: "published" } });
  check("publié, présent dans la liste", (await html("/blog")).includes(postTitle));
  check("page de l'article lisible", (await html(`/blog/${post.slug}`)).includes("Second paragraphe"));
  await prisma.post.delete({ where: { id: post.id } });

  // --- 9. Garde du back-office --------------------------------------------
  console.log("\n9. Accès : back-office protégé");
  for (const path of [
    "/admin",
    "/admin/offres",
    "/admin/equipe",
    "/admin/profil",
    "/admin/reservations",
    "/admin/abonnes",
  ]) {
    const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const redirected =
      response.status === 307 && (response.headers.get("location") ?? "").includes("/admin/connexion");
    check(`${path} exige une session`, redirected, `statut ${response.status}`);
  }

  console.log(`\n${passed} contrôle(s) réussi(s), ${failed} échec(s).`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("\nInterrompu :", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

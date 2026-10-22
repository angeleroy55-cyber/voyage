// Sonde : le catalogue de marché respecte la politique de prix et la répartition demandées.
//
//   npx tsx scripts/probe-market.mts
//
// Vérifie, sur src/lib/market/catalogue-market.json :
//   - chaque prix est entre 4 et 11 % sous son prix de référence ;
//   - aucun prix ne passe sous son plancher (vols) ;
//   - les slugs sont uniques, y compris face au catalogue source ;
//   - 200 nouvelles offres, dont au moins un quart en Asie ;
//   - aucune note ni aucun avis (rating et reviews valent 0).
import assert from "node:assert/strict";
import { OFFERS } from "../src/lib/catalogue-source";
import { continentOf } from "../src/lib/data";
import { applyMarket, marketStats } from "../src/lib/market";

const catalogue = applyMarket(OFFERS);
const stats = marketStats();
console.log("Recouvrements :", stats.overlays, "| nouvelles offres :", stats.newOffers);

assert.equal(stats.newOffers, 200, "200 nouvelles offres");
assert.equal(new Set(catalogue.map((o) => o.slug)).size, catalogue.length, "slugs uniques");

const source = new Set(OFFERS.map((o) => o.slug));
const nouvelles = catalogue.filter((o) => !source.has(o.slug));
assert.equal(nouvelles.length, 200);

const asie = nouvelles.filter((o) => continentOf(o.country) === "Asie").length;
console.log(`Asie : ${asie} nouvelles offres sur ${nouvelles.length} (${Math.round((100 * asie) / nouvelles.length)} %)`);
assert.ok(asie >= nouvelles.length / 4, "au moins un quart en Asie");

let remises = 0;
let min = 100;
let max = 0;
for (const o of catalogue) {
  const releve = o.referencePriceSource?.startsWith("Logitravel") || o.referencePriceSource?.startsWith("Kayak") || o.referencePriceSource?.startsWith("Relevé");
  if (!releve || !o.oldPrice) continue;
  const pct = (100 * (o.oldPrice - o.price)) / o.oldPrice;
  min = Math.min(min, pct);
  max = Math.max(max, pct);
  assert.ok(pct >= 3.95 && pct <= 11.05, `${o.slug} : remise ${pct.toFixed(1)} % hors de 4 à 11 %`);
  if (o.priceFloor) assert.ok(o.price >= o.priceFloor, `${o.slug} : prix ${o.price} sous le plancher ${o.priceFloor}`);
  remises++;
}
console.log(`${remises} offres au prix de marché : remise de ${min.toFixed(1)} à ${max.toFixed(1)} %.`);

for (const o of nouvelles) {
  assert.equal(o.rating, 0, `${o.slug} : pas de note inventée`);
  assert.equal(o.reviews, 0, `${o.slug} : pas d'avis inventés`);
  assert.ok(o.details, `${o.slug} : fiche détaillée présente`);
}
console.log("Catalogue de marché conforme.");

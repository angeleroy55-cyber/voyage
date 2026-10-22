// Sonde : le calendrier propose bien 15 à 20 dates par mois complet, pour chaque route.
//
//   npx tsx scripts/probe-departure-days.mts
import assert from "node:assert/strict";
import { bookableDaysInMonth, resolveBookingRules } from "../src/lib/booking-rules";
import { departureWeekdaysFor, excludedWeekdaysFor } from "../src/lib/departure-days";

const villes = ["Paris", "Lyon", "Marseille", "Nantes", "Bordeaux", "Toulouse", "Nice", "Lille"];
const pays = ["Thaïlande", "Maroc", "Espagne", "Japon", "Égypte", "Italie", "Tunisie", "Grèce", "Vietnam", "Mexique"];

let routes = 0;
let min = 99;
let max = 0;

for (const departureCity of villes) {
  for (const country of pays) {
    for (const weekend of [false, true]) {
      const excluded = excludedWeekdaysFor({ departureCity, country, weekend });
      assert.equal(excluded.split(",").length, 3, "trois jours exclus exactement");
      assert.equal(departureWeekdaysFor({ departureCity, country, weekend }).length, 4);

      const rules = resolveBookingRules({
        categorySlug: "sejours",
        category: null,
        offer: { nights: 7, price: 500, oldPrice: 560, excludedWeekdays: excluded },
      });
      // Aujourd'hui fixé loin avant les mois testés : aucun effet de bord de fenêtre.
      const today = new Date(2026, 0, 1);
      for (let month = 1; month <= 7; month++) {
        const n = bookableDaysInMonth(rules, 2026, month, today);
        min = Math.min(min, n);
        max = Math.max(max, n);
        assert.ok(n >= 15 && n <= 20, `${departureCity}/${country}: ${n} dates en 2026-${month + 1}`);
      }
      routes++;
    }
  }
}

console.log(`${routes} routes vérifiées : ${min} à ${max} dates par mois complet.`);

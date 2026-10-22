#!/usr/bin/env python3
"""Recalcule les offres « vols » à partir des prix observés sur Kayak.

reference = bas de la fourchette de prix habituels de la route (aller-retour, par personne)
plancher  = prix aller-retour le plus bas observé (jamais vendu en dessous)
Sortie    : out_flights.json { slug: overlay }
"""
import collections
import json
import math
import re
import statistics
import sys

sys.path.insert(0, ".")
import iata as I
import pricing_model as PM

NOW = "21/10/2026"
inv = json.load(open("inventaire-offres.json"))
kayak = {r["route"]: r for r in json.load(open("kayak-parsed.json")) if r.get("status") == 200 and r.get("rt_min")}


def fr_duration(s):
    if not s:
        return None
    m = re.match(r"(\d+)h\s*(\d+)?", s)
    if not m:
        return None
    h, mn = int(m.group(1)), int(m.group(2) or 0)
    return f"{h} h {mn:02d}" if mn else f"{h} h"


def main():
    out, rep = {}, collections.Counter()
    for o in inv:
        if o["categorie"] != "vols":
            continue
        code = I.CODES.get(o["depart"], "PAR")
        ia = I.IATA.get(o["destination"])
        r = kayak.get(f"{code}>{ia}") if ia else None
        if not r and ia:
            r = kayak.get(f"PAR>{ia}")  # repli : même destination depuis Paris
            if r:
                rep["repli_depuis_paris"] += 1
        if not r:
            rep["sans_donnee"] += 1
            continue
        floor = r["rt_min"]
        low = r.get("usual_low") or int(round(floor * 1.25))
        ref = max(low, math.ceil(floor / 0.93))
        pr = PM.price_from_reference(ref, o["slug"], floor)
        dur = fr_duration(r.get("direct_duration"))
        airlines = [a for a in (r.get("direct_airlines") or []) if "autres" not in a]
        direct_from = None
        if r.get("direct_usual_low"):
            direct_from = int(math.ceil(r["direct_usual_low"] * 0.93))
        elif r.get("direct_min"):
            direct_from = int(math.ceil(r["direct_min"] * 0.95))
        dest = o["destination"]
        origin = o["depart"]
        parts = [f"Vol aller-retour {origin} – {dest}, tarif à partir de {pr['price']} € par personne."]
        if dur:
            parts.append(f"Durée moyenne d'un vol direct : {dur}.")
        if airlines:
            parts.append(f"Vols directs proposés par {', '.join(airlines)}.")
        elif r.get("direct_min") is None and not dur:
            parts.append("Pas de vol direct relevé sur cette route : une escale est à prévoir.")
        flights = {
            "from": f"{origin}",
            "to": f"{dest} ({ia})",
            "direct": None,
            "duration": f"environ {dur} en vol direct" if dur else None,
            "airlines": airlines or None,
            "baggage": "Franchise bagages selon la compagnie et le tarif retenus, précisée avant tout paiement.",
            "note": (f"Tarif de base, un vol avec escale est possible. Vol direct à partir d'environ {direct_from} €." if direct_from else "Tarif de base, un vol avec escale est possible."),
        }
        out[o["slug"]] = {
            "slug": o["slug"],
            "mode": "vol",
            "price": pr["price"],
            "oldPrice": ref,
            "priceFloor": floor,
            "discountPct": pr["real_discount_pct"],
            "referencePriceSource": f"Kayak, relevé du {NOW} : prix habituels {r.get('usual_low')}–{r.get('usual_high')} €, mini observé {floor} €",
            "description": " ".join(parts),
            "highlights": [h for h in [
                f"Vol aller-retour {origin} – {dest}",
                f"Vol direct possible, durée moyenne {dur}" if dur else None,
                f"Vols directs : {', '.join(airlines)}" if airlines else None,
                f"Tarif minimum observé sur la route : {floor} €",
            ] if h],
            "included": [f"Vol aller-retour {origin} – {dest}", "Taxes aériennes comprises dans le tarif"],
            "details": {"flights": {k: v for k, v in flights.items() if v is not None}},
            "rating": 0,
            "reviews": 0,
        }
        rep["ok"] += 1
    json.dump(out, open("out_flights.json", "w"), ensure_ascii=False, indent=1)
    print(dict(rep))
    ratios = [out[o["slug"]]["price"] / o["price"] for o in inv if o["slug"] in out]
    print("variation de prix des vols: médiane x", round(statistics.median(ratios), 2), "min", round(min(ratios), 2), "max", round(max(ratios), 2))
    for s in list(out)[:4]:
        o = next(x for x in inv if x["slug"] == s)
        print(o["title"], o["price"], "->", out[s]["price"], "| plancher", out[s]["priceFloor"], "| ref", out[s]["oldPrice"])


if __name__ == "__main__":
    main()

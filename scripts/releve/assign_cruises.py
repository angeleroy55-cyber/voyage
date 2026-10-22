#!/usr/bin/env python3
"""Rattache chaque croisière existante à une croisière réelle relevée (navire, itinéraire, pension)."""
import collections
import glob
import json
import re
import statistics
import sys
import unicodedata

sys.path.insert(0, ".")
import pricing_model as PM

NOW = "21/10/2026"
inv = json.load(open("inventaire-offres.json"))
frozen = {r["slug"] for r in json.load(open("offres-gelees.json")) if r["actives"] > 0}
FACTS = {}
for f in glob.glob("releves/*.json"):
    for r in json.load(open(f)).get("faits_pays", []):
        FACTS.setdefault(r["pays"], r)


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


cands = []
for f, typ in (("releves/croisieres-mer.json", "croisiere_maritime"), ("releves/croisieres-fleuve.json", "croisiere_fluviale")):
    for c in json.load(open(f))["croisieres"]:
        if c.get("prix") and c.get("duree_jours") and c.get("itineraire_jours"):
            c["_subtype"] = typ
            cands.append(c)
print(len(cands), "croisières candidates avec prix et itinéraire")


def nights_of(c):
    return c.get("duree_nuits") or c["duree_jours"] - 1


def port_match(o, c):
    d = norm(o["destination"])
    if o["destination"] == "Rouen":
        d = "paris"
    hay = norm((c.get("port_groupe") or "") + " " + (c.get("port_embarquement") or ""))
    return d in hay or any(t in hay for t in d.split("-") if len(t) > 4)


def practical(country):
    f = FACTS.get(country)
    if not f or not f.get("formalites_francais"):
        return []
    txt = f["formalites_francais"].strip()
    if len(txt) > 520:
        txt = txt[:517].rsplit(" ", 1)[0] + "…"
    return [f"Formalités d'entrée pour un ressortissant français (relevé du {NOW}) : {txt}"]


def overlay(o, c):
    pr = PM.price_from_reference(c["prix"], o["slug"])
    nights = nights_of(c)
    days = c["duree_jours"]
    pension = c.get("pension") or "Pension complète"
    board = "Tout compris" if "tout" in pension.lower() and "inclus" in pension.lower() else ("Pension complète" if "complète" in pension.lower() or not pension else "Pension complète")
    ports = ", ".join(c.get("escales") or [])
    title = f"{c['nom']} — {c['navire']}" if c.get("navire") else c["nom"]
    inc = [i[0].upper() + i[1:] for i in (c.get("inclus") or [])][:10]
    notinc = [i[0].upper() + i[1:] for i in (c.get("non_inclus") or [])][:8]
    if c.get("frais_service") and "inclus" not in str(c.get("frais_service")).lower():
        notinc.append("Frais de service à bord : " + str(c["frais_service"])[:120])
    desc = (
        f"{c['nom']} à bord du {c['navire']} ({c['compagnie']}), {days} jours / {nights} nuits."
        f" Embarquement à {c.get('port_embarquement') or o['destination']}"
        + (f", débarquement à {c['port_debarquement']}" if c.get("port_debarquement") and c["port_debarquement"] != c.get("port_embarquement") else "")
        + (f". Escales : {ports}." if ports else ".")
    )
    return {
        "slug": o["slug"],
        "mode": "produit",
        "title": title,
        "subtype": c["_subtype"],
        "days": days,
        "nights": nights,
        "stars": 0,
        "board": board,
        "price": pr["price"],
        "oldPrice": c["prix"],
        "discountPct": pr["real_discount_pct"],
        "referencePriceSource": f"Logitravel, relevé du {NOW}, croisière du {c['date_depart'][8:]}/{c['date_depart'][5:7]}/{c['date_depart'][:4]}" if c.get("date_depart") else f"Logitravel, relevé du {NOW}",
        "description": desc,
        "itinerary": c["itineraire_jours"],
        "included": inc,
        "notIncluded": notinc,
        "practicalInfo": practical(o["country"]) + ["Prix par personne en cabine double, selon la catégorie de cabine indiquée à la confirmation."],
        "highlights": [f"Navire : {c['navire']} ({c['compagnie']})", f"{len(c.get('escales') or [])} escales" if c.get("escales") else "Itinéraire détaillé jour par jour"] + ([c["services_navire"][0]] if c.get("services_navire") else []),
        "amenities": [s[:60] for s in (c.get("services_navire") or [])][:8],
        "details": {
            "venue": {
                "name": f"{c['navire']} ({c['compagnie']})",
                "kind": "navire",
                "facilities": [s[:60] for s in (c.get("services_navire") or [])][:12] or None,
                "dining": [str(c["pension_detail"])[:200]] if c.get("pension_detail") else ([pension] if pension else None),
                "rooms": [{"interieure": "Intérieure", "exterieure": "Extérieure", "balcon": "Balcon", "suite": "Suite"}.get(k, k.capitalize()) for k in (c.get("prix_cabines") or {}).keys()] or None,
            },
            "meals": (c.get("pension_detail") or pension)[:300],
            "transfers": ("Vols en option : " + str(c["vols_option"])[:200]) if c.get("vols_option") else "Non précisés par l'organisateur : à confirmer avec la disponibilité, avant tout paiement.",
        },
        "rating": 0,
        "reviews": 0,
        "source": {"url": c.get("url"), "navire": c.get("navire"), "date": c.get("date_depart")},
    }


def main():
    out, rep = {}, collections.Counter()
    used = set()
    by_type_per_night = collections.defaultdict(list)
    for c in cands:
        by_type_per_night[c["_subtype"]].append(c["prix"] / max(nights_of(c), 1))
    med = {t: statistics.median(v) for t, v in by_type_per_night.items()}
    cr = sorted((o for o in inv if o["categorie"] == "croisieres"), key=lambda o: o["position"])
    for o in cr:
        pool = [c for c in cands if id(c) not in used and c["_subtype"] == o["subtype"] and port_match(o, c)
                and abs(nights_of(c) - o["nights"]) <= max(3, 0.4 * o["nights"])]
        if not pool:
            ref = int(round(med.get(o["subtype"], 120) * o["nights"]))
            pr = PM.price_from_reference(ref, o["slug"])
            out[o["slug"]] = {"slug": o["slug"], "mode": "prix_seul", "price": pr["price"], "oldPrice": ref, "discountPct": pr["real_discount_pct"],
                              "referencePriceSource": f"Logitravel, relevé du {NOW}, prix médian par nuit des croisières {'fluviales' if o['subtype'].endswith('fluviale') else 'maritimes'}",
                              "gele": o["slug"] in frozen}
            rep["prix_seul"] += 1
            continue
        best = min(pool, key=lambda c: abs(nights_of(c) - o["nights"]) + (0 if c["_subtype"] == o["subtype"] else 5))
        used.add(id(best))
        ov = overlay(o, best)
        if o["slug"] in frozen:
            ov = {k: ov[k] for k in ("slug", "price", "oldPrice", "discountPct", "referencePriceSource")}
            ov.update(mode="prix_seul", gele=True)
            rep["gele"] += 1
        else:
            rep["produit"] += 1
        out[o["slug"]] = ov
    json.dump(out, open("out_cruises.json", "w"), ensure_ascii=False, indent=1)
    pool = [c for c in cands if id(c) not in used]
    json.dump(pool, open("out_cruises_pool.json", "w"), ensure_ascii=False)
    print(dict(rep), "| pool restant:", len(pool))
    ratios = [out[o["slug"]]["price"] / o["price"] for o in cr if o["slug"] in out]
    print("variation de prix: médiane x", round(statistics.median(ratios), 2), "min", round(min(ratios), 2), "max", round(max(ratios), 2))


if __name__ == "__main__":
    main()

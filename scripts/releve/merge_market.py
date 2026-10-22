#!/usr/bin/env python3
"""Assemble le catalogue de marché : recouvrements des offres existantes + 200 nouvelles offres.

Sortie : /Users/fvfl73g71wfv/Downloads/voyage/src/lib/market/catalogue-market.json
"""
import collections
import glob
import json
import re
import sys

sys.path.insert(0, ".")

NOW = "21/10/2026"
inv = {o["slug"]: o for o in json.load(open("inventaire-offres.json"))}
FACTS = {}
for f in glob.glob("releves/*.json"):
    for r in json.load(open(f)).get("faits_pays", []):
        FACTS.setdefault(r["pays"], r)

import os

NORM = lambda t: re.sub(r"[^a-z0-9]", "", (t or "").lower())
HOTEL_URL = json.load(open("hotel-urls.json")) if os.path.exists("hotel-urls.json") else {}
HOTEL_DETAILS = {}
if os.path.exists("hotel_details.json"):
    for d in json.load(open("hotel_details.json")).values():
        HOTEL_DETAILS[d["url"]] = d


def enrich_venue(o):
    """Ajoute équipements et horaires relevés sur la fiche de l'hôtel, quand elle a été lue."""
    det = o.get("details") or {}
    v = det.get("venue")
    if not v or v.get("kind") not in ("hotel", "club"):
        return 0
    url = HOTEL_URL.get(NORM(v["name"]))
    d = HOTEL_DETAILS.get(url) if url else None
    if not d:
        return 0
    fac = list(dict.fromkeys((v.get("facilities") or []) + d.get("facilities", [])))[:16]
    if fac:
        v["facilities"] = fac
        o["amenities"] = fac[:6]
    if d.get("checkIn"):
        v["checkIn"] = d["checkIn"]
    if d.get("checkOut"):
        v["checkOut"] = d["checkOut"]
    return 1


# noms de pays du catalogue -> noms des fiches de formalités
FACT_ALIAS = {"Île Maurice": "Maurice", "Tchéquie": "République tchèque"}


def practical(country):
    f = FACTS.get(FACT_ALIAS.get(country, country))
    if not f:
        return []
    lines = []
    if f.get("formalites_francais"):
        txt = f["formalites_francais"].strip()
        if len(txt) > 520:
            txt = txt[:517].rsplit(" ", 1)[0] + "…"
        lines.append(f"Formalités d'entrée pour un ressortissant français (relevé du {NOW}) : {txt} Vérifiez-les avant de réserver sur diplomatie.gouv.fr.")
    if f.get("monnaie"):
        lines.append(f"Monnaie : {f['monnaie']}.")
    if f.get("decalage_horaire_vs_paris"):
        lines.append(f"Décalage horaire avec Paris : {f['decalage_horaire_vs_paris']}.")
    return lines


def clean(d):
    """Retire les valeurs vides et les clés de travail."""
    out = {}
    for k, v in d.items():
        if k in ("source", "discountPct", "mode", "gele"):
            continue
        if v is None or v == [] or v == "":
            continue
        if isinstance(v, dict):
            v = clean_details(v)
            if not v:
                continue
        out[k] = v
    return out


def clean_details(d):
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            v = clean_details(v)
        if v is None or v == [] or v == "" or v == {}:
            continue
        out[k] = v
    return out


def short_source(s):
    if not s:
        return None
    keep = {}
    for k in ("page", "url", "hotel", "navire", "departure", "date", "date_from", "price_displayed", "pp_night"):
        if s.get(k) is not None:
            keep[k] = s[k]
    return keep or None


def main():
    overlays = {}
    for f in ("out_stays.json", "out_flights.json", "out_circuits.json", "out_cruises.json"):
        for slug, ov in json.load(open(f)).items():
            o = clean(ov)
            o["mode"] = ov.get("mode", "produit")
            if ov.get("gele"):
                o["gele"] = True
            src = short_source(ov.get("source"))
            if src:
                o["source"] = src
            overlays[slug] = o
    # formalités sur toutes les offres existantes à produit (circuits/croisières l'ont déjà)
    for slug, ov in overlays.items():
        if ov["mode"] == "produit" and "practicalInfo" not in ov:
            pi = practical(inv[slug]["country"])
            if pi:
                ov["practicalInfo"] = pi

    new = []
    for o in json.load(open("out_new.json")):
        n = clean(o)
        n["new"] = True
        n.setdefault("practicalInfo", practical(o["country"]))
        if not n["practicalInfo"]:
            n.pop("practicalInfo")
        src = short_source(o.get("source"))
        if src:
            n["source"] = src
        new.append(n)

    enriched = sum(enrich_venue(o) for o in list(overlays.values()) + new)
    print("fiches hôtel appliquées:", enriched)

    # contrôles de cohérence
    problems = []
    for slug, ov in overlays.items():
        if ov["mode"] == "produit" and not ov.get("title"):
            problems.append(("sans titre", slug))
        if ov.get("price") and ov.get("oldPrice") and ov["price"] >= ov["oldPrice"]:
            problems.append(("prix >= référence", slug))
    slugs = [n["slug"] for n in new]
    dup = [s for s, c in collections.Counter(slugs).items() if c > 1]
    clash = [s for s in slugs if s in inv]
    print("recouvrements:", len(overlays), "dont produit:", sum(1 for o in overlays.values() if o["mode"] == "produit"), "| nouvelles:", len(new), "| doublons de slug:", dup, "| collisions avec l'existant:", clash)
    print("problèmes:", problems[:5], len(problems))
    # remise réelle
    disc = [100 * (o["oldPrice"] - o["price"]) / o["oldPrice"] for o in list(overlays.values()) + new if o.get("price") and o.get("oldPrice")]
    print("remise réelle min/max/moy:", round(min(disc), 1), round(max(disc), 1), round(sum(disc) / len(disc), 1))
    out = {"releve": "2026-10-21", "overlays": overlays, "newOffers": new}
    path = os.environ.get("CATALOGUE_MARKET", "catalogue-market.json")
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
    print("écrit:", path, round(os.path.getsize(path) / 1e6, 2), "Mo")


if __name__ == "__main__":
    main()

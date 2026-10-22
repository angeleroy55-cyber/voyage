#!/usr/bin/env python3
"""Rattache chaque circuit existant à un circuit réel relevé (itinéraire, inclus, pension) et recalcule le prix.

Sortie : out_circuits.json { slug: overlay } ; out_circuits_pool.json (circuits non utilisés, pour les nouvelles offres)
"""
import collections
import glob
import json
import math
import re
import statistics
import sys

sys.path.insert(0, ".")
import pricing_model as PM

NOW = "21/10/2026"
inv = json.load(open("inventaire-offres.json"))
frozen = {r["slug"] for r in json.load(open("offres-gelees.json")) if r["actives"] > 0}

BIG_COUNTRIES = {"France", "Italie", "Espagne", "Royaume-Uni", "Canada", "États-Unis", "Australie", "Chine", "Inde", "Argentine", "Pérou"}
FRENCH_DEPARTURES = {"Paris", "Lyon", "Marseille", "Nice", "Toulouse", "Bordeaux", "Nantes", "Strasbourg", "Lille", "Montpellier", "Grenoble"}
OK_DEPARTURES = FRENCH_DEPARTURES | {"Genève", "Bruxelles"}

# faits par pays
FACTS = {}
for f in glob.glob("releves/*.json"):
    for r in json.load(open(f)).get("faits_pays", []):
        FACTS.setdefault(r["pays"], r)

cands_all = []
for f in sorted(glob.glob("releves/circuits-*.json")):
    for c in json.load(open(f))["circuits"]:
        if c.get("prix") and c.get("duree_jours") and 600 > c["prix"] / max(c["duree_jours"], 1) > 25:
            c["_f"] = f
            cands_all.append(c)
# dédoublonnage par url + date
seen = {}
for c in cands_all:
    seen.setdefault((c["url"], c.get("date_depart")), c)
cands_all = list(seen.values())


def has_detail(c):
    return bool(c.get("etapes")) and len(c["etapes"]) >= 4


def clean_title(nom: str) -> str:
    t = nom
    # parenthèses de gestion : durée, nuits « sur mesure », organisateur, millésime
    t = re.sub(r"\s*\((?:[^)]*(?:jours?|nuits?|mesure|Fram|TUI|Salaün|Départs?|20\d\d)[^)]*)\)", "", t, flags=re.I)
    t = re.sub(r"\s*[-–]\s*(Fram|TUI|Salaün[^-–]*)$", "", t, flags=re.I)
    t = re.sub(r"\s*[-–]\s*(Départs?|Limité|Petit groupe|Groupe)[^,]*$", "", t, flags=re.I)
    t = re.sub(r"\s*[-–]\s*\d+\s*J\s*/\s*\d+\s*N.*$", "", t, flags=re.I)
    t = re.sub(r"\s*[-–]\s*20\d\d\s*$", "", t)
    t = re.sub(r"\s*\(?20(26|27)\)?\s*$", "", t)
    t = re.sub(r"^Circuit\s+", "", t) if len(t) > 24 else t
    return t.strip(" -–")


def parse_board(pension: str, inclus: list):
    p = (pension or "").lower()
    allin = " ".join(inclus or []).lower()
    if not p.strip() and not allin.strip():
        return "Formule à confirmer"
    if "sans repas" in p or "logement seul" in p or "aucun repas" in p:
        return "Sans repas"
    if "tout compris" in p or "all inclusive" in p:
        return "Tout compris"
    if "pension complète" in p or ("petit" in p and "déjeuner" in p and "dîner" in p and p.count("déjeuner") >= 2):
        return "Pension complète"
    if "demi-pension" in p or ("petit" in p and "dîner" in p):
        return "Demi-pension"
    if "petit-déjeuner" in p or "petits-déjeuners" in p or "petit déjeuner" in p:
        return "Petit-déjeuner"
    if "pension complète" in allin:
        return "Pension complète"
    if "demi-pension" in allin:
        return "Demi-pension"
    if "petit" in allin and "déjeuner" in allin:
        return "Petit-déjeuner"
    return "Formule à confirmer"


def parse_stars(heb: str):
    m = re.search(r"(\d)\s*\*", heb or "")
    return int(m.group(1)) if m else 0


def daylabel(step: str) -> str:
    return step.strip()


def cost(o, c):
    days_o = o["days"] or o["nights"] + 1
    cst = 0.5 * abs(days_o - c["duree_jours"])
    want_free = o["subtype"] == "circuit_libre"
    t = c.get("type")
    if t:
        is_free = t in ("libre", "autotour")
        cst += 0 if is_free == want_free else 2.5
    low = (c["nom"] + " " + " ".join(c.get("etapes") or [])).lower()
    if o["destination"].lower() in low:
        cst -= 2.0
    d = c.get("depart_ville")
    cst += 0 if d == "Paris" else (0.6 if d in FRENCH_DEPARTURES else (1.5 if d in ("Genève", "Bruxelles") else (1.0 if d is None else 99)))
    cst -= 1.5 if has_detail(c) else 0
    cst += 0.12 * abs(math.log(max(c["prix"], 1) / max(o["ancien_prix"] or c["prix"], 1)))
    return cst


def practical(country):
    f = FACTS.get(country)
    if not f:
        return []
    lines = []
    if f.get("formalites_francais"):
        txt = f["formalites_francais"].strip()
        if len(txt) > 520:
            txt = txt[:517].rsplit(" ", 1)[0] + "…"
        lines.append(f"Formalités d'entrée pour un ressortissant français (relevé du {NOW}) : {txt}")
    if f.get("monnaie"):
        lines.append(f"Monnaie : {f['monnaie']}.")
    if f.get("decalage_horaire_vs_paris"):
        lines.append(f"Décalage horaire avec Paris : {f['decalage_horaire_vs_paris']}.")
    return lines


def overlay(o, c):
    price = PM.price_from_reference(c["prix"], o["slug"])
    days, nights = c["duree_jours"], c["duree_nuits"] or c["duree_jours"] - 1
    board = parse_board(c.get("pension"), c.get("inclus"))
    stars = parse_stars(c.get("hebergement"))
    dep = c.get("depart_ville")
    dep = dep if dep in OK_DEPARTURES else "Paris"
    steps = [daylabel(s) for s in (c.get("etapes") or [])]
    free = c.get("type") in ("libre", "autotour")
    includes = [i[0].upper() + i[1:] for i in (c.get("inclus") or [])][:12]
    notinc = [i[0].upper() + i[1:] for i in (c.get("non_inclus") or [])][:10]
    parts = [f"Circuit de {days} jours / {nights} nuits : {clean_title(c['nom'])}."]
    if c.get("hebergement"):
        parts.append(f"Hébergement : {c['hebergement']}.")
    if c.get("guide"):
        parts.append(f"Guide {c['guide']}." if c["guide"] not in ("null",) else "")
    if c.get("vols_inclus"):
        parts.append(f"Vols au départ de {dep} compris.")
    return {
        "slug": o["slug"],
        "mode": "produit",
        "title": clean_title(c["nom"]),
        "subtype": "circuit_libre" if free else "circuit_accompagne",
        "departureCity": dep,
        "days": days,
        "nights": nights,
        "stars": stars,
        "board": board,
        "price": price["price"],
        "oldPrice": c["prix"],
        "discountPct": price["real_discount_pct"],
        "referencePriceSource": f"Logitravel/organisateur, relevé du {NOW}, départ du {c['date_depart'][8:]}/{c['date_depart'][5:7]}/{c['date_depart'][:4]}" if c.get("date_depart") else f"Relevé du {NOW}",
        "description": " ".join(p for p in parts if p),
        "highlights": [h for h in [
            f"{days} jours / {nights} nuits",
            (f"Guide {c['guide']}" if c.get("guide") and c["guide"] != "null" else None),
            (f"Groupe de {c['taille_groupe_max']} personnes au maximum" if c.get("taille_groupe_max") else None),
            (f"Vols au départ de {dep} compris" if c.get("vols_inclus") else None),
            (f"Départ possible : {c['date_depart'][8:]}/{c['date_depart'][5:7]}/{c['date_depart'][:4]}" if c.get("date_depart") else None),
        ] if h],
        "itinerary": steps,
        "included": includes,
        "notIncluded": notinc,
        "practicalInfo": practical(o["country"]),
        "details": {
            "venue": {"name": c["hebergement"], "kind": "hotel", "stars": stars or None} if c.get("hebergement") and False else None,
            "flights": ({"from": dep, "to": o["destination"], "direct": None, "airlines": [x.strip() for x in re.split(r",| ou ", c["compagnie"]) if x.strip()][:4] if c.get("compagnie") else None, } if c.get("vols_inclus") else None),
            "meals": (c.get("pension") or None) if board != "Formule à confirmer" else "Formule repas non précisée par l'organisateur : détaillée avec la confirmation de disponibilité, avant tout paiement.",
            "extra": [x for x in [
                {"label": "Hébergement", "value": c["hebergement"]} if c.get("hebergement") else None,
                {"label": "Encadrement", "value": f"Guide {c['guide']}" + (f", groupe de {c['taille_groupe_max']} personnes au maximum" if c.get("taille_groupe_max") else "")} if c.get("guide") else None,
            ] if x],
        },
        "rating": 0,
        "reviews": 0,
        "source": {"nom": c["nom"], "url": c["url"], "depart": c.get("depart_ville"), "date": c.get("date_depart")},
    }


def main():
    by_country = collections.defaultdict(list)
    for c in cands_all:
        for p in c["pays"]:
            by_country[p].append(c)
    out, rep = {}, collections.Counter()
    used = set()
    per_day = {p: statistics.median(c["prix"] / c["duree_jours"] for c in cs) for p, cs in by_country.items() if cs}
    circuits = [o for o in inv if o["categorie"] == "circuits"]
    circuits.sort(key=lambda o: o["position"])
    for o in circuits:
        days_o = o["days"] or o["nights"] + 1
        med = per_day.get(o["country"])
        big = o["country"] in BIG_COUNTRIES
        toks = [t for t in re.split(r"[^a-zà-ÿ]+", (o["destination"] + " " + (o["region"] or "")).lower()) if len(t) > 3]
        pool = [
            c for c in by_country.get(o["country"], [])
            if id(c) not in used
            and abs(days_o - c["duree_jours"]) <= max(3, 0.35 * days_o)
            and (not med or 0.5 * med <= c["prix"] / c["duree_jours"] <= 2.2 * med)
            and (not big or any(t in (c["nom"] + " " + " ".join(c.get("etapes") or [])).lower() for t in toks))
        ]
        if not pool:
            rep["sans_candidat"] += 1
            if med and not big:
                ref = int(round(med * days_o))
                pr = PM.price_from_reference(ref, o["slug"])
                out[o["slug"]] = {"slug": o["slug"], "mode": "prix_seul", "price": pr["price"], "oldPrice": ref, "discountPct": pr["real_discount_pct"],
                                  "referencePriceSource": f"Relevé du {NOW}, prix médian par jour des circuits comparables ({o['country']})", "gele": o["slug"] in frozen}
            continue
        best = min(pool, key=lambda c: cost(o, c))
        used.add(id(best))
        ov = overlay(o, best)
        if o["slug"] in frozen:
            ov = {k: ov[k] for k in ("slug", "price", "oldPrice", "discountPct", "referencePriceSource")}
            ov["mode"] = "prix_seul"
            ov["gele"] = True
            rep["gele"] += 1
        else:
            rep["produit"] += 1
        out[o["slug"]] = ov
    json.dump(out, open("out_circuits.json", "w"), ensure_ascii=False, indent=1)
    pool = [c for c in cands_all if id(c) not in used]
    json.dump(pool, open("out_circuits_pool.json", "w"), ensure_ascii=False)
    print(dict(rep), "| pool restant:", len(pool), "dont détaillés:", sum(1 for c in pool if has_detail(c)))
    ratios = [out[o["slug"]]["price"] / o["price"] for o in circuits if o["slug"] in out]
    print("variation de prix: médiane x", round(statistics.median(ratios), 2), "min", round(min(ratios), 2), "max", round(max(ratios), 2))


if __name__ == "__main__":
    main()

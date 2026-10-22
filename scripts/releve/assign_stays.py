#!/usr/bin/env python3
"""Rattache chaque séjour / hôtel existant à un produit réel relevé, et recalcule son prix.

Entrées  : inventaire-offres.json, offres-gelees.json, lt_forfaits.json, lt_hotels.json, kayak-parsed.json
Sortie   : out_stays.json  { slug: overlay }  + out_stays_report.json (statistiques)
"""
import collections
import json
import math
import re
import statistics
import sys

sys.path.insert(0, ".")
import destmap as D
import iata as I
import pricing_model as PM

NOW = "21/10/2026"

inv = json.load(open("inventaire-offres.json"))
frozen = {r["slug"] for r in json.load(open("offres-gelees.json")) if r["actives"] > 0}
forfaits = json.load(open("lt_forfaits.json"))
hotels = json.load(open("lt_hotels.json"))
kayak = {r["route"]: r for r in json.load(open("kayak-parsed.json")) if r.get("status") == 200}

def country_slug_of(page_url):
    return page_url.strip('/').split('/')[2]


COUNTRY_FIX = {"ile-maurice": "maurice", "la-reunion": "ile-de-la-reunion", "tchequie": "republique-tcheque", "emirats-arabes-unis": "emirats-arabes-unis", "etats-unis": "etats-unis"}


def our_country_slug(c):
    s_ = D.slug(c)
    return COUNTRY_FIX.get(s_, s_)


avail_f = collections.defaultdict(list)
for x in forfaits:
    if x["board"] and x["nights"] and x["price"]:
        avail_f[x["pageslug"]].append(x)
avail_h = collections.defaultdict(list)
for x in hotels:
    if x["price_pp_night"] and x["nights"]:
        avail_h[x["pageslug"]].append(x)
pages = set(avail_f) | set(avail_h)
by_country_f = collections.defaultdict(list)
for plist in avail_f.values():
    for x in plist:
        by_country_f[country_slug_of(x["page"])].append(x)
by_country_h = collections.defaultdict(list)
for plist in avail_h.values():
    for x in plist:
        by_country_h[country_slug_of(x["page"])].append(x)

# étoiles des hôtels seuls : connues quand le même hôtel figure dans un forfait
stars_by_name = {}
for x in forfaits:
    stars_by_name.setdefault(re.sub(r"[^a-z0-9]", "", x["hotel"].lower()), x["stars"])


def norm(n):
    return re.sub(r"[^a-z0-9]", "", n.lower())


BOARD_PHRASE = {
    "Tout compris": "en formule tout compris",
    "Pension complète": "en pension complète",
    "Demi-pension": "en demi-pension",
    "Petit-déjeuner": "avec petit-déjeuner",
    "Sans repas": "en logement seul, sans repas",
}
BOARD_GROUP = {"Tout compris": 3, "Pension complète": 2, "Demi-pension": 2, "Petit-déjeuner": 1, "Sans repas": 0}


def name_hints(name: str) -> list:
    """Mentions que le nom de l'établissement porte lui-même (rien d'autre n'est déduit)."""
    low = name.lower()
    out = []
    if re.search(r"aqua ?park|water ?park|aquapark", low):
        out.append("Parc aquatique")
    if re.search(r"\bspa\b", low):
        out.append("Spa")
    if "families and couples only" in low:
        out.append("Familles et couples uniquement")
    if "adults only" in low or "adult only" in low:
        out.append("Adultes uniquement")
    if re.search(r"\bclub\b", low):
        out.append("Club")
    return out


def direct_phrase(direct: bool) -> str:
    return "direct" if direct else "avec escale"


def flight_record(depart_city: str, dest: str, iata: str = None):
    code = I.CODES.get(depart_city, "PAR")
    ia = iata or I.IATA.get(dest)
    return kayak.get(f"{code}>{ia}") if ia else None


def fr_duration(s):
    """'11h 20min' -> 'environ 11 h 20'"""
    if not s:
        return None
    m = re.match(r"(\d+)h\s*(\d+)?", s)
    if not m:
        return None
    h, mn = int(m.group(1)), int(m.group(2) or 0)
    return f"environ {h} h {mn:02d}" if mn else f"environ {h} h"


def airport_label(a: str) -> str:
    """'Paris - Charles De Gaulle' -> 'Paris (Roissy-Charles-de-Gaulle)'"""
    a = (a or "").strip()
    low = a.lower()
    if "orly" in low:
        return "Paris (Orly)"
    if "charles" in low:
        return "Paris (Roissy-Charles-de-Gaulle)"
    if "beauvais" in low:
        return "Paris (Beauvais)"
    if "vatry" in low:
        return "Châlons-Vatry"
    return a


def venue_line(c, city):
    return f"{c['hotel']}"


def cost(o, c):
    s = 3.0 * abs((o["stars"] or c["stars"]) - c["stars"])
    bo = BOARD_GROUP.get(o["board"], 1)
    bc = BOARD_GROUP.get(c["board"], 1)
    b = 0 if o["board"] == c["board"] else 1.0 + 1.2 * abs(bo - bc)
    n = 1.0 * abs(o["nights"] - c["nights"])
    p = 0.15 * abs(math.log(max(c["price"], 1) / max(o["ancien_prix"] or c["price"], 1)))
    return s + b + n + p


def generic_ref(o, cands):
    """Référence de marché quand aucun produit précis n'est rattaché : médiane des 3 plus proches."""
    best = sorted(cands, key=lambda c: cost(o, c))[:3]
    if not best:
        return None
    vals = [c["price"] * (max(o["nights"], 1) / max(c["nights"], 1)) ** 0.7 for c in best]
    return int(round(statistics.median(vals)))


def build_forfait_overlay(o, c, city_hint):
    price = PM.price_from_reference(c["price"], o["slug"])
    airport = airport_label(c["airport"])
    fl = flight_record(o["depart"], o["destination"], o.get("iata")) or flight_record("Paris", o["destination"], o.get("iata"))
    direct = bool(c["direct"])
    dur = fr_duration((fl or {}).get("direct_duration")) if direct else None
    air = (fl or {}).get("direct_airlines") if direct else None
    nights = c["nights"]
    days = c["days"] or nights + 1
    board = c["board"]
    hints = name_hints(c["hotel"])
    to_label = f"{o['destination']} ({o.get('iata') or I.IATA.get(o['destination'], '')})".replace(" ()", "")
    flights = {
        "from": airport,
        "to": to_label,
        "direct": direct,
        "duration": (dur + (" en vol direct" if direct else "")) if dur else None,
        "airlines": [a for a in (air or []) if "autres" not in a] or None,
    }
    details = {
        "venue": {
            "name": c["hotel"],
            "kind": "club" if "club" in c["hotel"].lower() else "hotel",
            "stars": c["stars"],
            "address": c["city"] or o["destination"],
            "facilities": hints or None,
        },
        "flights": {k: v for k, v in flights.items() if v is not None},
        "meals": {
            "Tout compris": "Tout compris : repas, boissons et snacks selon la formule de l'établissement.",
            "Pension complète": "Pension complète : petit-déjeuner, déjeuner et dîner.",
            "Demi-pension": "Demi-pension : petit-déjeuner et dîner.",
            "Petit-déjeuner": "Petit-déjeuner compris. Autres repas et boissons non compris.",
            "Sans repas": "Logement seul : aucun repas compris.",
        }.get(board),
        "transfers": "Non précisés par l'organisateur du forfait : à confirmer avec la disponibilité, avant tout paiement.",
    }
    included = [
        f"Vol aller-retour {airport} – {o['destination']}",
        f"{nights} nuits d'hébergement à {c['hotel']}",
        {
            "Tout compris": "Formule tout compris",
            "Pension complète": "Pension complète",
            "Demi-pension": "Demi-pension",
            "Petit-déjeuner": "Petit-déjeuner",
            "Sans repas": "Logement seul",
        }[board],
    ]
    desc = (
        f"{c['hotel']}, établissement {c['stars']} étoiles à {c['city'] or o['destination']} ({o['country']}). "
        f"Le forfait comprend {nights} nuits {BOARD_PHRASE[board]} et le vol aller-retour {direct_phrase(direct)} "
        f"au départ de {airport}."
    )
    highlights = [
        f"Vol {direct_phrase(direct)} {airport} – {o['destination']}",
        BOARD_PHRASE[board][0].upper() + BOARD_PHRASE[board][1:] if board != "Sans repas" else "Logement seul, repas à votre convenance",
        f"{nights} nuits sur place",
    ] + hints[:2]
    return {
        "slug": o["slug"],
        "mode": "produit",
        "title": c["hotel"],
        "subtype": "tout_compris" if board == "Tout compris" else "vol_hotel",
        "departureCity": "Paris",
        "days": days,
        "nights": nights,
        "stars": c["stars"],
        "board": board,
        "price": price["price"],
        "oldPrice": c["price"],
        "discountPct": price["real_discount_pct"],
        "referencePriceSource": f"Logitravel, relevé du {NOW}, départ du {c['departure'][8:]}/{c['departure'][5:7]}/{c['departure'][:4]}" if c.get("departure") else f"Logitravel, relevé du {NOW}",
        "description": desc,
        "highlights": highlights,
        "included": included,
        "amenities": (hints + [BOARD_PHRASE[board].replace("en formule ", "").replace("avec ", "")])[:5] if hints else [],
        "details": details,
        "tags": [t for t in (["Tout compris"] if board == "Tout compris" else []) + (["Vol direct"] if direct else [])],
        "rating": 0,
        "reviews": 0,
        "source": {"page": c["page"], "hotel": c["hotel"], "departure": c.get("departure"), "price_displayed": c["price"], "price_strike": c.get("price_strike")},
    }


def build_hotel_overlay(o, h, stars):
    nights = o["nights"]
    ref = int(round(h["price_pp_night"] * nights))
    price = PM.price_from_reference(ref, o["slug"])
    details = {
        "venue": {"name": h["hotel"], "kind": "hotel", "stars": stars or None, "address": h["city"] or o["destination"]},
        "meals": "Non précisé par le tarif relevé : à confirmer avec la disponibilité, avant tout paiement.",
    }
    desc = (
        f"{h['hotel']}, hébergement à {h['city'] or o['destination']} ({o['country']}). "
        f"Tarif par personne pour {nights} nuits en chambre double, hors transport."
    )
    return {
        "slug": o["slug"],
        "mode": "produit",
        "title": h["hotel"],
        "subtype": "hotel_seul",
        "board": "Formule à confirmer",
        "departureCity": o["depart"],
        "days": nights + 1,
        "nights": nights,
        "stars": stars or 0,
        "price": price["price"],
        "oldPrice": ref,
        "discountPct": price["real_discount_pct"],
        "referencePriceSource": f"Logitravel, relevé du {NOW}, séjour du {h['date_from'][8:]}/{h['date_from'][5:7]}/{h['date_from'][:4]}" if h.get("date_from") else f"Logitravel, relevé du {NOW}",
        "description": desc,
        "highlights": [f"{nights} nuits à {h['city'] or o['destination']}", "Tarif par personne en chambre double"],
        "included": [f"{nights} nuits d'hébergement à {h['hotel']}"],
        "details": details,
        "rating": 0,
        "reviews": 0,
        "source": {"page": h["page"], "hotel": h["hotel"], "date_from": h.get("date_from"), "pp_night": h["price_pp_night"]},
    }


def main():
    report = collections.Counter()
    out = {}
    by_dest = collections.defaultdict(list)
    for o in inv:
        if o["categorie"] in ("sejours", "hotels"):
            by_dest[(o["destination"], o["categorie"])].append(o)

    for (dest, cat), offers in by_dest.items():
        pg = D.pages_for(dest, pages)
        if cat == "sejours":
            cands = [c for p in pg for c in avail_f.get(p, [])]
        else:
            cands = []
            for p in pg:
                for h in avail_h.get(p, []):
                    st = stars_by_name.get(norm(h["hotel"]))
                    cands.append({**h, "stars_known": st})
        # offres non gelées uniquement : les offres visées par une demande client gardent leur identité
        free = [o for o in offers if o["slug"] not in frozen]
        free.sort(key=lambda o: (-(o["stars"] or 0), o["position"]))
        used = set()
        for o in free:
            if not cands:
                report[f"{cat}:sans_candidat"] += 1
                continue
            if cat == "sejours":
                ranked = sorted((c for c in cands if id(c) not in used and abs(o["nights"] - c["nights"]) <= 4), key=lambda c: cost(o, c))
                if not ranked:
                    report["sejours:epuise"] += 1
                    continue
                c = ranked[0]
                used.add(id(c))
                out[o["slug"]] = build_forfait_overlay(o, c, None)
                report["sejours:produit"] += 1
            else:
                ranked = sorted((c for c in cands if id(c) not in used), key=lambda c: (c["stars_known"] is None, abs((c["stars_known"] or o["stars"]) - o["stars"]), abs(math.log(max(c["price_pp_night"] * o["nights"], 1) / max(o["ancien_prix"], 1)))))
                if not ranked:
                    report["hotels:epuise"] += 1
                    continue
                c = ranked[0]
                used.add(id(c))
                out[o["slug"]] = build_hotel_overlay(o, c, c["stars_known"])
                report["hotels:produit"] += 1


    # ---- repli : prix de marché seul, sans changer l'identité de l'offre ----
    for o in inv:
        if o["categorie"] not in ("sejours", "hotels") or o["slug"] in out:
            continue
        pg = D.pages_for(o["destination"], pages)
        cs = our_country_slug(o["country"])
        if o["categorie"] == "sejours":
            pool = [c for p in pg for c in avail_f.get(p, [])] or by_country_f.get(cs, [])
            ref = generic_ref(o, [c for c in pool if abs(o["nights"] - c["nights"]) <= 6] or pool)
            scope = "destination" if pg else "pays"
        else:
            pool = [c for p in pg for c in avail_h.get(p, [])] or by_country_h.get(cs, [])
            vals = [c["price_pp_night"] for c in pool]
            ref = int(round(statistics.median(vals) * o["nights"])) if vals else None
            scope = "destination" if pg else "pays"
        if not ref:
            report[f"{o['categorie']}:aucun_prix_marche"] += 1
            continue
        pr = PM.price_from_reference(ref, o["slug"])
        out[o["slug"]] = {
            "slug": o["slug"],
            "mode": "prix_seul",
            "price": pr["price"],
            "oldPrice": ref,
            "discountPct": pr["real_discount_pct"],
            "referencePriceSource": f"Logitravel, relevé du {NOW}, médiane de produits comparables ({scope})",
            "gele": o["slug"] in frozen,
        }
        report[f"{o['categorie']}:prix_seul" + (":gele" if o["slug"] in frozen else "")] += 1

    json.dump(out, open("out_stays.json", "w"), ensure_ascii=False, indent=1)
    json.dump(dict(report), open("out_stays_report.json", "w"), indent=1)
    print(dict(report))
    old = [(o["slug"], o["price"]) for o in inv if o["slug"] in out and out[o["slug"]]["mode"] == "produit"]
    ratios = [out[s]["price"] / p for s, p in old if p]
    print("variation de prix des offres rattachées: médiane x", round(statistics.median(ratios), 2), "| min", round(min(ratios), 2), "| max", round(max(ratios), 2))
    disc = [v["discountPct"] for v in out.values()]
    print("remise > 11 % (plancher d'arrondi):", sum(1 for d in disc if d > 11.0), "sur", len(disc))
    print("remise réelle vs marché: min", min(disc), "max", max(disc), "moy", round(sum(disc) / len(disc), 1))


if __name__ == "__main__":
    main()

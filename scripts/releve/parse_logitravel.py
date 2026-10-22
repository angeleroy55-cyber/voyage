#!/usr/bin/env python3
"""Analyse les cartes Logitravel extraites par le navigateur.

Entrée : fichiers JSON {url, status, title, cards:[{sec,name,stars,city,ta,badges,href,txt}]}
Sortie : lignes normalisées par type (forfaits vol+hôtel, hôtels seuls, croisières, escapades, campings).
"""
import json
import re
import sys
import unicodedata

MOIS = {
    "jan": 1, "fév": 2, "fev": 2, "mar": 3, "avr": 4, "mai": 5, "jui": 6, "juin": 6,
    "juil": 7, "aoû": 8, "aou": 8, "sep": 9, "oct": 10, "nov": 11, "déc": 12, "dec": 12,
}

BOARDS = [
    ("tout compris", "Tout compris"),
    ("pension complète", "Pension complète"),
    ("demi-pension", "Demi-pension"),
    ("petit-déjeuner", "Petit-déjeuner"),
    ("petit déjeuner", "Petit-déjeuner"),
    ("logement seul", "Sans repas"),
    ("sans repas", "Sans repas"),
    ("logement et petit", "Petit-déjeuner"),
]


def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def eur(s: str):
    """'1 024€' -> 1024"""
    s = s.replace(" ", "").replace("\xa0", "").replace(" ", "")
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


def board_of(txt: str):
    low = txt.lower()
    for k, v in BOARDS:
        if k in low:
            return v
    return None


def iso_from_fr(txt: str):
    """'Départ le 02/02/2027' ou 'du 24/02/2027 au 01/03/2027' -> ISO du premier jour trouvé."""
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", txt)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None


def parse_forfait(card: dict, page_url: str):
    t = card["txt"]
    # Prix : « dès879€842€ » : le premier est le prix de référence barré du site, le second le prix proposé
    pm = re.search(r"dès\s*([\d\s \xa0]+)€\s*([\d\s \xa0]+)?€?", t)
    p_dès = p_net = None
    if pm:
        p_dès = eur(pm.group(1))
        p_net = eur(pm.group(2)) if pm.group(2) and pm.group(2).strip() else None
    nights = days = None
    nm = re.search(r"(\d+)\s*jours?\s*/\s*(\d+)\s*nuits?", t)
    if nm:
        days, nights = int(nm.group(1)), int(nm.group(2))
    ap = re.search(r"Vols? de ([A-Za-zÀ-ÿ\- ]+?)(?: \d|$| Départ)", t)
    airport = None
    am = re.search(r"Vols?\s+de\s+(.+?)\s+(?=\d+\s*jours?)", t)
    if am:
        airport = am.group(1).strip()
    dep = iso_from_fr(t)
    ret = None
    rm = re.search(r"Retour le (\d{2})/(\d{2})/(\d{4})", t)
    if rm:
        ret = f"{rm.group(3)}-{rm.group(2)}-{rm.group(1)}"
    return {
        "hotel": card["name"],
        "stars": card["stars"] or None,
        "ta": float(card["ta"]) if card.get("ta") else None,
        "city": card["city"],
        "board": board_of(t),
        "nights": nights,
        "days": days,
        "airport": airport,
        "direct": "Vol direct" in (card.get("badges") or []) or t.startswith("Vol direct"),
        "departure": dep,
        "return": ret,
        "price_strike": p_dès if p_net else None,
        "price": p_net or p_dès,
        "href": card.get("href"),
        "page": page_url,
    }


def parse_hotel_only(card: dict, page_url: str):
    t = card["txt"]
    nm = re.search(r"(\d+) adultes? / (\d+) nuits?", t)
    pm = re.search(r"Prix par Personne/Nuit\s*([\d\s \xa0]+)€", t)
    return {
        "hotel": card["name"],
        "stars": card["stars"] or None,
        "ta": float(card["ta"]) if card.get("ta") else None,
        "city": card["city"],
        "nights": int(nm.group(2)) if nm else None,
        "date_from": iso_from_fr(t),
        "price_pp_night": eur(pm.group(1)) if pm else None,
        "href": card.get("href"),
        "page": page_url,
    }


def parse_cruise(card: dict, page_url: str):
    t = card["txt"]
    dm = re.search(r"(\d+) jours? au départ de ([^D]+?)(?=Départ|$)", t)
    dep = re.search(r"Départ\s*:\s*(\d{1,2}) ([a-zéûà]+)\.? (\d{4})", t)
    itin = re.search(r"Itinéraire\s*:\s*(.+?)(?:\.\.\.|Frais|$)", t)
    pm = re.search(r"dès\s*([\d\s \xa0]+)€", t)
    return {
        "ship": card["city"],
        "name": card["name"],
        "days": int(dm.group(1)) if dm else None,
        "from": dm.group(2).strip() if dm else None,
        "departure_txt": f"{dep.group(1)} {dep.group(2)} {dep.group(3)}" if dep else None,
        "itinerary": [x.strip() for x in itin.group(1).split(",")] if itin else None,
        "service_fees_included": "Frais de service inclus" in t,
        "price": eur(pm.group(1)) if pm else None,
        "href": card.get("href"),
        "page": page_url,
    }


def classify(sec: str):
    s = sec.lower()
    if s.startswith("séjours vol+hôtel") or "vol+hôtel" in s or "vol + hôtel" in s:
        return "forfait"
    if s.startswith("hôtels") or s.startswith("hotels"):
        return "hotel"
    if s.startswith("croisières") or s.startswith("croisieres"):
        return "croisiere"
    if "escapades" in s:
        return "escapade"
    if "camping" in s:
        return "camping"
    if "grands voyages" in s or "circuits" in s:
        return "circuit"
    if s.startswith("séjours"):
        return "sejour_carte"
    return "autre"


def main(paths):
    out = {"forfait": [], "hotel": [], "croisiere": [], "escapade": [], "camping": [], "circuit": [], "sejour_carte": [], "autre": []}
    for p in paths:
        for rec in json.load(open(p)):
            for card in rec.get("cards", []) or []:
                k = classify(card["sec"])
                if k == "forfait":
                    out[k].append(parse_forfait(card, rec["url"]))
                elif k == "hotel":
                    out[k].append(parse_hotel_only(card, rec["url"]))
                elif k == "croisiere":
                    out[k].append(parse_cruise(card, rec["url"]))
                else:
                    out[k].append({"sec": card["sec"], "name": card["name"], "city": card["city"], "txt": card["txt"][:300], "href": card.get("href"), "page": rec["url"]})
    return out


if __name__ == "__main__":
    res = main(sys.argv[1:])
    print({k: len(v) for k, v in res.items()})

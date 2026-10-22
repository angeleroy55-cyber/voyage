#!/usr/bin/env python3
"""Analyse les extraits de pages de route Kayak (A..E) en un enregistrement par route."""
import json
import re
import sys

NB = r"[\d\s \xa0 ]+"


def eur(s):
    if s is None:
        return None
    s = re.sub(r"[\s \xa0]", "", s)
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None


def parse(rec: dict) -> dict:
    out = {"route": rec["route"], "status": rec.get("status"), "url": rec.get("url"), "title": rec.get("title")}
    if rec.get("status") != 200:
        return out
    A = rec.get("A") or ""
    B = rec.get("B") or ""
    C = rec.get("C") or ""
    D = rec.get("D") or ""
    E = rec.get("E") or ""

    m = re.search(rf"Aller-retour le moins cher\s*({NB})€", A)
    out["rt_min"] = eur(m.group(1)) if m else None
    m = re.search(rf"Prix habituels\s*:\s*({NB})€\s*-\s*({NB})€", A)
    if m:
        out["usual_low"], out["usual_high"] = eur(m.group(1)), eur(m.group(2))
    # compagnie du prix mini : le texte qui suit « Prix habituels : x € - y € »
    m = re.search(rf"Prix habituels\s*:\s*{NB}€\s*-\s*{NB}€\s*([A-Za-zÀ-ÿ' .\-]+?)\s*(?:lun|mar|mer|jeu|ven|sam|dim)\.", A)
    out["rt_min_airline"] = m.group(1).strip() if m else None
    m = re.search(r"•\s*(Direct|\d+ escales?)", A)
    out["rt_min_stops"] = m.group(1) if m else None

    m = re.search(rf"Vol direct le moins cher\s*({NB})€", A)
    out["direct_min"] = eur(m.group(1)) if m else None
    m = re.search(rf"Vol direct le moins cher\s*{NB}€\s*Prix habituels\s*:\s*({NB})€\s*-\s*({NB})€\s*([A-Za-zÀ-ÿ' .\-]+?)\s*(?:lun|mar|mer|jeu|ven|sam|dim)\.", A)
    if m:
        out["direct_usual_low"], out["direct_usual_high"] = eur(m.group(1)), eur(m.group(2))
        out["direct_min_airline"] = m.group(3).strip()

    m = re.search(r"Vous pouvez prendre un vol direct avec ([^.]+?)\.\s*Durée moyenne du vol\s*:\s*([\dh min]+)", A + " " + B + " " + C)
    if m:
        out["direct_airlines"] = [x.strip() for x in re.split(r",| et ", m.group(1)) if x.strip()]
        out["direct_duration"] = m.group(2).strip()
    if "Vols directs" in (A + B) and "direct_airlines" not in out:
        m = re.search(r"Durée moyenne du vol\s*:\s*([\dh min]+)", A + B)
        if m:
            out["direct_duration"] = m.group(1).strip()

    m = re.search(rf"typically range from ({NB})€ to ({NB})€", B)
    if m:
        out["typical_low"], out["typical_high"] = eur(m.group(1)), eur(m.group(2))
    m = re.search(rf"lowest price found in the past (\d+) days was ({NB})€", B)
    if m:
        out["lowest_days"], out["lowest_price"] = int(m.group(1)), eur(m.group(2))
    m = re.search(rf"tarif moyen de ({NB})€ l.aller-retour", B)
    out["avg_best_airport"] = eur(m.group(1)) if m else None
    m = re.search(r"Le trajet de l'aéroport de ([^(]+?)\((\w{3})\)", B)
    if m:
        out["cheapest_origin_airport"] = m.group(2)

    m = re.search(rf"mois le moins cher[^.]*?est (\w+), à ({NB})€", E)
    if m:
        out["cheapest_month"], out["cheapest_month_price"] = m.group(1), eur(m.group(2))
    m = re.search(rf"Les mois les plus chers sont (\w+) \(({NB})€\) et (\w+) \(({NB})€\)", E)
    if m:
        out["priciest"] = [{"m": m.group(1), "p": eur(m.group(2))}, {"m": m.group(3), "p": eur(m.group(4))}]

    # jours de vols directs : « Vols aller directs Paris à X lundi Air France,... mardi ... »
    days = {}
    if "Vols aller directs" in C:
        body = C.split("Vols retour directs")[0]
        for d, comp in re.findall(r"(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+([A-Za-zÀ-ÿ' ,.\-]+?)(?=\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b|\s+Trouver|\s+Voir|$)", body):
            days[d] = [x.strip() for x in comp.split(",") if x.strip()]
    if days:
        out["direct_days"] = days

    m = re.search(rf"^({NB})€", rec.get("title") or "")
    out["title_price_one_way_min"] = eur(m.group(1)) if m else None
    return out


if __name__ == "__main__":
    data = json.load(open(sys.argv[1]))
    rows = [parse(r) for r in data]
    json.dump(rows, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
    ok = [r for r in rows if r.get("rt_min")]
    print(len(rows), "routes,", len(ok), "avec prix mini")

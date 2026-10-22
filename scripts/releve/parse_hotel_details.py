#!/usr/bin/env python3
"""Extrait des fiches hôtel Logitravel une liste d'équipements normalisés et les horaires.

On ne recopie pas les libellés du site : on détecte la présence de chaque équipement et on
l'exprime avec nos propres intitulés (liste fermée), ce qui sert de fait vérifiable, pas de texte repris.
"""
import json
import re
import sys

# (intitulé GoSéjour, motif de détection dans le texte des équipements)
FACILITIES = [
    ("Piscine extérieure", r"piscines? ext[ée]rieures?|piscina|outdoor pool|piscine à débordement|piscine chauffée|piscines? ?$|\bpiscine\b"),
    ("Piscine intérieure", r"piscines? int[ée]rieures?"),
    ("Piscine pour enfants", r"piscines? pour enfants"),
    ("Parc aquatique", r"toboggan|parc aquatique|aqua ?park|water ?park"),
    ("Spa", r"\bspa\b|circuit spa|bien-[êe]tre"),
    ("Sauna", r"\bsauna\b"),
    ("Hammam", r"hammam|bains? (à vapeur|turcs?)"),
    ("Massages", r"massages?"),
    ("Salle de sport", r"salle de sport|gymnase|fitness|salle de musculation"),
    ("Wi-Fi gratuit", r"wi-?fi[^.]{0,20}(gratuit|gratis|free)|(gratuit|gratis)[^.]{0,20}wi-?fi"),
    ("Climatisation", r"climatisation|air conditionn|aire acondicionado"),
    ("Réception 24 h/24", r"r[ée]ception ouverte 24"),
    ("Parking", r"\bparking\b"),
    ("Ascenseur", r"\bascenseur\b"),
    ("Coffre-fort", r"coffre-?fort"),
    ("Blanchisserie", r"blanchisserie|nettoyage à sec"),
    ("Consigne à bagages", r"consigne à bagages"),
    ("Conciergerie", r"conciergerie"),
    ("Navette aéroport", r"navette"),
    ("Plage", r"plage priv[ée]e|accès (direct )?à la plage|front de mer|en bord de mer"),
    ("Tennis", r"court de tennis|\btennis\b"),
    ("Golf", r"\bgolf\b"),
    ("Sports nautiques", r"sports? nautiques?|plongée|planche à voile|catamaran|kayak"),
    ("Club enfants", r"club (pour )?enfants|mini-?club|baby-?sitting|aire de jeux|jeux pour enfants"),
    ("Animations", r"animation|spectacle|discoth[eè]que|karaok[ée]"),
    ("Restaurant", r"restaurants?"),
    ("Bar", r"\bbars?\b"),
    ("Service en chambre", r"service en chambre|petit-déjeuner dans la chambre"),
    ("Accessible aux personnes à mobilité réduite", r"fauteuil|mobilit[ée] r[ée]duite|accès handicap|accessible"),
    ("Animaux admis", r"animaux de compagnie admis|animaux admis"),
]


def parse(equip: str, times: str) -> dict:
    low = equip.lower()
    # on coupe les scripts de pagination résiduels
    low = re.split(r"\$\(function|function\s*\(", low)[0]
    out = []
    for label, pat in FACILITIES:
        if re.search(pat, low, flags=re.I):
            out.append(label)
    # « Animaux de compagnie non admis » ne doit pas déclencher « Animaux admis »
    if "Animaux admis" in out and re.search(r"animaux de compagnie non admis|animaux non admis", low):
        out.remove("Animaux admis")
    # « Piscine » générique : si une piscine intérieure ou pour enfants est présente seule, pas de « extérieure »
    if "Piscine extérieure" in out and not re.search(r"ext[ée]rieure|à débordement|chauff|piscina|\bpiscine\b", low):
        out.remove("Piscine extérieure")
    ci = re.search(r"Arriv[ée]e\s+De\s+(\d{1,2}:\d{2})", times or "")
    co = re.search(r"D[ée]part\s+De\s+[\d:]+\s+à\s+(\d{1,2}:\d{2})", times or "")
    return {
        "facilities": out[:16],
        "checkIn": ci.group(1) if ci else None,
        "checkOut": co.group(1) if co else None,
    }


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    rows = [r for r in json.load(open(src)) if r.get("status") == 200 and r.get("equip")]
    out = {}
    for r in rows:
        d = parse(r["equip"], r.get("times") or "")
        d["url"] = r["url"]
        d["name"] = r["name"]
        out[norm(r["name"])] = d
    json.dump(out, open(dst, "w"), ensure_ascii=False)
    n_f = sum(1 for d in out.values() if d["facilities"])
    print(len(out), "hôtels;", n_f, "avec équipements; médiane", sorted(len(d["facilities"]) for d in out.values())[len(out) // 2])
    for k in list(out)[:3]:
        print(out[k]["name"], out[k]["facilities"], out[k]["checkIn"], out[k]["checkOut"])

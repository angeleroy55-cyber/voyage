#!/usr/bin/env python3
"""Construit les 200 nouvelles offres à partir de produits relevés non encore utilisés.

Répartition : séjours 100, circuits 40, hôtels 28, croisières 14, vols 18 (dont au moins un quart en Asie).
Sortie : out_new.json  [ offre complète ]
"""
import collections
import glob
import json
import math
import re
import statistics
import sys
import unicodedata

sys.path.insert(0, ".")
import assign_stays as S
import assign_circuits as C
import assign_cruises as K
import iata as I
import pricing_model as PM
import destmap as D

NOW = "21/10/2026"

# page Logitravel -> (destination affichée, pays, région commerciale)
NEW_PAGES = {
    # Asie du Sud-Est
    "pattaya": ("Pattaya", "Thaïlande", "Asie du Sud-Est"),
    "chiang-mai": ("Chiang Mai", "Thaïlande", "Asie du Sud-Est"),
    "ko-phi-phi-don": ("Koh Phi Phi", "Thaïlande", "Asie du Sud-Est"),
    "ao-nang": ("Ao Nang", "Thaïlande", "Asie du Sud-Est"),
    "phuket": ("Phuket", "Thaïlande", "Asie du Sud-Est"),
    "bangkok": ("Bangkok", "Thaïlande", "Asie du Sud-Est"),
    "ko-samui": ("Koh Samui", "Thaïlande", "Asie du Sud-Est"),
    "ho-chi-minh": ("Hô Chi Minh-Ville", "Vietnam", "Asie du Sud-Est"),
    "da-nang": ("Da Nang", "Vietnam", "Asie du Sud-Est"),
    "nha-trang": ("Nha Trang", "Vietnam", "Asie du Sud-Est"),
    "ha-long": ("Baie d'Along", "Vietnam", "Asie du Sud-Est"),
    "hue": ("Hué", "Vietnam", "Asie du Sud-Est"),
    "bali": ("Bali", "Indonésie", "Asie du Sud-Est"),
    "lombok": ("Lombok", "Indonésie", "Asie du Sud-Est"),
    "boracay-island": ("Boracay", "Philippines", "Asie du Sud-Est"),
    "palawan": ("Palawan", "Philippines", "Asie du Sud-Est"),
    "manille": ("Manille", "Philippines", "Asie du Sud-Est"),
    "sihanoukville": ("Sihanoukville", "Cambodge", "Asie du Sud-Est"),
    "siem-reap": ("Siem Reap", "Cambodge", "Asie du Sud-Est"),
    "luang-prabang": ("Luang Prabang", "Laos", "Asie du Sud-Est"),
    "vientiane": ("Vientiane", "Laos", "Asie du Sud-Est"),
    "ile-de-singapour": ("Singapour", "Singapour", "Asie du Sud-Est"),
    # Asie de l'Est et du Sud
    "tokyo": ("Tokyo", "Japon", "Asie"),
    "osaka": ("Osaka", "Japon", "Asie"),
    "kyoto": ("Kyoto", "Japon", "Asie"),
    "okinawa": ("Okinawa", "Japon", "Asie"),
    "seoul": ("Séoul", "Corée du Sud", "Asie"),
    "jeju-do": ("Île de Jeju", "Corée du Sud", "Asie"),
    "shanghai": ("Shanghai", "Chine", "Asie"),
    "hong-kong": ("Hong Kong", "Chine", "Asie"),
    "pekin": ("Pékin", "Chine", "Asie"),
    "goa": ("Goa", "Inde", "Asie"),
    "kerala": ("Kerala", "Inde", "Asie"),
    "delhi": ("Delhi", "Inde", "Asie"),
    "jaipur": ("Jaipur", "Inde", "Asie"),
    "colombo": ("Colombo", "Sri Lanka", "Océan Indien"),
    "galle": ("Galle", "Sri Lanka", "Océan Indien"),
    "beruwela": ("Beruwala", "Sri Lanka", "Océan Indien"),
    "katmandou": ("Katmandou", "Népal", "Asie"),
    "taskent": ("Tachkent", "Ouzbékistan", "Asie"),
    "samarcanda": ("Samarcande", "Ouzbékistan", "Asie"),
    # Moyen-Orient, océan Indien
    "dubai": ("Dubaï", "Émirats arabes unis", "Moyen-Orient"),
    "abou-dabi": ("Abou Dabi", "Émirats arabes unis", "Moyen-Orient"),
    "ras-el-khaimah": ("Ras el-Khaïmah", "Émirats arabes unis", "Moyen-Orient"),
    "mascate": ("Mascate", "Oman", "Moyen-Orient"),
    "salalah": ("Salalah", "Oman", "Moyen-Orient"),
    "maldives": ("Maldives", "Maldives", "Océan Indien"),
    "maurice": ("Île Maurice", "Île Maurice", "Océan Indien"),
    "praslin": ("Praslin", "Seychelles", "Océan Indien"),
    # Europe
    "costa-blanca": ("Costa Blanca", "Espagne", "Méditerranée"),
    "alicante": ("Alicante", "Espagne", "Méditerranée"),
    "formentera": ("Formentera", "Espagne", "Baléares"),
    "minorque": ("Minorque", "Espagne", "Baléares"),
    "grenade": ("Grenade", "Espagne", "Europe"),
    "cordoue": ("Cordoue", "Espagne", "Europe"),
    "cote-d-algarve": ("Algarve", "Portugal", "Atlantique"),
    "ile-de-sao-miguel": ("São Miguel (Açores)", "Portugal", "Atlantique"),
    "sicile": ("Sicile", "Italie", "Méditerranée"),
    "sardaigne": ("Sardaigne", "Italie", "Méditerranée"),
    "cote-amalfitaine": ("Côte amalfitaine", "Italie", "Méditerranée"),
    "pouilles": ("Pouilles", "Italie", "Méditerranée"),
    "rimini": ("Rimini", "Italie", "Méditerranée"),
    "mykonos": ("Mykonos", "Grèce", "Îles grecques"),
    "ile-de-paros": ("Paros", "Grèce", "Îles grecques"),
    "cephalonie": ("Céphalonie", "Grèce", "Îles grecques"),
    "thessalonique": ("Thessalonique", "Grèce", "Europe"),
    "hvar": ("Hvar", "Croatie", "Méditerranée"),
    "zadar": ("Zadar", "Croatie", "Méditerranée"),
    "makarska": ("Makarska", "Croatie", "Méditerranée"),
    "marmaris": ("Marmaris", "Turquie", "Méditerranée"),
    "bodrum-peninsula": ("Bodrum", "Turquie", "Méditerranée"),
    "fethiye": ("Fethiye", "Turquie", "Méditerranée"),
    "paphos": ("Paphos", "Chypre", "Méditerranée"),
    "limassol": ("Limassol", "Chypre", "Méditerranée"),
    "sunny-beach": ("Sunny Beach", "Bulgarie", "Europe"),
    "sofia": ("Sofia", "Bulgarie", "Europe"),
    "lisbonne": ("Lisbonne", "Portugal", "Atlantique"),
    "porto": ("Porto", "Portugal", "Atlantique"),
    "naples": ("Naples", "Italie", "Méditerranée"),
    "budapest": ("Budapest", "Hongrie", "Europe"),
    "prague": ("Prague", "Tchéquie", "Europe"),
    "vienne": ("Vienne", "Autriche", "Europe"),
    "berlin": ("Berlin", "Allemagne", "Europe"),
    "munich": ("Munich", "Allemagne", "Europe"),
    "amsterdam": ("Amsterdam", "Pays-Bas", "Europe"),
    "londres": ("Londres", "Royaume-Uni", "Europe"),
    "dublin": ("Dublin", "Irlande", "Europe"),
    # Afrique du Nord, Afrique
    "sharm-el-sheikh": ("Charm el-Cheikh", "Égypte", "Mer Rouge"),
    "marsa-alam": ("Marsa Alam", "Égypte", "Mer Rouge"),
    "hurghada": ("Hurghada", "Égypte", "Mer Rouge"),
    "agadir": ("Agadir", "Maroc", "Afrique du Nord"),
    "marrakech": ("Marrakech", "Maroc", "Afrique du Nord"),
    "essaouira": ("Essaouira", "Maroc", "Afrique du Nord"),
    "djerba": ("Djerba", "Tunisie", "Afrique du Nord"),
    "sousse": ("Sousse", "Tunisie", "Afrique du Nord"),
    "region-hammamet": ("Hammamet", "Tunisie", "Afrique du Nord"),
    "zarzis": ("Zarzis", "Tunisie", "Afrique du Nord"),
    "mahdia": ("Mahdia", "Tunisie", "Afrique du Nord"),
    "ile-de-sal": ("Île de Sal", "Cap-Vert", "Atlantique"),
    "boa-vista": ("Boa Vista", "Cap-Vert", "Atlantique"),
    "mombasa": ("Mombasa", "Kenya", "Océan Indien"),
    "diani-beach": ("Diani Beach", "Kenya", "Océan Indien"),
    # Amériques et Caraïbes
    "punta-cana": ("Punta Cana", "République dominicaine", "Caraïbes"),
    "puerto-plata": ("Puerto Plata", "République dominicaine", "Caraïbes"),
    "samana": ("Samaná", "République dominicaine", "Caraïbes"),
    "riviera-maya": ("Riviera Maya", "Mexique", "Caraïbes"),
    "cozumel": ("Cozumel", "Mexique", "Caraïbes"),
    "los-cabos": ("Los Cabos", "Mexique", "Amérique du Nord"),
    "varadero": ("Varadero", "Cuba", "Caraïbes"),
    "martinique": ("Martinique", "Martinique", "Caraïbes"),
    "guadeloupe": ("Guadeloupe", "Guadeloupe", "Caraïbes"),
    "new-york": ("New York", "États-Unis", "Amérique du Nord"),
    "miami": ("Miami", "États-Unis", "Amérique du Nord"),
    "las-vegas-nv": ("Las Vegas", "États-Unis", "Amérique du Nord"),
    "los-angeles": ("Los Angeles", "États-Unis", "Amérique du Nord"),
    "orlando-fl": ("Orlando", "États-Unis", "Amérique du Nord"),
    "montreal": ("Montréal", "Canada", "Amérique du Nord"),
    "quebec": ("Québec", "Canada", "Amérique du Nord"),
    "toronto": ("Toronto", "Canada", "Amérique du Nord"),
    "guanacaste": ("Guanacaste", "Costa Rica", "Amérique centrale"),
    "tahiti": ("Tahiti", "Polynésie française", "Océanie"),
    "bora-bora": ("Bora-Bora", "Polynésie française", "Océanie"),
    "sydney": ("Sydney", "Australie", "Océanie"),
}

ASIE_STRICT = {"Thaïlande", "Japon", "Vietnam", "Indonésie", "Chine", "Inde", "Sri Lanka", "Malaisie", "Cambodge", "Philippines", "Corée du Sud", "Ouzbékistan", "Singapour", "Népal", "Laos"}

# quotas de nouveaux séjours par page (somme = 100) : Asie stricte en tête
PAGE_IATA = {
 "phuket":"HKT","bangkok":"BKK","pattaya":"BKK","chiang-mai":"CNX","ko-phi-phi-don":"KBV","ao-nang":"KBV","ko-samui":"USM","ho-chi-minh":"SGN","da-nang":"DAD","nha-trang":"CXR","ha-long":"HAN","hue":"DAD","bali":"DPS","lombok":"LOP","boracay-island":"MPH","palawan":"PPS","manille":"MNL","sihanoukville":"PNH","siem-reap":"REP","luang-prabang":"LPQ","vientiane":"VTE","ile-de-singapour":"SIN",
 "tokyo":"TYO","osaka":"OSA","kyoto":"OSA","okinawa":"OKA","seoul":"SEL","jeju-do":"CJU","shanghai":"SHA","hong-kong":"HKG","pekin":"BJS","goa":"GOI","kerala":"COK","delhi":"DEL","jaipur":"JAI","colombo":"CMB","galle":"CMB","beruwela":"CMB","katmandou":"KTM","taskent":"TAS","samarcanda":"SKD",
 "dubai":"DXB","abou-dabi":"AUH","ras-el-khaimah":"RKT","mascate":"MCT","salalah":"SLL","maldives":"MLE","maurice":"MRU","praslin":"SEZ",
 "costa-blanca":"ALC","alicante":"ALC","formentera":"IBZ","minorque":"MAH","grenade":"AGP","cordoue":"SVQ","cote-d-algarve":"FAO","ile-de-sao-miguel":"PDL","sicile":"CTA","sardaigne":"OLB","cote-amalfitaine":"NAP","pouilles":"BRI","rimini":"RMI","mykonos":"JMK","ile-de-paros":"ATH","cephalonie":"EFL","thessalonique":"SKG","hvar":"SPU","zadar":"ZAD","makarska":"SPU","marmaris":"DLM","bodrum-peninsula":"BJV","fethiye":"DLM","paphos":"PFO","limassol":"LCA","sunny-beach":"BOJ","sofia":"SOF","lisbonne":"LIS","porto":"OPO","naples":"NAP","budapest":"BUD","prague":"PRG","vienne":"VIE","berlin":"BER","munich":"MUC","amsterdam":"AMS","londres":"LON","dublin":"DUB",
 "sharm-el-sheikh":"SSH","marsa-alam":"RMF","hurghada":"HRG","agadir":"AGA","marrakech":"RAK","essaouira":"ESU","djerba":"DJE","sousse":"MIR","region-hammamet":"NBE","zarzis":"DJE","mahdia":"MIR","ile-de-sal":"SID","boa-vista":"BVC","mombasa":"MBA","diani-beach":"MBA",
 "punta-cana":"PUJ","puerto-plata":"POP","samana":"AZS","riviera-maya":"CUN","cozumel":"CZM","los-cabos":"SJD","varadero":"VRA","martinique":"FDF","guadeloupe":"PTP","new-york":"NYC","miami":"MIA","las-vegas-nv":"LAS","los-angeles":"LAX","orlando-fl":"MCO","montreal":"YMQ","quebec":"YQB","toronto":"YTO","guanacaste":"LIR","tahiti":"PPT","bora-bora":"PPT","sydney":"SYD",
}

STAY_QUOTA = {
    "phuket": 3, "bangkok": 3, "pattaya": 3, "chiang-mai": 2, "ko-phi-phi-don": 2, "ao-nang": 2,
    "ho-chi-minh": 2, "da-nang": 3, "nha-trang": 2, "ha-long": 1, "bali": 3, "lombok": 2,
    "boracay-island": 2, "palawan": 1, "sihanoukville": 1, "ile-de-singapour": 2,
    "tokyo": 2, "osaka": 2, "seoul": 2, "jeju-do": 1, "shanghai": 1, "hong-kong": 1, "goa": 2, "kerala": 1, "colombo": 1,
    "dubai": 3, "abou-dabi": 2, "ras-el-khaimah": 2, "mascate": 1, "maldives": 3, "maurice": 3, "praslin": 1,
    "costa-blanca": 2, "alicante": 1, "formentera": 1, "minorque": 2, "cote-d-algarve": 2, "ile-de-sao-miguel": 1,
    "sicile": 2, "sardaigne": 2, "cote-amalfitaine": 1, "pouilles": 1, "mykonos": 2, "ile-de-paros": 1, "cephalonie": 1,
    "hvar": 1, "makarska": 1, "marmaris": 2, "bodrum-peninsula": 2, "fethiye": 1, "paphos": 2, "limassol": 1, "sunny-beach": 1,
    "sharm-el-sheikh": 2, "marsa-alam": 1, "zarzis": 1, "mahdia": 1, "ile-de-sal": 1, "boa-vista": 1, "diani-beach": 1,
    "punta-cana": 3, "puerto-plata": 1, "samana": 1, "riviera-maya": 2, "cozumel": 1, "varadero": 1, "martinique": 2, "guadeloupe": 2,
    "tahiti": 1, "bora-bora": 1, "los-cabos": 1,
}
HOTEL_QUOTA = {  # hôtels seuls : 28 dont 8 en Asie
    "bangkok": 2, "tokyo": 2, "seoul": 1, "ho-chi-minh": 1, "bali": 1, "hong-kong": 1,
    "dubai": 2, "abou-dabi": 1, "lisbonne": 2, "porto": 1, "budapest": 2, "prague": 2, "vienne": 1, "berlin": 2, "munich": 1,
    "amsterdam": 2, "londres": 2, "dublin": 1, "naples": 1, "new-york": 2, "montreal": 1,
}
FLIGHT_TARGETS = [  # (destination, pays) : 18 routes, 8 en Asie stricte
    ("Séoul", "Corée du Sud"), ("Hô Chi Minh-Ville", "Vietnam"), ("Kuala Lumpur", "Malaisie"), ("Manille", "Philippines"),
    ("Delhi", "Inde"), ("Katmandou", "Népal"), ("Phnom Penh", "Cambodge"), ("Osaka", "Japon"),
    ("Abu Dhabi", "Émirats arabes unis"), ("Mascate", "Oman"), ("Doha", "Qatar"), ("Johannesburg", "Afrique du Sud"),
    ("Lima", "Pérou"), ("Mexico", "Mexique"), ("San Francisco", "États-Unis"), ("Auckland", "Nouvelle-Zélande"),
    ("Port-Louis", "Île Maurice"), ("Saint-Domingue", "République dominicaine"),
]

REGION_OF_COUNTRY = {"Corée du Sud": "Asie", "Vietnam": "Asie du Sud-Est", "Malaisie": "Asie du Sud-Est", "Philippines": "Asie du Sud-Est", "Inde": "Asie", "Népal": "Asie", "Cambodge": "Asie du Sud-Est", "Japon": "Asie", "Émirats arabes unis": "Moyen-Orient", "Oman": "Moyen-Orient", "Qatar": "Moyen-Orient", "Afrique du Sud": "Afrique", "Pérou": "Amérique du Sud", "Mexique": "Caraïbes", "États-Unis": "Amérique du Nord", "Nouvelle-Zélande": "Océanie", "Île Maurice": "Océan Indien", "République dominicaine": "Caraïbes"}


def slugify(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def used_keys(*files):
    keys = set()
    for f in files:
        for v in json.load(open(f)).values():
            src = v.get("source") or {}
            if src.get("hotel"):
                keys.add((src["hotel"], src.get("departure") or src.get("date_from")))
    return keys


def mk_offer_base(slug, cat, subtype, dest, country, region, title, nights, days, stars, board, depart="Paris"):
    return {
        "slug": slug, "new": True, "category": cat, "subtype": subtype, "destination": dest, "country": country, "region": region,
        "title": title, "nights": nights, "days": days, "stars": stars, "board": board, "departureCity": depart,
        "rating": 0, "reviews": 0,
    }


def main():
    used = used_keys("out_stays.json")
    rep = collections.Counter()
    new = []

    # ---------- séjours ----------
    by_page = collections.defaultdict(list)
    for x in S.forfaits:
        if x["board"] and x["nights"] and x["price"] and (x["hotel"], x["departure"]) not in used and x["nights"] >= 4:
            by_page[x["pageslug"]].append(x)
    for page, q in STAY_QUOTA.items():
        meta = NEW_PAGES.get(page)
        if not meta:
            rep["page_inconnue:" + page] += 1
            continue
        cands = sorted(by_page.get(page, []), key=lambda c: (c["stars"], c["price"]))
        if not cands:
            rep["sans_forfait:" + page] += 1
            continue
        # diversité : on répartit les choix sur la gamme de prix et d'étoiles
        picks = []
        step = max(len(cands) // max(q, 1), 1)
        for i in range(q):
            idx = min(i * step + step // 2, len(cands) - 1)
            c = cands[idx]
            if c not in picks:
                picks.append(c)
        for c in picks:
            dest, country, region = meta
            slug = f"{slugify(dest)}-{slugify(c['hotel'])[:44]}-{c['nights']}n"
            fake_o = {"slug": slug, "destination": dest, "country": country, "depart": "Paris", "stars": c["stars"], "board": c["board"], "nights": c["nights"], "ancien_prix": c["price"], "iata": PAGE_IATA.get(page)}
            ov = S.build_forfait_overlay(fake_o, c, None)
            base = mk_offer_base(slug, "sejours", ov["subtype"], dest, country, region, ov["title"], c["nights"], ov["days"], c["stars"], c["board"])
            # destinations hors tables de vol connues : le libellé aéroport reste celui de la page
            base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct")})
            base["source"] = ov["source"]
            base["tags"] = ov.get("tags", [])
            new.append(base)
            used.add((c["hotel"], c["departure"]))
            rep["sejours"] += 1
            if country in ASIE_STRICT:
                rep["asie"] += 1

    # ---------- complément de séjours pour atteindre 100 ----------
    target_stays = 100
    per_page = collections.Counter()
    for o in new:
        if o["category"] == "sejours":
            per_page[o["source"]["page"].strip("/").split("/")[-1]] += 1
    guard = 0
    while sum(1 for o in new if o["category"] == "sejours") < target_stays and guard < 400:
        guard += 1
        left = [(len([c for c in cs if (c["hotel"], c["departure"]) not in used]), p) for p, cs in by_page.items() if p in NEW_PAGES and per_page[p] < 6]
        left = [t for t in left if t[0] > 0]
        if not left:
            break
        left.sort(key=lambda t: (-t[0], t[1]))
        # alternance : une page asiatique, une autre, pour garder la part d'Asie
        page = left[0][1]
        cands = sorted([c for c in by_page[page] if (c["hotel"], c["departure"]) not in used], key=lambda c: (c["price"]))
        c = cands[len(cands) // 2]
        dest, country, region = NEW_PAGES[page]
        slug = f"{slugify(dest)}-{slugify(c['hotel'])[:44]}-{c['nights']}n"
        fake_o = {"slug": slug, "destination": dest, "country": country, "depart": "Paris", "stars": c["stars"], "board": c["board"], "nights": c["nights"], "ancien_prix": c["price"], "iata": PAGE_IATA.get(page)}
        ov = S.build_forfait_overlay(fake_o, c, None)
        base = mk_offer_base(slug, "sejours", ov["subtype"], dest, country, region, ov["title"], c["nights"], ov["days"], c["stars"], c["board"])
        base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct")})
        base["source"] = ov["source"]
        new.append(base)
        used.add((c["hotel"], c["departure"]))
        per_page[page] += 1
        rep["sejours"] += 1
        rep["sejours_complement"] += 1
        if country in ASIE_STRICT:
            rep["asie"] += 1

    # ---------- hôtels seuls ----------
    stars_by = S.stars_by_name
    by_page_h = collections.defaultdict(list)
    for h in S.hotels:
        if h["price_pp_night"] and h["nights"]:
            by_page_h[h["pageslug"]].append(h)
    for page, q in HOTEL_QUOTA.items():
        meta = NEW_PAGES.get(page)
        if not meta:
            continue
        cands = [h for h in by_page_h.get(page, []) if S.norm(h["hotel"]) in stars_by or True]
        cands.sort(key=lambda h: (stars_by.get(S.norm(h["hotel"])) is None, h["price_pp_night"]))
        step = max(len(cands) // max(q, 1), 1)
        picks = []
        for i in range(q):
            if not cands:
                break
            c = cands[min(i * step + step // 2, len(cands) - 1)]
            if c not in picks:
                picks.append(c)
        for h in picks:
            dest, country, region = meta
            nights = 3 if h["nights"] > 5 else h["nights"]
            slug = f"hotel-{slugify(dest)}-{slugify(h['hotel'])[:40]}"
            fake_o = {"slug": slug, "destination": dest, "country": country, "depart": "Paris", "stars": 0, "board": "Petit-déjeuner", "nights": nights, "ancien_prix": 1}
            ov = S.build_hotel_overlay(fake_o, h, stars_by.get(S.norm(h["hotel"])))
            base = mk_offer_base(slug, "hotels", "hotel_seul", dest, country, region, ov["title"], nights, nights + 1, ov["stars"], "Formule à confirmer")
            base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct", "departureCity")})
            base["source"] = ov["source"]
            new.append(base)
            rep["hotels"] += 1
            if country in ASIE_STRICT:
                rep["asie"] += 1

    # ---------- circuits ----------
    pool = json.load(open("out_circuits_pool.json"))
    quotas = {"Thaïlande": 3, "Vietnam": 3, "Cambodge": 2, "Indonésie": 2, "Philippines": 1, "Laos": 1, "Malaisie": 1, "Japon": 2, "Chine": 1, "Corée du Sud": 1, "Inde": 2, "Népal": 1, "Ouzbékistan": 1, "Sri Lanka": 1,
              "Jordanie": 1, "Oman": 1, "Émirats arabes unis": 1,
              "Italie": 3, "Espagne": 3, "Portugal": 1, "Grèce": 1, "Croatie": 1, "Turquie": 1, "Islande": 1, "Irlande": 1, "Norvège": 1,
              "Maroc": 2, "Égypte": 1, "Tanzanie": 1, "Kenya": 1, "Afrique du Sud": 1, "Namibie": 1, "Madagascar": 1,
              "Canada": 1, "États-Unis": 1, "Pérou": 1, "Costa Rica": 1}
    comp = {"Thaïlande": ("Bangkok", "Asie du Sud-Est"), "Vietnam": ("Hanoï", "Asie du Sud-Est"), "Cambodge": ("Siem Reap", "Asie du Sud-Est"), "Indonésie": ("Bali", "Asie du Sud-Est"), "Philippines": ("Manille", "Asie du Sud-Est"), "Laos": ("Luang Prabang", "Asie du Sud-Est"), "Malaisie": ("Kuala Lumpur", "Asie du Sud-Est"),
            "Japon": ("Tokyo", "Asie"), "Chine": ("Pékin", "Asie"), "Corée du Sud": ("Séoul", "Asie"), "Inde": ("Delhi", "Asie"), "Népal": ("Katmandou", "Asie"), "Ouzbékistan": ("Tachkent", "Asie"), "Sri Lanka": ("Colombo", "Océan Indien"),
            "Jordanie": ("Amman", "Moyen-Orient"), "Oman": ("Mascate", "Moyen-Orient"), "Émirats arabes unis": ("Dubaï", "Moyen-Orient"),
            "Italie": ("Rome", "Europe"), "Espagne": ("Madrid", "Europe"), "Portugal": ("Lisbonne", "Atlantique"), "Grèce": ("Athènes", "Europe"), "Croatie": ("Split", "Europe"), "Turquie": ("Istanbul", "Europe"), "Islande": ("Reykjavik", "Europe"), "Irlande": ("Dublin", "Europe"), "Norvège": ("Bergen", "Europe"),
            "Maroc": ("Marrakech", "Afrique du Nord"), "Égypte": ("Le Caire", "Mer Rouge"), "Tanzanie": ("Arusha", "Afrique"), "Kenya": ("Nairobi", "Afrique"), "Afrique du Sud": ("Le Cap", "Afrique"), "Namibie": ("Windhoek", "Afrique"), "Madagascar": ("Tananarive", "Océan Indien"),
            "Canada": ("Montréal", "Amérique du Nord"), "États-Unis": ("New York", "Amérique du Nord"), "Pérou": ("Cusco", "Amérique du Sud"), "Costa Rica": ("San José", "Amérique centrale")}
    by_country = collections.defaultdict(list)
    for c in pool:
        for p in c["pays"]:
            by_country[p].append(c)
    per_day = {p: statistics.median(c["prix"] / c["duree_jours"] for c in cs) for p, cs in by_country.items() if cs}
    taken = set()
    for country, q in quotas.items():
        cs = [c for c in by_country.get(country, []) if C.has_detail(c) and c.get("depart_ville") in C.OK_DEPARTURES | {None}
              and 0.5 * per_day[country] <= c["prix"] / c["duree_jours"] <= 2.2 * per_day[country] and id(c) not in taken and len(c["pays"]) <= 2]
        cs.sort(key=lambda c: (c.get("depart_ville") != "Paris", -len(c["etapes"])))
        for c in cs[:q]:
            taken.add(id(c))
            dest, region = comp[country]
            title = C.clean_title(c["nom"])
            slug = f"circuit-{slugify(country)}-{slugify(title)[:46]}-{c['duree_jours']}j"
            fake_o = {"slug": slug, "country": country, "stars": 0, "subtype": "", "destination": dest}
            ov = C.overlay(fake_o, c)
            base = mk_offer_base(slug, "circuits", ov["subtype"], dest, country, region, ov["title"], ov["nights"], ov["days"], ov["stars"], ov["board"], ov["departureCity"])
            base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct", "departureCity")})
            base["source"] = ov["source"]
            new.append(base)
            rep["circuits"] += 1
            if country in ASIE_STRICT:
                rep["asie"] += 1

    # ---------- croisières ----------
    cpool = json.load(open("out_cruises_pool.json"))
    cpool.sort(key=lambda c: (c["_subtype"] != "croisiere_maritime", c.get("port_groupe") or ""))
    picked_ports = collections.Counter()
    want = [("Singapour", "Singapour", "Asie du Sud-Est"), ("Hong Kong", "Chine", "Asie"), ("Tokyo / Yokohama", "Japon", "Asie")]
    cr_count = 0
    for g, country, region in want:
        for c in cpool:
            if (c.get("port_groupe") or "").startswith(g.split(" /")[0]) and c["prix"] and picked_ports[g] < 1:
                picked_ports[g] += 1
                dest = g.split(" /")[0]
                slug = f"croisiere-{slugify(dest)}-{slugify(c['navire'])}-{c['duree_jours']}j"
                fake_o = {"slug": slug, "country": country, "destination": dest}
                ov = K.overlay(fake_o, c)
                base = mk_offer_base(slug, "croisieres", ov["subtype"], dest, country, region, ov["title"], ov["nights"], ov["days"], 0, ov["board"])
                base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct", "stars")})
                base["source"] = ov["source"]
                new.append(base)
                cr_count += 1
                rep["croisieres"] += 1
                rep["asie"] += 1 if country in ASIE_STRICT else 0
                break
    zones = collections.Counter()
    for c in cpool:
        g = c.get("port_groupe") or c.get("port_embarquement") or ""
        if g.split(" /")[0] in ("Singapour", "Hong Kong", "Tokyo", "Phuket"):
            continue
        if zones[g] >= 1 or cr_count >= 14:
            continue
        if not c.get("prix"):
            continue
        zones[g] += 1
        cr_count += 1
        country = {"Barcelone": "Espagne", "Venise": "Italie", "Marseille": "France", "Gênes": "Italie", "Naples": "Italie", "Civitavecchia": "Italie", "Palma de Majorque": "Espagne", "Lisbonne": "Portugal", "Southampton": "Royaume-Uni", "Copenhague": "Danemark", "Bergen": "Norvège", "Reykjavik": "Islande", "Miami": "États-Unis", "Fort-de-France": "Martinique", "Vancouver": "Canada", "Dubaï": "Émirats arabes unis", "Antalya": "Turquie", "Athènes": "Grèce", "Las Palmas": "Espagne", "Le Cap": "Afrique du Sud",
                   "Paris": "France", "Amsterdam": "Pays-Bas", "Lyon": "France", "Bordeaux": "France", "Porto": "Portugal", "Louxor": "Égypte", "Strasbourg": "France", "Passau": "Allemagne", "Prague": "Tchéquie"}.get(g.split(" /")[0].split(" (")[0], None)
        if not country:
            cr_count -= 1
            continue
        dest = g.split(" /")[0].split(" (")[0]
        slug = f"croisiere-{slugify(dest)}-{slugify(c['navire'])}-{c['duree_jours']}j"
        fake_o = {"slug": slug, "country": country, "destination": dest}
        ov = K.overlay(fake_o, c)
        base = mk_offer_base(slug, "croisieres", ov["subtype"], dest, country, "Fluvial" if "fluviale" in ov["subtype"] else "Méditerranée", ov["title"], ov["nights"], ov["days"], 0, ov["board"])
        base.update({k: v for k, v in ov.items() if k not in ("slug", "mode", "source", "discountPct", "stars")})
        base["source"] = ov["source"]
        new.append(base)
        rep["croisieres"] += 1

    # ---------- vols ----------
    kayak = S.kayak
    for dest, country in FLIGHT_TARGETS:
        ia = I.IATA.get(dest)
        r = kayak.get(f"PAR>{ia}")
        if not r:
            rep["vol_sans_donnee:" + dest] += 1
            continue
        slug = f"vol-paris-{slugify(dest)}-aller-retour"
        floor = r["rt_min"]
        low = r.get("usual_low") or int(round(floor * 1.25))
        ref = max(low, math.ceil(floor / 0.93))
        pr = PM.price_from_reference(ref, slug, floor)
        dur = None
        m = re.match(r"(\d+)h\s*(\d+)?", r.get("direct_duration") or "")
        if m:
            dur = f"{int(m.group(1))} h {int(m.group(2) or 0):02d}"
        airlines = [a for a in (r.get("direct_airlines") or []) if "autres" not in a]
        direct_from = int(math.ceil(r["direct_usual_low"] * 0.93)) if r.get("direct_usual_low") else None
        parts = [f"Vol aller-retour Paris – {dest}, tarif à partir de {pr['price']} € par personne."]
        if dur:
            parts.append(f"Durée moyenne d'un vol direct : {dur}.")
        if airlines:
            parts.append(f"Vols directs proposés par {', '.join(airlines)}.")
        elif not dur:
            parts.append("Pas de vol direct relevé sur cette route : une escale est à prévoir.")
        base = mk_offer_base(slug, "vols", "vol_seul", dest, country, REGION_OF_COUNTRY.get(country, "Asie"), f"Vol Paris-{dest} aller-retour", 0, 0, 0, "Vol seul")
        base.update({
            "price": pr["price"], "oldPrice": ref, "priceFloor": floor,
            "referencePriceSource": f"Kayak, relevé du {NOW} : prix habituels {r.get('usual_low')}–{r.get('usual_high')} €, mini observé {floor} €",
            "description": " ".join(parts),
            "highlights": [h for h in [
                f"Vol aller-retour Paris – {dest}",
                f"Vol direct possible, durée moyenne {dur}" if dur else None,
                f"Vols directs : {', '.join(airlines)}" if airlines else None,
                f"Tarif minimum observé sur la route : {floor} €",
            ] if h],
            "included": [f"Vol aller-retour Paris – {dest}", "Taxes aériennes comprises dans le tarif"],
            "details": {"flights": {k: v for k, v in {"from": "Paris", "baggage": "Franchise bagages selon la compagnie et le tarif retenus, précisée avant tout paiement.", "to": f"{dest} ({ia})", "direct": None, "duration": f"environ {dur} en vol direct" if dur else None, "airlines": airlines or None, "note": (f"Tarif de base, un vol avec escale est possible. Vol direct à partir d'environ {direct_from} €." if direct_from else "Tarif de base, un vol avec escale est possible.")}.items() if v is not None}},
        })
        new.append(base)
        rep["vols"] += 1
        if country in ASIE_STRICT:
            rep["asie"] += 1

    json.dump(new, open("out_new.json", "w"), ensure_ascii=False, indent=1)
    print(dict(rep), "| total", len(new))
    cats = collections.Counter(o["category"] for o in new)
    print(cats)
    asie = sum(1 for o in new if o["country"] in ASIE_STRICT)
    print("Asie (continent « Asie » du site):", asie, f"({100*asie/len(new):.0f} %)")


if __name__ == "__main__":
    main()

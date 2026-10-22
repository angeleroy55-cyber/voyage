# Construction du catalogue de marché

Scripts Python qui transforment un relevé de marché en `src/lib/market/catalogue-market.json`
(voir `docs/superpowers/specs/2026-10-21-refonte-catalogue-design.md`). Ils ne font aucun appel
réseau : ils lisent des fichiers de relevé et écrivent du JSON.

## Entrées (dans le dossier de travail, hors dépôt)

| Fichier | Contenu |
| --- | --- |
| `inventaire-offres.json` | Offres actuelles : slug, catégorie, destination, étoiles, formule, nuits, prix… |
| `offres-gelees.json` | Offres visées par une demande client (leur identité n'est pas modifiée) |
| `lt_forfaits.json`, `lt_hotels.json` | Cartes Logitravel analysées par `parse_logitravel.py` |
| `kayak-parsed.json` | Routes Kayak analysées par `parse_kayak.py` |
| `releves/circuits-*.json`, `croisieres-*.json`, `faits-pays.json` | Relevés détaillés (itinéraires, inclus, formalités) |
| `hotel_details.json`, `hotel-urls.json` | Équipements d'hôtel, par `parse_hotel_details.py` |

## Ordre

```bash
python3 assign_stays.py      # séjours et hôtels -> out_stays.json
python3 assign_flights.py    # vols              -> out_flights.json
python3 assign_circuits.py   # circuits          -> out_circuits.json (+ pool)
python3 assign_cruises.py    # croisières        -> out_cruises.json (+ pool)
python3 new_offers.py        # 200 nouvelles offres -> out_new.json
CATALOGUE_MARKET=../../src/lib/market/catalogue-market.json python3 merge_market.py
npx tsx scripts/probe-market.mts   # contrôle : remises 4 à 11 %, planchers, Asie >= 25 %
```

## Règles à respecter pour un nouveau relevé

- Seules les pages publiques et les chemins autorisés par le robots.txt du site, une page
  toutes les 6 à 8 secondes. Logitravel coupe les connexions au-delà.
- Les sites protégés par un défi anti-robot (Promoséjours, Cloudflare) ne sont pas
  contournés.
- Des faits, reformulés : jamais de texte commercial, de photo ni d'avis repris.
- `pricing_model.py` est la seule source de la règle de prix (4 à 11 %, déterministe).

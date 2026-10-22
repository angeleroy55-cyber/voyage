#!/usr/bin/env python3
"""Règle de prix GoSéjour : 4 à 11 % sous le marché, jamais sous un plancher.

reference  = prix concurrent relevé (le plus bas des deux montants affichés par le site)
price      = floor(reference × (1 − d)), d tiré de façon déterministe entre 4 % et 11 %
floor      = plancher absolu (vols : tarif aller-retour mini observé)

Le tirage de d ne dépend que du slug de l'offre : relancer la construction donne les mêmes prix.
"""
import hashlib
import math

D_MIN = 4.0
D_MAX = 11.0


def discount_for(key: str) -> float:
    """Remise (en %) déterministe, par pas de 0,5 point, entre D_MIN et D_MAX."""
    h = int(hashlib.sha256(key.encode("utf-8")).hexdigest()[:8], 16)
    steps = int((D_MAX - D_MIN) / 0.5)  # 14 pas
    return D_MIN + 0.5 * (h % (steps + 1))


def price_from_reference(reference: int, key: str, floor: int | None = None) -> dict:
    d = discount_for(key)
    price = math.floor(reference * (1 - d / 100))
    # l'arrondi à l'euro inférieur ne doit jamais dépasser la remise maximale
    price = max(price, math.ceil(reference * (1 - D_MAX / 100)))
    clamped = False
    if floor and price < floor:
        price = floor
        clamped = True
    return {
        "reference": reference,
        "discount_pct": d,
        "price": price,
        "floor_applied": clamped,
        "real_discount_pct": round(100 * (reference - price) / reference, 1),
    }


if __name__ == "__main__":
    for k in ("a", "b", "c", "d"):
        print(price_from_reference(500, k))

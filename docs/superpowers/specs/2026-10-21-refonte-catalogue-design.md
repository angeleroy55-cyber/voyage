# Refonte du catalogue sur le marché (21 octobre 2026)

## Pourquoi

Le catalogue décrivait des offres génériques (« Hôtel 4★ à Valence »), à des prix
relevés de façon approximative et souvent très en dessous du marché (un séjour tout
compris aux Maldives à 263 €, un vol Paris–Dubaï à 114 €), avec un calendrier où chaque
jour du mois était réservable. Le fondateur demande : références uniques, fiches aussi
détaillées que celles de Logitravel et Promoséjours (hôtel nommé, vols, repas), prix
alignés sur le marché (4 à 11 % moins chers, jamais sous le prix plancher d'un vol),
15 à 20 dates par mois, et 200 offres de plus dont au moins un quart en Asie.

## Décisions

**Références.** Un seul préfixe, `GO-`. Offres : `GO-74990` (cinq chiffres). Nouveaux
dossiers : `GO-` + six caractères dont au moins une lettre (jamais confondus avec une
offre). Les 47 demandes clients déjà reçues restent en `GS-` : leurs clients ont reçu cette
référence par e-mail et s'en servent comme motif de virement. Quatre dossiers de
démonstration (`example.fr`) sont renommés à la mise en production.

**Sources.** Logitravel (listings par destination, fiches hôtel, circuits, croisières) et
Kayak (prix de vols par route), relevés le 21/10/2026 dans un navigateur, à cadence lente,
hors chemins interdits par leur robots.txt. Promoséjours est derrière un défi anti-robot
Cloudflare : il n'a pas été contourné. Google Flights n'est lisible qu'avec JavaScript :
Kayak le remplace. Aucun texte commercial ni aucune photo n'est repris : seuls les faits
(hôtel, étoiles, pension, nuits, aéroport, vol direct, prix, itinéraire, inclus) le sont,
reformulés dans nos termes. Les équipements d'hôtel passent par une liste fermée.

**Prix.** `prix GoSéjour = prix du marché relevé × (1 − d)`, `d` entre 4 et 11 %, tiré de
façon déterministe sur le slug (relancer donne les mêmes prix). Vols : plancher absolu =
tarif aller-retour mini observé sur la route (`Offer.priceFloor`), référence = bas de la
fourchette des prix habituels. Le calendrier applique la même fourchette, plus le
plancher (`src/lib/pricing.ts`).

**Calendrier.** Quatre jours de départ par semaine, soit 16 à 19 dates par mois (testé sur
160 routes, `scripts/probe-departure-days.mts`), sur 9 à 12 mois. Les jours sont fixés par
route (ville de départ + pays), via `Offer.excludedWeekdays`, sans écraser un réglage du
back-office. Ce n'est pas un flux de disponibilité en temps réel.

**Fiche.** Colonne JSON `Offer.details` : établissement nommé (hôtel, navire), équipements,
horaires d'arrivée et de départ, vols (direct ou non, durée, compagnies de la route),
repas, transferts. Une rubrique absente du relevé n'est pas affichée comme connue :
elle renvoie à la confirmation de disponibilité.

**Offres visées par une demande client.** Les 33 offres (31 avec une demande active) qui
portent une demande de client en cours gardent leur identité (titre, hôtel, formule) :
seul leur prix est recalé sur le marché.

**Notes et avis.** Aucune note n'est reprise : les produits relevés n'ont pas d'avis
GoSéjour. `rating` et `reviews` valent 0 sur toute offre relevée ou nouvelle, et la fiche
n'affiche rien (« 0,0 · 0 avis » serait un faux signal).

## Ce qui est fait

- 920 offres existantes rattachées à un produit réel, 173 vols recalés sur Kayak,
  231 offres dont seul le prix est recalé, 200 offres nouvelles (79 en Asie, 40 %).
- 274 fiches hôtel lues (équipements, horaires) ; 308 offres en bénéficient.
- 9 destinations ajoutées au hub (Corée du Sud, Népal, Laos, Philippines, Cambodge, Chine,
  Inde, Ouzbékistan, Oman), avec des textes tirés des relevés (durée de vol, monnaie,
  décalage horaire).
- Formalités d'entrée, monnaie et décalage horaire par pays, avec la source officielle.

## Limites connues

- Le prix d'une offre est celui observé pour **une date de départ** (indiquée dans
  `referencePriceSource`). Le calendrier n'ajoute que ±5 % (week-end) et ±4 % (saison) :
  en haute saison, le prix réel du marché peut être nettement plus haut. Une saisonnalité
  fine demande un flux de prix par date.
- Campings, parcs de loisirs, locations de voiture et stations de ski : aucune source
  de référence lisible, ces offres ne sont pas revues (prix inchangés).
- Environ 36 % des hôtels nommés ont une fiche détaillée lisible ; les autres n'ont que
  le nom, les étoiles, la pension et le vol.
- Promoséjours n'a pas pu être consulté.

## Mise en production

Dans cet ordre (voir `scripts/rollout-prod.md`) : sauvegarde des tables, `prisma db push`
(deux colonnes nullables ajoutées, sans perte), déploiement du code, renommage des dossiers
de démonstration, `npm run db:seed`. Le seed est idempotent et n'écrase ni les images
téléversées par l'équipe, ni les jours de départ déjà réglés.

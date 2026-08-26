# GoSéjour.fr : site de voyages + back-office

Agence de voyages en ligne : site public (recherche multi-produits, fiches
offres, réservation) et back-office complet, sur PostgreSQL.

## Démarrage rapide

Node n'est pas dans le `PATH` de cette machine. En PowerShell, une fois par session :

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

Puis, dans **deux terminaux** :

```bash
npm run db:local   # terminal 1 : PostgreSQL local (à laisser tourner)
npm run dev        # terminal 2 : http://localhost:3000
```

Si la base est vide (premier lancement, ou dossier `.pglite/` supprimé) :

```bash
npm run setup      # db:upgrade + db:push + db:seed
```

**Accès au back-office** : http://localhost:3000/admin
`admin@gosejour.fr` / `gosejour2026` (modifiable dans `.env`).

## Base de données

Le schéma vise **PostgreSQL** en local comme en production. Comme ni PostgreSQL
ni Docker n'étaient installables sur ce poste, le développement s'appuie sur
[PGlite](https://pglite.dev), un vrai PostgreSQL compilé en WebAssembly,
exposé par `npm run db:local` sur le protocole réseau PostgreSQL, port 5432.
Prisma, `psql` ou tout autre client s'y connectent normalement.

Passer en production ne demande **aucun changement de code** : il suffit de
pointer `DATABASE_URL` vers un PostgreSQL hébergé (Neon, Supabase, RDS…) et de
lancer `npm run db:push`. Le script `db:local` n'est alors plus utilisé.

Les données vivent dans `.pglite/` (non versionné). Pour repartir de zéro :
supprimer ce dossier puis relancer `npm run setup`.

| Script | Rôle |
| --- | --- |
| `npm run db:local` | Démarre PostgreSQL (PGlite) sur le port 5432 |
| `npm run db:upgrade` | Reprises à faire avant `db:push` (voir ci-dessous) |
| `npm run db:push` | Applique `prisma/schema.prisma` à la base |
| `npm run db:seed` | Remplit la base (46 offres, destinations, avis, articles, compte admin) |
| `npm run db:studio` | Explorateur Prisma Studio |
| `npm run photos` | Récupère les visuels du catalogue sur Wikimedia Commons |
| `npm run setup` | `db:upgrade`, `db:push`, puis `db:seed` |

`db:upgrade` prépare ce que `db push` ne sait pas faire seul : ajouter à une
table déjà peuplée une colonne à la fois obligatoire et unique. C'est le cas du
numéro de référence des offres. Le script remplit la colonne puis pose la
contrainte sur des données déjà valides, ce qui évite d'avoir à passer
`--accept-data-loss`. Il est sans effet sur une base neuve ou déjà à jour.

Le seed est idempotent : il peut être relancé sans créer de doublons, et ne
réécrit jamais le mot de passe d'un compte admin existant.

## Images et Cloudinary

Cloudinary s'active dès que les trois variables sont renseignées dans
`.env.local` :

```
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Sans elles, les téléversements du back-office sont écrits dans
`public/uploads/` : l'administration reste pleinement utilisable sans compte
Cloudinary. Le statut effectif est affiché dans **Réglages → État du système**.

## Messagerie de contact

Le projet utilise déjà `contact@gosejour.fr` comme adresse de contact publique.
La configuration de boîte mail peut aussi être préparée dans `.env.local` :

```env
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="contact@gosejour.fr"
SMTP_PASSWORD="..."
SMTP_FROM="GoSéjour <contact@gosejour.fr>"
BOOKING_NOTIFICATION_EMAIL="contact@gosejour.fr"
IMAP_HOST="imap.hostinger.com"
```

Le site envoie maintenant les e-mails transactionnels via `SMTP_*` :
confirmation de demande, notification interne de nouvelle réservation,
mise à jour de statut, reçu de paiement et message de bienvenue newsletter.
`BOOKING_NOTIFICATION_EMAIL` définit la boîte interne qui reçoit les nouvelles
demandes. `IMAP_HOST` ne sert qu'à la lecture de la boîte depuis un client
mail ; le site n'en a pas besoin.

## Le catalogue

Le catalogue vit dans `src/lib/catalogue-source.ts` : 61 destinations et
215 offres réparties sur les 10 catégories. Le seed le pose en base, rien n'est
saisi à la main.

**Ce qui est réel.** Les destinations, les pays, les villes, les régions, les
itinéraires de circuits et de croisières, les lignes aériennes, les durées
d'usage du marché, et les niveaux de prix, relevés en août 2026 sur Logitravel,
Salaün Holidays, Carrefour Voyages, Edentour et Promoséjours.

**Ce qui est générique.** Les intitulés d'hébergement. Une offre s'appelle
« Resort tout compris à Costa Adeje », pas du nom d'un hôtel précis. Reprendre
les fiches d'un concurrent serait une contrefaçon, et annoncer un établissement
nommé qu'on ne peut pas confirmer serait pire. Les noms d'établissements
arriveront avec le flux d'affiliation, qui les fournit avec la disponibilité et
le prix du jour.

**Les prix.** Chaque ligne du catalogue porte un prix de référence, celui du
marché, et un taux de remise. Le prix GoSéjour s'en déduit, 10 % en dessous par
défaut, jusqu'à 15 % sur les ventes flash. Le champ interne
`referencePriceSource` garde la trace du relevé, sans jamais l'afficher.

> Un point à trancher avant la mise en ligne : depuis la directive Omnibus,
> un prix barré doit correspondre au prix le plus bas pratiqué par le vendeur
> lui-même au cours des 30 derniers jours, et non au prix d'un concurrent.
> Présenter le relevé concurrentiel comme prix barré expose à une sanction. Les
> formulations conformes existent (« comparé à », « prix constaté ailleurs »,
> hors du barré) et ne demandent qu'un changement d'affichage : la donnée, elle,
> est déjà séparée en base.

**Les visuels** viennent de Wikimedia Commons, sous licence libre réutilisable
commercialement. `npm run photos` interroge l'API, écarte cartes, blasons,
gravures anciennes et formats verticaux, préfère le domaine public aux licences
à attribution, et écrit `src/lib/media/photos.json`, versionné. Le seed lit ce
fichier : il ne fait aucun appel réseau, et deux installations donnent le même
catalogue.

Les crédits obligatoires sont stockés avec chaque image et affichés sous la
galerie de la fiche offre. Ces photos illustrent la destination, jamais un
établissement : elles tiennent la place des visuels du prestataire.

```bash
npm run photos            # complète ce qui manque
npm run photos -- --tout  # refait tout le catalogue
```

## Catégories et navigation

L'arborescence suit le cahier de catégorisation. Chaque catégorie devient une
page à la racine du site, son slug étant l'URL : `/sejours`, `/circuits`,
`/bons-plans-promos`. Les dix premières forment le menu, les suivantes portent
`isOverflow` et se rangent sous « Voir plus de voyages », sans perdre ni leur
page ni leurs liens depuis le pied de page.

Une catégorie a l'un de ces quatre rôles, porté par son champ `kind` :

| Rôle | Ce que la page affiche | Exemples |
| --- | --- | --- |
| `catalogue` | Les offres qui lui sont rattachées (`Offer.categoryId`) | Séjours, Circuits, Hôtels |
| `dynamique` | Une sélection calculée à la lecture, selon `rule` | Bons Plans, Dernière Minute |
| `hub` | Renvoie vers `/destinations` | Destinations |
| `editorial` | Du contenu et un contact, sans catalogue | Sur-mesure, Assurance |

Les catégories `dynamique` traversent le catalogue au lieu de le dupliquer :
une même offre apparaît dans Bons Plans, dans Dernière Minute et dans sa
catégorie de rattachement, mais ne possède qu'une seule adresse, celle de cette
dernière. C'est la règle anti-cannibalisation du cahier, jamais deux URLs pour
un même contenu. Même logique pour les sous-types (`vol_hotel`, `tout_compris`,
`camping`) : ce sont des filtres, pas des pages.

Le badge « Dernière minute » n'est pas un champ : il se calcule à chaque
lecture à partir de `departureDate`, sous le seuil de `LAST_MINUTE_DAYS`
(21 jours). Une offre ne peut donc pas rester annoncée comme urgente après son
départ.

**Numéro de référence.** Chaque offre porte un `GSJ-XXXXXX` unique, attribué à
la création et jamais réattribué, même après suppression. Il ne vient pas d'un
tirage aléatoire mais d'un compteur strictement croissant, stocké dans la table
`Counter` (`src/server/references.ts`). Le back-office le cherche comme critère
de recherche prioritaire : « 48213 » retrouve `GSJ-048213`.

Les anciennes adresses `/recherche/[categorie]` redirigent en 308 vers les
nouvelles, y compris les quatre slugs renommés (`vol-hotel` vers `sejours`,
`campings` et `escapades` vers `camping-escapades`, `voitures` vers
`location-voiture`). Voir `next.config.ts`.

## Parcours de réservation

Trois étapes, une URL par étape :

| Étape | Route | Ce qui s'y passe |
| --- | --- | --- |
| 1. Votre séjour | `/offre/[slug]` | Voyageurs et assurance ; « Demander cette offre » passe ces choix en `GET` |
| 2. Coordonnées et paiement | `/reservation/[slug]` | Identité, précisions, moyen de paiement et échéancier |
| 3. Confirmation | `/reservation/confirmee/[reference]` | Référence du dossier et récapitulatif |

Les moyens de paiement affichés sont ceux de `PAYMENT_METHODS`
(`src/lib/constants.ts`), unique source pour le bandeau du pied de page, le
choix proposé au client et la validation côté serveur : un identifiant absent de
cette liste est refusé. L'échéancier (comptant ou 4×) est un choix distinct, car
il s'applique quel que soit le moyen retenu.

Rien n'est débité : la demande arrive au statut « en attente » et le règlement
suit la confirmation par le back-office. Le total est systématiquement recalculé
depuis le prix en base, jamais repris du formulaire.

## Back-office

| Section | Ce qu'on y fait |
| --- | --- |
| Tableau de bord | Indicateurs, CA confirmé, dernières réservations, avis à modérer |
| Catégories | Slug, rôle, règle de listing, ordre du menu, débordement, couleur du badge, affichage de la remise en % |
| Offres | CRUD complet, galerie d'images, statut brouillon/en ligne/archivée, mise en avant |
| Destinations | Création, édition en ligne, visuel, mise en avant sur l'accueil |
| Réservations | Suivi, confirmation/annulation, notes internes |
| Avis | Modération : publier, refuser, supprimer |
| Articles | Carnet de voyage : rédaction, visuel, publication |
| Réglages | Nom, signature, contacts, accroches d'accueil ; état du système ; comptes |

**Sécurité** : mots de passe dérivés avec scrypt (`node:crypto`, sel par compte,
comparaison à durée constante) ; session portée par un cookie `HttpOnly` signé
en HMAC-SHA256, valable 12 h. Toute page et toute action du back-office passent
par `requireSession()`. Le message d'échec de connexion est identique que le
compte soit inconnu ou le mot de passe faux, pour ne pas permettre d'énumérer
les adresses.

## Contacts et réseaux

| Élément | Où | Réglable |
| --- | --- | --- |
| Téléphone | Barre supérieure et pied de page | Réglages, `site.phone` |
| WhatsApp | Bouton vert du pied de page | Réglages, `site.whatsapp` |
| E-mail | Pied de page | Réglages, `site.email` |
| Réseaux sociaux | Pastilles du pied de page | `src/components/ui/BrandLogos.tsx` |
| Vidéos | Bloc « En vidéo » de l'accueil | `src/components/home/VideoSection.tsx` |

Le bouton WhatsApp ouvre une conversation avec un message pré-rempli. Vider le
réglage le fait disparaître : mieux vaut pas de bouton qu'un bouton vers un
numéro que personne ne surveille.

Les pastilles sociales ne listent que les comptes réellement tenus. Pinterest et
TikTok ont été retirés, faute de compte : ils pointaient vers l'accueil des
plateformes, ce qui est l'inverse d'un signe de confiance.

Les trois vidéos ne chargent rien de YouTube tant que le visiteur n'a pas
cliqué : la carte n'affiche qu'une vignette, et le lecteur (`youtube-nocookie`)
ne s'insère qu'au clic. Cela évite trois iframes de traceurs sur l'accueil.

## Marque

Le logo source (`assets/logo-source.jpeg`) est découpé par script :

```bash
npm run logo   # -> public/brand/logo-mark.png, logo-full.png, logo-wordmark.png
```

Les zones sont détectées par analyse des pixels, pas par coordonnées codées en
dur : remplacer le fichier source et relancer suffit. Palette dans
`src/app/globals.css` : bleu nuit `navy-900` (#0a1930) et or `gold-400`
(#ffc800), tous deux relevés sur le logo.

## Architecture

```
src/
├─ app/
│  ├─ (site)/           site public (en-tête + pied de page)
│  └─ admin/            back-office : /admin/connexion + (protected)/
├─ components/
│  ├─ site/ search/ home/ offer/ admin/ ui/
├─ server/
│  ├─ prisma.ts         client Prisma (adaptateur pg)
│  ├─ auth.ts           scrypt + jetons de session
│  ├─ session.ts        cookies, gardes
│  ├─ media.ts          Cloudinary / repli local
│  ├─ references.ts     compteur des numéros GSJ
│  ├─ catalogue.ts      lectures du site public
│  └─ actions/          Server Actions (écritures)
└─ lib/
   ├─ catalogue-source.ts  destinations et offres réelles
   ├─ media/photos.json    visuels résolus, versionnés
   └─ types, formatage, constantes
```

Le site public lit la base via `src/server/catalogue.ts`, qui rend exactement
les formes attendues par les composants : les pages sont en rendu dynamique,
donc une publication faite au back-office est visible immédiatement.

## Vérifications

```bash
npm run build   # 0 erreur TypeScript
npm run lint    # 0 avertissement
```

Sondes de diagnostic conservées : `scripts/probe-db.mts` (connexions
concurrentes), `scripts/probe-auth.mts` (chaîne d'authentification) et
`scripts/probe-categorisation.mts` (arborescence, numéros de référence, dates de
départ), à lancer avec `npx tsx scripts/<fichier>`.

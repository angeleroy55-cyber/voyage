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
npm run setup      # db:push + db:seed
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
| `npm run db:push` | Applique `prisma/schema.prisma` à la base |
| `npm run db:seed` | Remplit la base (46 offres, destinations, avis, articles, compte admin) |
| `npm run db:studio` | Explorateur Prisma Studio |
| `npm run setup` | `db:push` puis `db:seed` |

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
SMTP_USER="contact@gosejour.fr"
SMTP_PASSWORD="..."
IMAP_HOST="imap.hostinger.com"
```

`SMTP_*` servira à une future intégration d'envoi d'e-mails transactionnels
(confirmation, notifications back-office, etc.). `IMAP_HOST` ne sert qu'à la
lecture de la boîte depuis un client mail ; le site n'en a pas besoin.

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
│  ├─ catalogue.ts      lectures du site public
│  └─ actions/          Server Actions (écritures)
└─ lib/                 types, formatage, constantes
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
concurrentes) et `scripts/probe-auth.mts` (chaîne d'authentification), à lancer
avec `npx tsx scripts/<fichier>`.

# Migration des visuels métier vers Cloudinary et la base

## Objectif

Faire de PostgreSQL la source métier unique pour les visuels éditoriaux du site, et de Cloudinary leur stockage unique. À la fin du chantier, les destinations, offres, articles et le carrousel hero de l'accueil devront être éditables depuis le back-office, servis par Cloudinary, cohérents sur tout le site, et ne plus dépendre de `picsum.photos` pour les contenus gérés.

## Résultat attendu

- Les visuels des destinations, des galeries d'offres, des articles et du hero d'accueil sont stockés sur Cloudinary.
- La base stocke pour chaque visuel au minimum l'URL publique et le `public_id` Cloudinary.
- Le site public lit les visuels depuis la base, sans fallback `picsum` pour les contenus gérés.
- Le back-office permet d'éditer ces contenus sans intervention dans le code.
- La migration est idempotente et peut être relancée sans dupliquer inutilement les uploads.

## Hors périmètre

- Les logos système (`public/brand/*`, favicon, image Open Graph générale) restent des assets applicatifs.
- Les logos de paiement et les icônes sociales restent hors base.
- Aucune refonte visuelle globale du site n'est incluse dans ce chantier.

## État actuel

### Déjà en base

- `Destination.imageUrl` et `Destination.imageId`
- `Post.imageUrl` et `Post.imageId`
- `OfferImage.url` et `OfferImage.publicId`

### Encore hors base ou incohérent

- Le hero homepage est codé en dur dans `src/components/home/HeroCarousel.tsx`.
- Le seed remplit destinations, articles et galeries d'offres avec des URLs `picsum.photos`.
- Plusieurs pages publiques gardent des fallbacks `picsum` si un visuel est absent.
- L'admin ne gère pas encore les textes alternatifs de destinations et articles.

## Principe d'architecture

### Source métier

La base porte l'état éditorial. Toute entité affichée sur le site public doit exposer ses visuels depuis PostgreSQL.

### Stockage

Cloudinary est la source unique de stockage des médias métier. Le stockage local `public/uploads` reste seulement un repli technique si Cloudinary n'est pas configuré en développement, mais il ne doit plus être utilisé pour les contenus migrés en production.

### Modèle retenu

Pas de table média générique pour ce chantier. On reste aligné avec l'existant en enrichissant les modèles déjà présents et en ajoutant un modèle dédié au hero.

## Changements de schéma

### Destination

Ajouter :

- `imageAlt String @default("")`

Conserver :

- `imageUrl`
- `imageId`

### Post

Ajouter :

- `imageAlt String @default("")`

Conserver :

- `imageUrl`
- `imageId`

### OfferImage

Conserver :

- `url`
- `publicId`
- `alt`
- `position`

Le champ `alt` devient obligatoire côté usage admin, même si le schéma garde un défaut vide pour compatibilité.

### HeroSlide

Ajouter un nouveau modèle :

- `id String @id @default(cuid())`
- `kicker String @default("")`
- `title String`
- `text String @default("")`
- `href String @default("/")`
- `cta String @default("")`
- `imageUrl String @default("")`
- `imageId String @default("")`
- `imageAlt String @default("")`
- `position Int @default(0)`
- `active Boolean @default(true)`

Index recommandé :

- `@@index([active, position])`

## Organisation Cloudinary

Tous les uploads passeront sous le dossier racine `gosejour`.

Arborescence :

- `gosejour/destinations/<slug>`
- `gosejour/offers/<offer-slug>/<position-or-image-id>`
- `gosejour/posts/<slug>`
- `gosejour/hero/<position>`

Règles :

- Toujours stocker `secure_url` en base.
- Toujours stocker le `public_id` retourné par Cloudinary.
- Ne jamais dériver le `public_id` depuis l'URL.

## Migration des données existantes

### Script

Créer un script dédié, par exemple `scripts/migrate-media-to-cloudinary.mts`.

Le script doit :

1. Charger l'environnement.
2. Vérifier que Cloudinary est configuré.
3. Lire la base.
4. Migrer successivement :
   - destinations
   - images d'offres
   - articles
   - slides hero initiaux
5. Produire un résumé final.

### Sources à migrer

- URLs `picsum.photos`
- URLs locales commençant par `/uploads/`
- Éventuels visuels déjà distants hors Cloudinary utilisés par les contenus gérés

### Sources à ignorer

- URLs déjà hébergées sur le compte Cloudinary cible
- enregistrements vides, tout en les signalant dans le rapport

### Règles de sécurité

- Ne mettre à jour la base qu'après upload réussi.
- Continuer la migration si un upload échoue, sans stopper tout le script.
- Journaliser les erreurs avec l'entité concernée.
- Ne jamais supprimer une ancienne source dans le script de migration.

### Idempotence

Pour chaque enregistrement :

- si `imageId` ou `publicId` pointe déjà vers Cloudinary, ne rien faire ;
- si `url` pointe déjà vers `res.cloudinary.com`, ne rien faire ;
- sinon migrer et mettre à jour.

## Initialisation et migration du hero

Les slides actuellement codés en dur dans `HeroCarousel.tsx` deviennent les données initiales du modèle `HeroSlide`.

Étapes :

1. Créer les lignes `HeroSlide` si elles n'existent pas.
2. Pour chaque slide initiale, générer l'image source actuelle.
3. Envoyer cette image vers Cloudinary.
4. Sauvegarder `imageUrl`, `imageId` et `imageAlt`.
5. Faire lire le hero homepage depuis la base.

Le hero ne doit plus dépendre du tableau `SLIDES` codé en dur après migration.

## Changements back-office

### Destinations

Écran `Destinations` :

- ajouter un champ `imageAlt` à la création ;
- ajouter un champ `imageAlt` à l'édition ;
- conserver l'aperçu du visuel ;
- conserver le remplacement de fichier existant.

Action serveur `saveDestination` :

- persister `imageAlt` ;
- supprimer l'ancien média Cloudinary uniquement lors d'un remplacement réussi.

### Articles

Écran `Articles` :

- ajouter un champ `imageAlt` à la création ;
- ajouter un champ `imageAlt` à l'édition ;
- conserver l'aperçu et le remplacement de visuel.

Action serveur `savePost` :

- persister `imageAlt` ;
- si un nouveau visuel remplace l'ancien, supprimer l'ancien `imageId` Cloudinary.

### Hero

Ajouter une page admin dédiée, par exemple `admin/hero` ou intégrer un bloc dédié dans `admin/parametres`.

Champs éditables :

- ordre
- actif/inactif
- kicker
- titre
- texte
- lien
- libellé CTA
- image
- texte alternatif

Actions :

- créer un slide
- modifier un slide
- remplacer son image
- supprimer un slide
- réordonner via champ `position`

### Offres

La page offre admin existe déjà et gère une galerie en base. Le chantier doit surtout :

- conserver cette galerie comme source unique ;
- rendre le texte alternatif systématique ;
- s'assurer que tout le front consomme bien la galerie de base avant tout fallback.

## Changements front public

### À brancher sur la base

- `HeroCarousel`
- grilles destinations
- cartes offres
- fiches offres
- section blog
- pages blog
- espace client si image d'offre affichée
- pages réservation et confirmation qui affichent une image d'offre

### Politique de fallback

Pour les contenus gérés par l'admin :

- plus de fallback `picsum` en production ;
- si un visuel manque malgré tout, afficher un placeholder interne simple ou masquer proprement le bloc image, selon le composant.

Le but est de ne plus dépendre d'un service d'images externe aléatoire pour les contenus métier.

## Seed

Le seed ne doit plus réinjecter de `picsum` par-dessus des données déjà migrées.

Règles :

- destinations : ne remplir les champs image qu'en l'absence totale de visuel ;
- offres : même logique pour les galeries ;
- articles : ne pas remplacer un visuel existant en base ;
- hero : créer les slides initiales seulement si aucune slide n'existe.

Le seed reste idempotent et compatible avec une base vide.

## Couche catalogue et types

Mettre à jour :

- `src/server/catalogue.ts`
- `src/lib/types.ts`

Objectifs :

- exposer les nouveaux champs nécessaires (`imageAlt`, slides hero) ;
- retirer la dépendance conceptuelle aux `imageSeed` pour les contenus gérés ;
- garder les formes consommées par les composants aussi stables que possible pour limiter les régressions.

## Plan d'implémentation

1. Ajouter la migration Prisma et générer le client.
2. Ajouter les nouveaux types et accès catalogue.
3. Ajouter le modèle et les actions admin du hero.
4. Enrichir destinations et articles avec `imageAlt`.
5. Écrire le script de migration Cloudinary.
6. Exécuter la migration sur la base cible.
7. Nettoyer les fallbacks `picsum` sur le front.
8. Vérifier le site public et le dashboard.

## Vérification

### Technique

- `prisma generate`
- `npm run build`
- `npm run lint`

### Fonctionnelle

Contrôler :

- home : hero, destinations, rails, blog
- fiche offre : galerie
- listing destinations
- listing blog et article
- espace client : cartes liées aux offres
- admin destinations
- admin articles
- admin offre
- admin hero

### Données

Valider que :

- les URLs visuelles en base pointent vers Cloudinary ;
- les `public_id` sont renseignés ;
- les anciens fallbacks `picsum` ne ressortent plus pour les contenus gérés.

## Risques connus et garde-fous

### Volume d'images

Certaines offres ont plusieurs visuels. Le script doit travailler par lots simples et logguer clairement la progression.

### Suppression d'anciens médias

On ne supprimera les anciens médias Cloudinary que lors d'un vrai remplacement via l'admin, pas pendant la migration initiale.

### Incohérences front

Le chantier doit être livré en gardant un front cohérent même si certains enregistrements n'ont temporairement pas d'image. Aucun composant ne doit planter si une URL est absente.

## Décision finale

Le projet adopte l'option recommandée :

- Cloudinary comme stockage unique des visuels métier ;
- PostgreSQL comme source éditoriale unique ;
- back-office enrichi pour destinations, articles, offres et hero ;
- suppression des dépendances `picsum` pour les contenus gérés.

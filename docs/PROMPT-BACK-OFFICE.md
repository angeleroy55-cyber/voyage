# Prompt — accès total depuis le back-office

Prompt prêt à coller pour compléter le back-office GoSéjour, afin qu'un
administrateur connecté puisse tout piloter sans jamais toucher au code ni à la
base. Établi à partir d'un audit du dépôt : l'existant est décrit tel quel, seuls
les manques sont demandés.

---

## Contexte

Tu travailles sur GoSéjour, une agence de voyages en ligne : Next.js 16 (App
Router, Turbopack), React 19, Tailwind v4, Prisma 7 sur PostgreSQL. Lis
`AGENTS.md` avant d'écrire quoi que ce soit — cette version de Next.js s'écarte
de ce que tu connais, la doc fait foi et se trouve dans
`node_modules/next/dist/docs/`.

Le back-office existe déjà et fonctionne. Ta mission n'est pas de le refaire,
mais de **combler ses trous** pour qu'un administrateur ait la main sur la
totalité du modèle de données.

### Ce qui existe (ne pas reconstruire)

- Garde d'accès : `requireSession()` dans `src/server/session.ts`, appelée par
  `src/app/admin/(protected)/layout.tsx` et par **chaque** action serveur.
- Rôles `owner` / `editor` sur `AdminUser`, réellement appliqués dans
  `src/server/actions/team.ts` (un `editor` ne peut pas administrer l'équipe, et
  il doit toujours rester au moins un `owner` actif).
- Actions serveur groupées par domaine dans `src/server/actions/` :
  `offers.ts`, `admin.ts`, `team.ts`, `account.ts`, `public.ts`.
- Upload d'images via `src/server/media.ts` (Cloudinary, repli sur
  `public/uploads` si les variables d'environnement sont vides).
- Menu latéral : `src/components/admin/AdminNav.tsx`.
- Constantes partagées (statuts, moyens de paiement, formules de restauration,
  paliers de fidélité) : `src/lib/constants.ts`.
- Pages déjà complètes : offres (+ images), destinations, articles, avis,
  réservations (statut et notes seulement), abonnés (lecture seule), équipe,
  réglages, profil.

### Conventions à respecter scrupuleusement

- **Français partout** : libellés d'interface, messages d'erreur, commentaires.
- Les commentaires expliquent **pourquoi**, jamais **quoi**. Densité et ton du
  code existant — va lire `src/server/actions/admin.ts` et
  `src/app/(site)/compte/(espace)/layout.tsx` avant de commenter.
- Palette : uniquement les tokens `navy-*`, `gold-*`, `teal-*` de
  `src/app/globals.css`. Le texte sur fond bleu est en **blanc pur**, jamais un
  blanc translucide. Toute nouvelle teinte doit tenir le contraste WCAG AA.
- Actions serveur : `"use server"` en tête de fichier, `await requireSession()`
  en première ligne de chaque action, puis `revalidatePath("/", "layout")` et
  `revalidatePath(<page concernée>)` — reprends l'assistant `refresh()` de
  `src/server/actions/admin.ts`.
- Les statuts restent des `String` en base, validés contre `src/lib/constants.ts`.
  N'introduis pas d'enum Prisma.
- Pas de bibliothèque supplémentaire sans nécessité démontrée.

---

## Travail demandé

### 1. Catégories — la lacune la plus bloquante

Le modèle `Category` (`prisma/schema.prisma`) n'a **aucune page ni action**. Les
catégories pilotent les onglets du moteur de recherche et les champs de
formulaire affichés ; aujourd'hui elles ne naissent que du seed.

Crée `/admin/categories` avec un CRUD complet sur : `slug`, `label`, `icon`,
`blurb`, `formFields`, `position`, `active`.

- `slug` généré depuis `label` via `src/lib/slug.ts`, modifiable, unicité
  vérifiée avec un message clair plutôt qu'une erreur Prisma brute.
- `icon` : sélection parmi les noms réellement disponibles dans
  `src/components/ui/Icon.tsx`, avec aperçu visuel. Pas de champ texte libre.
- `formFields` : cases à cocher (`origin`, `destination`, `dates`, `travellers`,
  `driver`), stockées en chaîne séparée par des virgules comme aujourd'hui.
  Explique à l'écran ce que chaque champ déclenche sur le moteur de recherche.
- `position` : réordonnancement par boutons monter/descendre, pas de
  glisser-déposer.
- `active` : bascule. Une catégorie inactive disparaît du site public mais
  conserve ses offres.
- **Suppression** : la relation est en `onDelete: Restrict`. Si la catégorie
  porte des offres, refuse et affiche combien, avec un lien vers la liste
  filtrée. Ne propose jamais une suppression qui échouera.

Ajoute l'entrée au menu, juste après « Offres ».

### 2. Clients (voyageurs)

Le modèle `Customer` n'est visible nulle part. Crée `/admin/clients`.

- Liste : recherche par nom / e-mail / téléphone, tri par date d'inscription,
  points de fidélité ou nombre de réservations, pagination.
- Fiche `/admin/clients/[id]` : coordonnées, palier de fidélité (réutilise
  `loyaltyTier()` de `src/lib/constants.ts`), historique des réservations,
  favoris, date de dernière connexion.
- Actions : modifier les coordonnées, activer/désactiver le compte, réinitialiser
  le mot de passe (réutilise `hashPassword()` de `src/server/auth.ts`), ajuster
  les points de fidélité **avec un motif obligatoire**.
- RGPD : suppression définitive, et anonymisation qui conserve les réservations
  pour la comptabilité tout en effaçant les données personnelles. Les deux
  passent par une confirmation où l'on retape l'e-mail du client.
- Un compte désactivé ne doit plus pouvoir se connecter : vérifie que
  `loginCustomer()` dans `src/server/actions/account.ts` teste bien `active`, et
  corrige si ce n'est pas le cas.

Ajoute l'entrée au menu, après « Réservations ».

### 3. Réservations — passer du suivi à la gestion

Aujourd'hui `src/server/actions/admin.ts` ne permet que `setBookingStatus` et
`saveBookingNotes`. Complète :

- **Créer une réservation à la main**, pour les demandes prises au téléphone :
  choix de l'offre, coordonnées, rattachement facultatif à un `Customer`
  existant, voyageurs, dates, assurance, montant, moyen de paiement,
  échéancier. La référence suit le format `GS-XXXXXX` déjà produit par
  `createBooking()` dans `src/server/actions/public.ts` — factorise plutôt que
  de dupliquer.
- **Modifier** une réservation existante : mêmes champs.
- **Enregistrer un règlement** : incrémenter `paidAmount`, afficher le reste dû
  et l'échéancier quand `instalments` vaut 4. Interdis un `paidAmount` supérieur
  à `totalPrice`.
- **Supprimer**, derrière confirmation.
- **Export CSV** de la sélection courante, filtres appliqués.
- Filtres : statut, période, offre, moyen de paiement, et « soldées / non
  soldées ».

### 4. Abonnés — sortir de la lecture seule

`/admin/abonnes` n'affiche que des chiffres. Ajoute la suppression (obligation
RGPD), l'export CSV filtré par centre d'intérêt, et l'ajout manuel d'une adresse.

### 5. Compteurs dénormalisés — corriger un défaut existant

Plusieurs champs sont stockés au lieu d'être calculés, et **ne sont jamais mis à
jour** :

- `Offer.rating` et `Offer.reviewsCount` ne bougent pas quand un avis est publié,
  rejeté ou supprimé dans `/admin/avis`.
- `Destination.offersCount` et `Destination.fromPrice` ne bougent pas quand une
  offre est publiée, archivée, supprimée, ou change de prix.

Écris une fonction de recalcul par entité, appelle-la depuis toutes les actions
concernées, et expose dans `/admin/parametres` un bouton « Recalculer les
compteurs » qui repasse sur l'ensemble du catalogue. Commente pourquoi ces
champs sont dénormalisés plutôt que calculés à la volée.

### 6. Confort transversal sur toutes les listes admin

- Recherche et pagination partout où la liste peut dépasser une cinquantaine de
  lignes.
- Toute action destructive passe par une confirmation explicite qui nomme l'objet
  visé. Réutilise `src/components/ui/Modal.tsx`.
- Chaque action réussie ou échouée renvoie un message affiché à l'écran ; aucune
  action ne doit rester silencieuse.
- États vides rédigés (« Aucun client pour l'instant »), jamais un tableau nu.
- Le tableau de bord `/admin` gagne un raccourci vers les deux nouvelles
  sections, avec leur volumétrie.

---

## Contraintes

- Aucune régression sur le site public : les pages existantes doivent continuer à
  rendre à l'identique.
- Toute nouvelle action serveur commence par `await requireSession()`. Les
  actions destructives sur les clients et les catégories sont réservées au rôle
  `owner`, sur le modèle de `src/server/actions/team.ts`.
- Si une migration Prisma s'avère nécessaire, explique d'abord pourquoi et
  attends validation. L'objectif est de couvrir le schéma existant, pas de
  l'étendre.
- Ne touche pas à `src/generated/prisma`.

## Critères d'acceptation

1. `npx tsc --noEmit` et `npx eslint src` passent sans erreur.
2. Chaque modèle de `prisma/schema.prisma` est administrable depuis l'interface,
   à la seule exception de `Favourite` (créé par le voyageur) et `Setting`
   (déjà couvert par `/admin/parametres`).
3. Un `owner` fraîchement connecté peut, sans ouvrir un terminal ni la base :
   créer un type de voyage et le voir apparaître dans le moteur de recherche ;
   créer une offre rattachée à ce type ; enregistrer une réservation
   téléphonique et son règlement ; consulter la fiche du client et ses points ;
   modérer un avis et voir la note de l'offre se mettre à jour.
4. Un `editor` accède au contenu mais se voit refuser les suppressions de
   clients et de catégories, ainsi que l'administration de l'équipe.
5. Aucune action destructive n'est possible sans confirmation nommant l'objet.

## Méthode

Procède section par section, dans l'ordre : catégories, clients, réservations,
abonnés, compteurs, confort. Après chaque section, lance `tsc` et `eslint`, et
dis-moi ce qui est fait avant d'enchaîner. Si un point de l'énoncé se révèle
faux au contact du code, signale-le au lieu de l'appliquer aveuglément.

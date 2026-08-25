# Back-office GoSéjour

Ce que l'équipe peut piloter depuis `/admin`, et les quelques règles qui ne se
devinent pas à la lecture de l'interface.

## Accès

- Connexion : `/admin/connexion`. Le compte initial vient du seed
  (`ADMIN_EMAIL` / `ADMIN_PASSWORD` dans `.env`).
- La session est un cookie signé HMAC, valable 12 h, sans table de sessions
  (`src/server/auth.ts`). Elle porte l'identité, jamais de secret.
- Deux rôles : `owner` et `editor`. `editor` gère tout le contenu ; `owner` seul
  administre l'équipe et efface des données personnelles.
- Il doit rester en permanence au moins un `owner` actif : les actions qui
  fermeraient cette porte sont refusées.

En développement, `node scripts/dev-session.mjs` imprime un cookie de session
valide pour vérifier le rendu des pages protégées sans passer par le formulaire.
La commande refuse de s'exécuter avec `NODE_ENV=production`.

## Couverture

Chaque modèle de `prisma/schema.prisma` est administrable, à deux exceptions
près qui sont volontaires.

| Modèle | Page | Ce qu'on peut faire |
| --- | --- | --- |
| `Offer` | `/admin/offres` | créer, modifier, supprimer, changer le statut, rechercher, paginer |
| `OfferImage` | `/admin/offres/[id]` | ajouter, supprimer (le fichier part aussi de Cloudinary) |
| `Category` | `/admin/categories` | CRUD, réordonner, masquer, choisir les champs du moteur |
| `Destination` | `/admin/destinations` | créer, modifier, supprimer |
| `Booking` | `/admin/reservations` | créer à la main, modifier, encaisser, annoter, supprimer, exporter |
| `Customer` | `/admin/clients` | consulter, modifier, désactiver, réinitialiser, ajuster les points, anonymiser, supprimer |
| `Review` | `/admin/avis` | modérer, supprimer |
| `Post` | `/admin/articles` | créer, modifier, supprimer |
| `Subscriber` | `/admin/abonnes` | ajouter, retirer, filtrer par thème, exporter |
| `AdminUser` | `/admin/equipe`, `/admin/profil` | CRUD, rôles, réinitialisation |
| `Setting` | `/admin/parametres` | modifier, recalculer les compteurs |
| `Favourite` | aucune | créé et supprimé par le voyageur seul ; visible en lecture sur la fiche client |

## Points qui ne se devinent pas

### Les types de voyage pilotent le moteur de recherche

Une catégorie n'est pas qu'un onglet. Son champ `formFields` décide des champs
affichés par `SearchWidget` : cocher « Âge du conducteur » fait apparaître ce
champ, le décocher le retire. Une catégorie sans aucun champ coché retombe sur
`destination,dates,travellers`, faute de quoi l'onglet serait inutilisable.

Masquer une catégorie (`active = false`) la retire du site sans toucher à ses
offres. La supprimer est refusé tant qu'elle en porte : la relation est en
`onDelete: Restrict`, et l'interface affiche combien d'offres sont à déplacer.

### Les compteurs sont stockés, pas calculés

`Offer.rating`, `Offer.reviewsCount`, `Destination.offersCount` et
`Destination.fromPrice` sont dénormalisés : ils apparaissent sur des listes de
plusieurs dizaines de cartes, où une agrégation par ligne coûterait cher à chaque
affichage.

`src/server/counters.ts` les remet à jour, et toutes les actions concernées
l'appellent : modération et suppression d'un avis, création, modification,
changement de statut et suppression d'une offre. Un changement de destination
recalcule les deux destinations, celle qu'on quitte et celle qu'on rejoint.

**Attention à la reprise globale.** Le bouton « Recalculer les compteurs » de
`/admin/parametres` réécrit tout le catalogue à partir des données réelles. Or le
jeu de démonstration contient des valeurs *éditoriales* : des notes et des
volumes d'avis saisis par le seed, sans avis ni offre derrière. Sur ce jeu, la
reprise ramènerait 46 notes et 8 destinations à zéro. La page annonce donc
combien de lignes divergent avant de lancer quoi que ce soit, et la confirmation
le redit. Ne l'utilisez que sur des données réelles ou après un import.

Seule exception au recalcul : `Destination.fromPrice` est conservé quand la
destination n'a aucune offre publiée, pour qu'un « dès X € » annoncé avant
l'ouverture des ventes ne tombe pas à 0 €.

### Réservations : le montant est libre

Le parcours public recalcule le total côté serveur : un prix envoyé par le
navigateur serait modifiable. Le back-office fait l'inverse : un conseiller saisit
ce qu'il a négocié au téléphone, donc le total est ce qu'il indique. Les
garde-fous portent ailleurs :

- le réglé ne dépasse jamais le dû, et ne descend pas sous zéro ;
- baisser le total sous le montant déjà encaissé ramène le réglé au nouveau
  total au lieu de refuser la saisie ;
- le moyen de paiement doit appartenir à `PAYMENT_CHOICES`.

Une réservation créée à la main se rattache automatiquement à un espace client
quand l'adresse e-mail correspond à un compte existant.

Le filtre « soldées / non soldées » compare deux colonnes d'une même ligne, ce
que le `where` de Prisma ne sait pas exprimer : la sélection passe par une
requête SQL constante, sans aucune saisie interpolée.

### Clients : anonymiser ou supprimer

Deux gestes distincts, tous deux réservés à un `owner` et protégés par une
confirmation où l'on retape l'adresse e-mail du client :

- **Anonymiser** vide l'identité du compte et de ses réservations, supprime ses
  favoris et désactive l'accès, mais conserve les montants. C'est la réponse à
  une demande d'effacement quand des pièces comptables doivent survivre.
- **Supprimer** efface le compte et ses réservations. Rien ne subsiste.

Un compte désactivé ne peut plus se connecter : `loginCustomer()` teste `active`
avant d'ouvrir une session.

### Limite connue : l'ajustement des points n'est pas journalisé

Modifier les points de fidélité exige un motif, mais celui-ci **n'est pas
archivé** : le schéma n'a pas de table de journal, et en ajouter une demande une
migration Prisma. Le motif est seulement renvoyé dans le message de confirmation.
Si une traçabilité durable devient nécessaire, il faudra un modèle `AdminLog`
(auteur, action, cible, motif, date) et une migration.

## Conventions pour la suite

- Toute action serveur commence par `await requireSession()`, puis
  `revalidatePath("/", "layout")` et le chemin concerné, voir l'assistant
  `refresh()` de `src/server/actions/admin.ts`.
- Un gestionnaire de route (`route.ts`, comme les exports CSV) **ne traverse pas
  le layout** : il porte sa propre garde de session.
- Les actions destructives passent par `ConfirmButton`, qui nomme l'objet visé.
  `confirmWord` impose de retaper un mot pour ce qui est irréversible.
- Les listes utilisent `AdminSearch` et `Pagination` ; les retours d'action
  passent par `AdminNotice`.
- Les exports CSV passent par `src/lib/csv.ts` : point-virgule et BOM UTF-8,
  seule combinaison qu'Excel en français lit sans casser colonnes ni accents.

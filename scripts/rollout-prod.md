# Mise en production du catalogue de marché

À faire dans cet ordre, avec `DATABASE_URL` pointant sur la base de production
(`.env`). Ne jamais lancer ces commandes avec `.env.local` actif : il vise la base locale.

1. **Sauvegarde** : exporter les tables `Offer`, `OfferImage`, `Destination`, `Counter`,
   `Booking`, `Setting` (`node scripts/backup-prod.mjs`). Le fichier est écrit hors dépôt.
2. **Schéma** : `npx prisma db push` ajoute `Offer.details` (JSON) et `Offer.priceFloor`
   (entier), deux colonnes nullables, sans perte. N'utiliser en aucun cas
   `--accept-data-loss`.
3. **Code** : `npx prisma generate` (le client lit les colonnes `details` et `priceFloor`), puis
   déployer la version qui les lit (`src/server/catalogue.ts`, `departures.ts`,
   `actions/public.ts`, fiche admin d'une offre). Sans ce déploiement, la fiche n'affiche pas
   les détails et le badge « 0,0 · 0 avis » apparaît sur les offres relevées : le seed ne se
   lance qu'une fois la nouvelle version en ligne.
4. **Dossiers de démonstration** : renommer `GS-CRETE01`, `GS-MARRA02`, `GS-LISBO03`,
   `GS-FJORD04` en `GO-…` (clients `example.fr`). Sans cela, le seed créerait quatre
   doublons.
5. **Seed** : `npm run db:seed`. Idempotent. Les 33 offres visées par une demande client
   gardent leur identité ; les images téléversées par l'équipe ne sont pas touchées.
6. **Contrôles** : `npx tsx scripts/probe-market.mts`, puis ouvrir une fiche par catégorie.

Retour arrière : restaurer la sauvegarde de l'étape 1 (les colonnes ajoutées peuvent
rester, elles sont nullables).

/**
 * Clé d'illustration d'une offre.
 *
 * Le mot ajouté à la ville oriente la recherche vers le bon type de vue : une
 * plage pour un séjour balnéaire, un monument pour un circuit, un port pour une
 * croisière. Sans lui, « Athènes » rend surtout des vues de rue.
 *
 * C'est la seule source de vérité de cette clé. Le script qui récupère les
 * images et le seed qui les pose l'appellent tous les deux, donc ils ne peuvent
 * pas diverger.
 *
 * Ce fichier ne lit pas `photos.json`, pour que le script de récupération
 * puisse l'importer alors même que le fichier de photos n'existe pas encore.
 */

type OffreIllustrable = {
  destination: string;
  country: string;
  subtype?: string;
};

/**
 * Type de vue attendu, selon le sous-type de l'offre.
 *
 * Rend une chaîne vide quand rien de particulier n'est attendu : la clé retombe
 * alors sur le pays, qui suffit à cadrer la recherche.
 */
export function photoHintFor(subtype: string | undefined): string {
  switch (subtype) {
    case "tout_compris":
    case "vol_hotel":
    case "camping":
      return "beach";
    case "hotel_seul":
    case "week_end":
      return "city view";
    case "circuit_accompagne":
    case "circuit_libre":
      return "landmark";
    // « cruise ship » attire surtout des marines anciennes et des maquettes :
    // le port de départ donne des vues bien plus utiles.
    case "croisiere_maritime":
      return "port";
    case "croisiere_fluviale":
      return "river";
    case "vol_seul":
      return "skyline";
    case "location":
      return "road landscape";
    default:
      return "";
  }
}

export function photoQueryFor(offer: OffreIllustrable): string {
  const hint = photoHintFor(offer.subtype);
  return `${offer.destination} ${hint || offer.country}`;
}

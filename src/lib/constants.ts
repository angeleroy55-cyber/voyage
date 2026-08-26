/** Formules de restauration proposées dans le back-office et sur le site. */
export const BOARDS = [
  "Tout compris",
  "Pension complète",
  "Demi-pension",
  "Petit-déjeuner",
  "Sans repas",
  "Vol seul",
] as const;

/**
 * Champs que le moteur de recherche sait afficher. Une catégorie en active un
 * sous-ensemble via `Category.formFields`, lu par `SearchWidget`. Ajouter un
 * identifiant ici ne suffit pas : il faut aussi le rendre dans le composant.
 */
export const FORM_FIELDS = [
  { id: "origin", label: "Ville de départ", hint: "Utile dès qu'un vol est inclus" },
  { id: "destination", label: "Destination", hint: "Champ de recherche principal" },
  { id: "dates", label: "Dates", hint: "Aller et retour" },
  { id: "travellers", label: "Voyageurs", hint: "Adultes, enfants et chambres" },
  { id: "driver", label: "Âge du conducteur", hint: "Location de voiture uniquement" },
] as const;

export type FormFieldId = (typeof FORM_FIELDS)[number]["id"];

/**
 * Pictogrammes proposés pour une catégorie. La liste est volontairement fermée :
 * `Icon` ne rend rien pour un nom inconnu, et un champ libre laisserait un
 * onglet muet en production.
 */
export const CATEGORY_ICONS = [
  "package",
  "bed",
  "ship",
  "route",
  "plane",
  "tent",
  "car",
  "pin",
  "compass",
  "sparkles",
  "gift",
  "tag",
] as const;

/**
 * Rôle d'une catégorie dans la navigation. `catalogue` est le seul type qui
 * possède des offres : les autres composent leur listing à la lecture, renvoient
 * vers une page dédiée, ou n'affichent que du contenu.
 */
export const CATEGORY_KINDS = [
  { id: "catalogue", label: "Catalogue", hint: "Les offres lui sont rattachées une à une" },
  { id: "dynamique", label: "Listing calculé", hint: "Sélection automatique, selon la règle choisie" },
  { id: "hub", label: "Hub", hint: "Renvoie vers le hub des destinations" },
  { id: "editorial", label: "Page éditoriale", hint: "Contenu seul, sans offre" },
] as const;

export type CategoryKindId = (typeof CATEGORY_KINDS)[number]["id"];

/**
 * Règles de sélection des catégories `dynamique`.
 *
 * Elles traversent le catalogue : une même offre nourrit Bons Plans, Dernière
 * Minute et sa catégorie propriétaire, sans jamais être dupliquée ni obtenir
 * une seconde URL. Sa seule adresse reste celle de sa catégorie de rattachement.
 */
export const OFFER_RULES = [
  { id: "promos", label: "Bons plans", hint: "Toute offre affichée sous son prix de référence" },
  { id: "derniere-minute", label: "Dernière minute", hint: "Départ dans moins de 21 jours" },
  { id: "tout-compris", label: "Tout compris et clubs", hint: "Pension « Tout compris »" },
  { id: "france", label: "Séjours France", hint: "Destinations situées en France" },
] as const;

export type OfferRuleId = (typeof OFFER_RULES)[number]["id"];

/**
 * Seuil du badge « Dernière minute », en jours avant le départ. Le badge est
 * calculé à la lecture, jamais saisi : une offre ne peut donc pas rester
 * marquée urgente après la date.
 */
export const LAST_MINUTE_DAYS = 21;

/**
 * Sous-types d'offre. Ils affinent une catégorie sans créer d'URL : « Vol +
 * Hôtel » et « Tout compris » sont des filtres à l'intérieur de Séjours, pas
 * des catégories concurrentes.
 */
export const OFFER_SUBTYPES = [
  { id: "vol_hotel", label: "Vol + Hôtel", blurb: "Le vol et l'hébergement réservés ensemble" },
  { id: "tout_compris", label: "Tout compris", blurb: "Repas, boissons et animations inclus" },
  { id: "club", label: "Clubs", blurb: "Animations et clubs enfants toute la journée" },
  { id: "hotel_seul", label: "Hôtel seul", blurb: "La chambre, sans transport" },
  { id: "vol_seul", label: "Vol sec", blurb: "Le billet d'avion seul, aller-retour" },
  {
    id: "circuit_accompagne",
    label: "Circuits accompagnés",
    blurb: "En petit groupe, avec guide francophone",
  },
  { id: "circuit_libre", label: "Autotours", blurb: "Voiture et étapes réservées, à votre rythme" },
  {
    id: "combine",
    label: "Voyages combinés",
    blurb: "Deux destinations ou deux formules en un seul voyage",
  },
  { id: "croisiere_maritime", label: "Croisières maritimes", blurb: "En mer, escales quotidiennes" },
  {
    id: "croisiere_fluviale",
    label: "Croisières fluviales",
    blurb: "Sur les fleuves, amarrage en centre-ville",
  },
  { id: "camping", label: "Campings", blurb: "Mobil-homes et villages vacances" },
  { id: "week_end", label: "Week-ends et courts séjours", blurb: "Deux ou trois nuits" },
  { id: "location", label: "Location de voiture", blurb: "Au départ de l'aéroport ou en ville" },
  { id: "parc", label: "Parcs de loisirs", blurb: "Billets et nuit d'hôtel réservés ensemble" },
] as const;

export function subtypeLabel(id: string): string {
  return OFFER_SUBTYPES.find((s) => s.id === id)?.label ?? "";
}

export function subtypeBlurb(id: string): string {
  return OFFER_SUBTYPES.find((s) => s.id === id)?.blurb ?? "";
}

/**
 * Ordre d'affichage des sous-catégories dans le menu. Il ne suit pas l'ordre
 * de déclaration : dans Séjours, « Tout compris » se cherche plus souvent que
 * « Vol + Hôtel », et passe donc devant.
 */
export const SUBTYPE_ORDER: string[] = [
  "tout_compris",
  "club",
  "vol_hotel",
  "circuit_accompagne",
  "circuit_libre",
  "combine",
  "croisiere_maritime",
  "croisiere_fluviale",
  "hotel_seul",
  "vol_seul",
  "camping",
  "week_end",
  "location",
  "parc",
];

/**
 * Couleurs du badge « type d'offre », en coin d'image sur la carte.
 *
 * Les classes sont écrites en toutes lettres : Tailwind lit le code source pour
 * décider des règles à générer, une classe assemblée à la volée ne serait donc
 * pas produite.
 */
export const CATEGORY_ACCENTS = [
  { id: "navy", label: "Bleu nuit", badge: "bg-navy-800 text-white" },
  { id: "gold", label: "Or", badge: "bg-gold-400 text-navy-900" },
  { id: "teal", label: "Vert d'eau", badge: "bg-teal-600 text-white" },
  { id: "rose", label: "Rose", badge: "bg-rose-600 text-white" },
  { id: "violet", label: "Violet", badge: "bg-violet-600 text-white" },
  { id: "emerald", label: "Vert", badge: "bg-emerald-600 text-white" },
] as const;

export function accentBadge(id: string | undefined): string {
  return CATEGORY_ACCENTS.find((a) => a.id === id)?.badge ?? CATEGORY_ACCENTS[0].badge;
}

export const OFFER_STATUSES = ["draft", "published", "archived"] as const;
export const REVIEW_STATUSES = ["pending", "published", "rejected"] as const;
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "En ligne",
  archived: "Archivée",
  pending: "En attente",
  rejected: "Refusé",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Voyage terminé",
};

/**
 * Étapes du suivi présenté au client, dans l'ordre. `cancelled` n'y figure pas :
 * une annulation sort du parcours au lieu de l'avancer, et l'espace client
 * l'affiche comme un état terminal distinct.
 */
export const BOOKING_TIMELINE = [
  {
    status: "pending",
    label: "Demande reçue",
    text: "Nous vérifions les disponibilités auprès du prestataire.",
  },
  {
    status: "confirmed",
    label: "Séjour confirmé",
    text: "Vos places sont bloquées, les documents de voyage sont en préparation.",
  },
  {
    status: "completed",
    label: "Voyage terminé",
    text: "Nous espérons qu'il vous a plu : votre avis aide les prochains voyageurs.",
  },
] as const;

/**
 * Moyens de paiement acceptés par le site. La liste sert au bandeau du pied de
 * page, au choix proposé pendant la réservation et à la validation côté
 * serveur : un identifiant absent d'ici est refusé.
 */
export const PAYMENT_METHODS = [
  { id: "visa", label: "Visa", hint: "Débit à la confirmation du séjour" },
  { id: "mastercard", label: "Mastercard", hint: "Débit à la confirmation du séjour" },
  { id: "cb", label: "Cartes Bancaires", hint: "Débit à la confirmation du séjour" },
  { id: "paypal", label: "PayPal", hint: "Vous validez depuis votre compte PayPal" },
  { id: "sepa", label: "Virement SEPA", hint: "Coordonnées bancaires envoyées par e-mail" },
  { id: "instalments", label: "Paiement en 4× sans frais", hint: "Une échéance par mois" },
] as const;

export type PaymentId = (typeof PAYMENT_METHODS)[number]["id"];

/**
 * Moyens sélectionnables à l'étape « paiement ». Le 4× n'y figure pas : c'est
 * un échéancier, choisi séparément, et il s'applique au moyen retenu ici.
 */
export const PAYMENT_CHOICES = PAYMENT_METHODS.filter((m) => m.id !== "instalments");

export function paymentLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? "Non précisé";
}

/** Seuils du programme de fidélité, du plus élevé au plus bas. */
export const LOYALTY_TIERS = [
  { id: "platine", label: "Platine", from: 4000, perk: "Surclassement selon disponibilité" },
  { id: "or", label: "Or", from: 2000, perk: "Ligne conseillers prioritaire" },
  { id: "argent", label: "Argent", from: 800, perk: "Annulation flexible offerte" },
  { id: "decouverte", label: "Découverte", from: 0, perk: "Alertes prix personnalisées" },
] as const;

export function loyaltyTier(points: number) {
  return LOYALTY_TIERS.find((tier) => points >= tier.from) ?? LOYALTY_TIERS[LOYALTY_TIERS.length - 1];
}

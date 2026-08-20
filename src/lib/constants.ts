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

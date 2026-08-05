/** Formules de restauration proposées dans le back-office et sur le site. */
export const BOARDS = [
  "Tout compris",
  "Pension complète",
  "Demi-pension",
  "Petit-déjeuner",
  "Sans repas",
  "Vol seul",
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
    text: "Nous espérons qu'il vous a plu — votre avis aide les prochains voyageurs.",
  },
] as const;

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

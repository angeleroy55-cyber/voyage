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
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled"] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "En ligne",
  archived: "Archivée",
  pending: "En attente",
  rejected: "Refusé",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

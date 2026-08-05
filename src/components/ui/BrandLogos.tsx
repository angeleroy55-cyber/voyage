/**
 * Pastilles de réassurance du pied de page : réseaux sociaux et moyens de
 * paiement.
 *
 * Les glyphes ci-dessous sont dessinés pour GoSéjour. Ce ne sont pas les logos
 * officiels : ceux-ci sont des marques déposées, dont la reproduction suppose
 * l'accord de chaque détenteur et le respect de sa charte. Une fois ces
 * autorisations obtenues, il suffit de remplacer les tracés de ce fichier par
 * les fichiers fournis par les marques — l'API et le pied de page ne bougent
 * pas.
 */

type SocialId = "facebook" | "instagram" | "pinterest" | "youtube" | "tiktok" | "x";

export const SOCIAL_NETWORKS: {
  id: SocialId;
  label: string;
  href: string;
  /** Teinte d'accent au survol, appliquée au glyphe via `currentColor`. */
  color: string;
}[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/", color: "#1877F2" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/", color: "#C13584" },
  { id: "pinterest", label: "Pinterest", href: "https://www.pinterest.fr/", color: "#BD081C" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/", color: "#FF0000" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/", color: "#0B0B0B" },
  { id: "x", label: "X", href: "https://x.com/", color: "#0B0B0B" },
];

/** Glyphe neutre évoquant le réseau, dans la couleur courante. */
export function SocialLogo({
  id,
  className = "size-4.5",
}: {
  id: SocialId;
  className?: string;
}) {
  const props = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (id) {
    case "facebook":
      return (
        <svg {...props}>
          <path d="M13.5 21v-9h2.6" />
          <path d="M10.4 12.6h5.4" />
          <path d="M13.5 12V8.8A2.8 2.8 0 0 1 16.3 6h1.2" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...props}>
          <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" />
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.6" />
          <path d="M13.4 8.6a2.9 2.9 0 0 0-3.3 4.2" />
          <path d="M13.4 8.6a3 3 0 0 1 1.2 5.5c-1 .6-2.3.3-2.9-.6" />
          <path d="m11.6 13.2-1.3 5.6" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <rect x="2.6" y="5.6" width="18.8" height="12.8" rx="3.8" />
          <path d="m10.6 9.6 4.4 2.4-4.4 2.4Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...props}>
          <path d="M14.6 3.4v10.9a3.9 3.9 0 1 1-3.9-3.9" />
          <path d="M14.6 5.4a4.6 4.6 0 0 0 4.4 3.3" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="m5 5 14 14M19 5 5 19" />
        </svg>
      );
  }
}

export const PAYMENT_METHODS = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "cb", label: "Cartes Bancaires" },
  { id: "paypal", label: "PayPal" },
  { id: "sepa", label: "Virement SEPA" },
  { id: "instalments", label: "Paiement en 4× sans frais" },
] as const;

export type PaymentId = (typeof PAYMENT_METHODS)[number]["id"];

/**
 * Moyen de paiement accepté, présenté sur une carte au format 52×32 — les
 * proportions habituelles des bandeaux d'acceptation. Le nom est écrit en
 * toutes lettres plutôt que dessiné : aucun logotype n'est reproduit.
 */
export function PaymentLogo({ id, className = "" }: { id: PaymentId; className?: string }) {
  const method = PAYMENT_METHODS.find((m) => m.id === id);
  const label = method?.label ?? id;

  return (
    <span
      title={label}
      className={`inline-flex h-8 min-w-[52px] items-center justify-center rounded-md border border-navy-200 bg-white px-2 shadow-[0_1px_1px_rgba(12,26,55,0.06)] ${className}`}
    >
      <span className="sr-only">{label}</span>
      {id === "instalments" ? (
        <span className="flex items-baseline gap-0.5 leading-none">
          <span className="text-[13px] font-extrabold text-navy-800">4</span>
          <span className="text-[10px] font-bold text-gold-600">×</span>
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="text-[10px] font-extrabold uppercase tracking-tight text-navy-700"
        >
          {SHORT[id]}
        </span>
      )}
    </span>
  );
}

const SHORT: Record<PaymentId, string> = {
  visa: "Visa",
  mastercard: "MC",
  cb: "CB",
  paypal: "PayPal",
  sepa: "SEPA",
  instalments: "4×",
};

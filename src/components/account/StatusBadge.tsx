import Icon from "@/components/ui/Icon";
import { STATUS_LABELS } from "@/lib/constants";

/** Couleur et pictogramme associés à chaque étape d'une réservation. */
const STYLES: Record<string, { className: string; icon: string }> = {
  pending: { className: "bg-gold-100 text-gold-800", icon: "clock" },
  confirmed: { className: "bg-teal-50 text-teal-700", icon: "check" },
  completed: { className: "bg-navy-100 text-navy-700", icon: "compass" },
  cancelled: { className: "bg-red-50 text-red-700", icon: "close" },
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const style = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${style.className} ${className}`}
    >
      <Icon name={style.icon} className="size-3.5" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

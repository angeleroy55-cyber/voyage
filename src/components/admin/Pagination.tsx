import Link from "next/link";

/**
 * Pagination des listes du back-office. Elle ne s'affiche pas tant qu'une seule
 * page suffit : une barre « 1 / 1 » n'apprend rien et ajoute du bruit.
 */
export default function Pagination({
  base,
  params = {},
  page,
  total,
  perPage,
}: {
  base: string;
  /** Filtres courants, reconduits sur chaque lien. */
  params?: Record<string, string | number | undefined>;
  page: number;
  total: number;
  perPage: number;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    query.set("page", String(target));
    return `${base}?${query.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-xl border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
        >
          Page précédente
        </Link>
      ) : (
        <span />
      )}

      <span className="text-xs text-navy-500">
        Page {page} sur {pages}
      </span>

      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="rounded-xl border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
        >
          Page suivante
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

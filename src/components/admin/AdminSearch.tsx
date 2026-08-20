import Icon from "@/components/ui/Icon";

/**
 * Champ de recherche des listes du back-office.
 *
 * C'est un formulaire en `GET` et non un filtre au clavier : la recherche se
 * retrouve alors dans l'URL, donc partageable, rechargeable, et compatible avec
 * le rendu serveur des listes paginées.
 */
export default function AdminSearch({
  action,
  defaultValue = "",
  placeholder,
  hidden = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  /** Filtres à préserver en changeant de recherche (tri, statut…). */
  hidden?: Record<string, string | undefined>;
}) {
  return (
    // Le champ occupe toute la largeur disponible sur mobile et se fige à 16 rem
    // à partir du petit écran : à 320 px, un champ large fixe poussait le bouton
    // hors du cadre.
    <form action={action} className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      {Object.entries(hidden).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400"
        />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-xl border border-navy-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-navy-400 sm:w-64"
        />
      </div>
      <button className="shrink-0 rounded-xl border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
        Rechercher
      </button>
    </form>
  );
}

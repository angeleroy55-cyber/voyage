import Link from "next/link";
import Icon from "@/components/ui/Icon";

const SELECTIONS = [
  {
    label: "Départs de dernière minute",
    hint: "Sous 30 jours",
    icon: "bolt",
    href: "/recherche/vol-hotel?tri=prix",
    tone: "bg-gold-50 text-gold-700 border-gold-200",
  },
  {
    label: "Les meilleures remises",
    hint: "Jusqu'à −35 %",
    icon: "tag",
    href: "/recherche/vol-hotel?tri=remise",
    tone: "bg-teal-50 text-teal-600 border-teal-100",
  },
  {
    label: "Soleil d'arrière-saison",
    hint: "Septembre & octobre",
    icon: "compass",
    href: "/recherche/hotels?tri=note",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    label: "Week-ends prolongés",
    hint: "2 à 3 nuits",
    icon: "sparkles",
    href: "/recherche/escapades",
    tone: "bg-navy-50 text-navy-700 border-navy-100",
  },
];

export default function Selections() {
  return (
    <section className="mx-auto max-w-page px-4">
      <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
        Par où commencer&nbsp;?
      </h2>
      <p className="mt-1 text-sm text-navy-600">
        Quatre sélections mises à jour chaque semaine par nos équipes.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SELECTIONS.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${s.tone}`}>
              <Icon name={s.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-snug text-navy-900">{s.label}</span>
              <span className="block text-xs text-navy-500">{s.hint}</span>
            </span>
            <Icon
              name="chevronRight"
              className="size-4 shrink-0 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

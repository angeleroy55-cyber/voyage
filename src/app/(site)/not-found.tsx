import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getSearchCategories } from "@/server/catalogue";

export default async function NotFound() {
  // Les raccourcis proposés viennent de la base, comme partout ailleurs : une
  // catégorie désactivée ne doit pas réapparaître par la page d'erreur, dont la
  // charge utile est embarquée dans le flux de chaque route.
  const categories = await getSearchCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-navy-200">404</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900">
        Cette page a changé de destination
      </h1>
      <p className="mt-2 text-sm text-navy-600">
        Le lien est peut-être expiré ou l&apos;offre n&apos;est plus disponible. Reprenez depuis
        l&apos;accueil ou choisissez un type de voyage.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
      >
        Retour à l&apos;accueil
        <Icon name="chevronRight" className="size-4" />
      </Link>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/recherche/${category.id}`}
            className="flex items-center gap-2 rounded-xl border border-navy-200 px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
          >
            <Icon name={category.icon} className="size-4" />
            {category.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

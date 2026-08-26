import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import {
  getDestinationTree,
  getRuleOffers,
  getSearchCategories,
} from "@/server/catalogue";
import { price } from "@/lib/format";
import { withMediaFallback } from "@/lib/media";
import { SEO_CITIES } from "@/lib/data";

/**
 * Hub Destinations : continent, puis pays et îles.
 *
 * C'est la porte d'entrée n°1 du référencement selon le cahier, d'où
 * l'arborescence explicite plutôt qu'une grille indifférenciée : chaque niveau
 * est un lien, chaque destination annonce le nombre d'offres qu'elle contient
 * réellement et son prix d'appel, recalculés au seed depuis le catalogue.
 *
 * La France n'a pas de catégorie de menu, pour ne pas cannibaliser Séjours.
 * Elle est donc mise en avant ici, en tête de page, où elle a sa place sans
 * créer de seconde URL pour le même contenu.
 */

export const metadata = {
  title: "Toutes les destinations",
  description:
    "Nos destinations par continent : Europe, Afrique du Nord, Caraïbes, océan Indien, Asie. Prix d'appel et nombre d'offres pour chaque pays.",
};
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const [arbre, france, categories] = await Promise.all([
    getDestinationTree(),
    getRuleOffers("france", 1),
    getSearchCategories(),
  ]);

  const total = arbre.reduce((n, continent) => n + continent.destinations.length, 0);
  const prixFrance = france[0]?.price;

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Destinations</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        Où voulez-vous partir&nbsp;?
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-navy-600">
        {total} destinations réparties sur {arbre.length} continents. Chaque page
        rassemble toutes les offres disponibles sur place, séjours, circuits,
        croisières et vols confondus.
      </p>

      {/* Sommaire : sur une page longue, il évite de faire défiler à l'aveugle. */}
      <nav aria-label="Continents" className="mt-5 flex flex-wrap gap-2">
        {arbre.map((continent) => (
          <a
            key={continent.id}
            href={`#${continent.id}`}
            className="rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
          >
            {continent.label}
            <span className="ml-1.5 text-navy-400">{continent.destinations.length}</span>
          </a>
        ))}
      </nav>

      {/* Mise en avant de la France : première clientèle, aucune entrée de menu. */}
      <section className="mt-7 overflow-hidden rounded-2xl border border-navy-100 bg-navy-50/60">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-gold-700">
              Sans avion ni formalités
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-navy-900">Séjours en France</h2>
            <p className="mt-1.5 text-sm text-navy-600">
              Littoral atlantique, Méditerranée, montagne et villes d&apos;art. Des
              campings familiaux aux week-ends thalasso, avec départ en train ou en
              voiture.
            </p>
          </div>
          <Link
            href="/sejours-france"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
          >
            {prixFrance ? `Voir la France dès ${price(prixFrance)}` : "Voir les séjours France"}
            <Icon name="chevronRight" className="size-4" />
          </Link>
        </div>
      </section>

      {arbre.map((continent) => (
        <section key={continent.id} id={continent.id} className="mt-10 scroll-mt-24">
          <div className="flex items-baseline justify-between gap-4 border-b border-navy-100 pb-2.5">
            <h2 className="text-lg font-extrabold text-navy-900">{continent.label}</h2>
            <span className="text-xs text-navy-500">
              {continent.destinations.length} destination
              {continent.destinations.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {continent.destinations.map((destination) => (
              <Link
                key={destination.slug}
                href={`/sejours?q=${encodeURIComponent(destination.name)}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  <Image
                    src={withMediaFallback(destination.image)}
                    alt={destination.imageAlt || destination.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-900/85 via-navy-900/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <p className="text-base font-extrabold text-white">{destination.name}</p>
                    <p className="text-[11px] text-white/90">
                      {destination.offersCount > 0
                        ? `${destination.offersCount} offre${destination.offersCount > 1 ? "s" : ""}`
                        : "Bientôt disponible"}
                      {destination.fromPrice > 0 && ` · dès ${price(destination.fromPrice)}`}
                    </p>
                  </div>
                </div>
                {destination.blurb && (
                  <p className="line-clamp-3 p-3.5 text-[13px] leading-relaxed text-navy-600">
                    {destination.blurb}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12 rounded-2xl border border-navy-100 bg-white p-6">
        <h2 className="text-base font-extrabold text-navy-900">Villes les plus recherchées</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEO_CITIES.map((ville) => (
            <Link
              key={ville}
              href={`/sejours?q=${encodeURIComponent(ville)}`}
              className="rounded-xl border border-navy-200 px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
            >
              {ville}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-navy-100 bg-navy-50/60 p-6">
        <h2 className="text-base font-extrabold text-navy-900">Par type de voyage</h2>
        <p className="mt-1 text-sm text-navy-600">
          Vous savez déjà comment vous voulez partir&nbsp;? Entrez par la formule.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.id}`}
              className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-gold-300 hover:text-gold-700"
            >
              <Icon name={category.icon} className="size-4" />
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Les visuels viennent de Wikimedia Commons : les licences à attribution
          imposent une mention, portée ici globalement plutôt que sous chaque
          vignette, où elle rendrait la grille illisible. */}
      <p className="mt-8 text-[11px] text-navy-400">
        Photographies des destinations : Wikimedia Commons, sous licences libres.
        Le détail de chaque crédit figure sur la fiche de l&apos;offre concernée.
      </p>
    </div>
  );
}

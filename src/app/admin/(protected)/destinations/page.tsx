import Image from "next/image";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { deleteDestination, saveDestination } from "@/server/actions/admin";
import { price } from "@/lib/format";

export const metadata = { title: "Destinations" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

export default async function DestinationsAdminPage({
  searchParams,
}: PageProps<"/admin/destinations">) {
  const sp = await searchParams;
  const destinations = await prisma.destination.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { offers: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Destinations</h1>
      <p className="mt-1 text-sm text-navy-600">
        Les destinations mises en avant alimentent la grille de la page d&apos;accueil.
      </p>

      {(sp.enregistre || sp.supprime) && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {sp.supprime ? "Destination supprimée." : "Destination enregistrée."}
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Ajouter une destination</h2>
        <form action={saveDestination.bind(null, null)} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Nom *</span>
            <input name="name" required placeholder="Sicile" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Pays</span>
            <input name="country" placeholder="Italie" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Région</span>
            <input name="region" placeholder="Méditerranée" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Prix d&apos;appel (€)
            </span>
            <input type="number" name="fromPrice" min={0} defaultValue={0} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Nombre d&apos;offres affiché
            </span>
            <input type="number" name="offersCount" min={0} defaultValue={0} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Visuel</span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-800"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Texte alternatif du visuel
            </span>
            <input name="imageAlt" placeholder="Vue de la destination" className={INPUT} />
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="featured" className="size-4 rounded accent-gold-500" />
            Mettre en avant
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-start-3"
          >
            Ajouter
          </button>
        </form>
      </section>

      <ul className="mt-5 space-y-3">
        {destinations.map((destination) => (
          <li key={destination.id} className="rounded-2xl border border-navy-100 bg-white p-4">
            <form
              action={saveDestination.bind(null, destination.id)}
              className="grid items-end gap-3 sm:grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="relative size-20 overflow-hidden rounded-xl bg-navy-100">
                {destination.imageUrl && (
                  <Image
                    src={destination.imageUrl}
                    alt=""
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                )}
              </div>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Nom</span>
                <input name="name" defaultValue={destination.name} className={INPUT} />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Région</span>
                <input name="region" defaultValue={destination.region} className={INPUT} />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Prix d&apos;appel
                </span>
                <input
                  type="number"
                  name="fromPrice"
                  defaultValue={destination.fromPrice}
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Texte alternatif
                </span>
                <input
                  name="imageAlt"
                  defaultValue={destination.imageAlt}
                  className={INPUT}
                />
              </label>

              <div className="flex flex-col gap-2">
                <button className="rounded-lg bg-navy-800 px-3 py-2 text-xs font-bold text-white hover:bg-navy-900">
                  Enregistrer
                </button>
              </div>

              <input type="hidden" name="country" value={destination.country} />
              <input type="hidden" name="offersCount" value={destination.offersCount} />
              <input type="hidden" name="position" value={destination.position} />

              <div className="sm:col-span-5 sm:col-start-2">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-navy-700">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={destination.featured}
                      className="size-4 rounded accent-gold-500"
                    />
                    Mise en avant
                  </label>
                  <label className="min-w-0 text-sm text-navy-700">
                    <span className="mr-2 text-xs uppercase tracking-wide text-navy-500">
                      Remplacer le visuel
                    </span>
                    {/* `w-full` est indispensable : un champ fichier a une
                        largeur intrinsèque large, qui élargissait la piste de la
                        grille et faisait déborder toute la carte sous 360 px. */}
                    <input
                      type="file"
                      name="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-navy-100 file:px-2 file:py-1 file:text-xs file:font-semibold"
                    />
                  </label>
                  <span className="text-xs text-navy-500">
                    {destination._count.offers} offre(s) rattachée(s) · dès{" "}
                    {price(destination.fromPrice)}
                  </span>
                </div>
              </div>
            </form>

            <div className="mt-2">
              <ConfirmButton
                action={deleteDestination.bind(null, destination.id)}
                label="Supprimer cette destination"
                title={`Supprimer « ${destination.name} » ?`}
                description={
                  destination._count.offers > 0
                    ? `${destination._count.offers} offre(s) y sont rattachées : elles resteront en ligne mais perdront leur destination. Le visuel sera supprimé du stockage.`
                    : `« ${destination.name} » et son visuel seront supprimés. C'est définitif.`
                }
                confirmLabel="Supprimer"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

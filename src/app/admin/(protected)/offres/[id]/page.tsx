import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import OfferForm from "@/components/admin/OfferForm";
import { prisma } from "@/server/prisma";
import {
  addOfferImage,
  deleteOffer,
  deleteOfferImage,
  updateOffer,
} from "@/server/actions/offers";
import { cloudinaryConfigured } from "@/server/media";

export const metadata = { title: "Modifier une offre" };
export const dynamic = "force-dynamic";

export default async function EditOfferPage({ params, searchParams }: PageProps<"/admin/offres/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  const [offer, categories, destinations] = await Promise.all([
    prisma.offer.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { position: "asc" }, select: { id: true, label: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!offer) notFound();

  // Les actions sont liées ici à l'identifiant : le formulaire reste ignorant
  // de l'offre qu'il modifie.
  const save = updateOffer.bind(null, offer.id);
  const remove = deleteOffer.bind(null, offer.id);
  const addImage = addOfferImage.bind(null, offer.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/offres"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-700"
      >
        <Icon name="chevronLeft" className="size-4" />
        Retour aux offres
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{offer.title}</h1>
          <p className="mt-1 text-sm text-navy-600">
            {offer.destination}, {offer.country} ·{" "}
            <Link
              href={`/offre/${offer.slug}`}
              target="_blank"
              className="font-semibold text-gold-700 hover:underline"
            >
              voir sur le site
            </Link>
          </p>
        </div>
      </div>

      {(sp.enregistre || sp.cree || sp.image) && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {sp.cree ? "Offre créée." : sp.image ? "Visuel ajouté." : "Modifications enregistrées."}
        </p>
      )}
      {sp.erreur === "fichier" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Aucun fichier sélectionné.
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-navy-900">
            Visuels ({offer.images.length})
          </h2>
          <span className="text-xs text-navy-500">
            {cloudinaryConfigured()
              ? "Stockage : Cloudinary"
              : "Stockage : public/uploads (Cloudinary non configuré)"}
          </span>
        </div>

        {offer.images.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {offer.images.map((image) => (
              <li key={image.id} className="group relative overflow-hidden rounded-xl border border-navy-100">
                <div className="relative aspect-4/3">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <form action={deleteOfferImage.bind(null, image.id)}>
                  <button
                    type="submit"
                    aria-label="Supprimer ce visuel"
                    className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-navy-700 opacity-0 transition group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addImage} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Ajouter un visuel
            </span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy-800"
            />
          </label>
          <label className="block min-w-48 flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Texte alternatif
            </span>
            <input
              name="alt"
              placeholder="Vue sur la piscine"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-900"
          >
            Téléverser
          </button>
        </form>
      </section>

      <div className="mt-5">
        <OfferForm
          action={save}
          values={{
            ...offer,
            destinationId: offer.destinationId,
            oldPrice: offer.oldPrice,
            // Un champ `date` n'accepte que « AAAA-MM-JJ » ; la valeur est
            // découpée en heure locale, celle qui a servi à la saisir.
            departureDate: offer.departureDate
              ? `${offer.departureDate.getFullYear()}-${String(offer.departureDate.getMonth() + 1).padStart(2, "0")}-${String(offer.departureDate.getDate()).padStart(2, "0")}`
              : "",
          }}
          categories={categories}
          destinations={destinations}
          submitLabel="Enregistrer les modifications"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-extrabold text-red-800">Supprimer cette offre</h2>
        <p className="mt-1 text-sm text-red-700">
          Les visuels associés sont également supprimés. Les réservations existantes sont conservées
          mais perdent leur lien vers l&apos;offre. Action irréversible.
        </p>
        <div className="mt-3">
          <ConfirmButton
            action={remove}
            label="Supprimer définitivement"
            title={`Supprimer « ${offer.title} » ?`}
            description={`L'offre, ses ${offer.images.length} visuel(s) et ses avis seront supprimés. Les réservations déjà passées sont conservées mais perdront le lien vers l'offre.`}
            confirmLabel="Supprimer"
            confirmWord={offer.slug}
            className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
          />
        </div>
      </section>
    </div>
  );
}

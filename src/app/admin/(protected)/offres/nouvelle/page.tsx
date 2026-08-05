import Link from "next/link";
import Icon from "@/components/ui/Icon";
import OfferForm from "@/components/admin/OfferForm";
import { prisma } from "@/server/prisma";
import { createOffer } from "@/server/actions/offers";

export const metadata = { title: "Nouvelle offre" };
export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const [categories, destinations] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" }, select: { id: true, label: true } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/offres"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-700"
      >
        <Icon name="chevronLeft" className="size-4" />
        Retour aux offres
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900">Nouvelle offre</h1>
      <p className="mb-6 mt-1 text-sm text-navy-600">
        L&apos;offre est créée en brouillon : les visuels s&apos;ajoutent après l&apos;enregistrement.
      </p>

      <OfferForm
        action={createOffer}
        categories={categories}
        destinations={destinations}
        submitLabel="Créer l'offre"
      />
    </div>
  );
}

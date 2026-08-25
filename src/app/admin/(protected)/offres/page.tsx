import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import AdminNotice from "@/components/admin/AdminNotice";
import Pagination from "@/components/admin/Pagination";
import { prisma } from "@/server/prisma";
import { price } from "@/lib/format";

export const metadata = { title: "Offres" };
export const dynamic = "force-dynamic";

const PER_PAGE = 30;

const STATUS_LABEL: Record<string, string> = {
  published: "En ligne",
  draft: "Brouillon",
  archived: "Archivée",
};

export default async function OffersPage({ searchParams }: PageProps<"/admin/offres">) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.statut === "string" ? sp.statut : "";
  const categorySlug = typeof sp.type === "string" ? sp.type : "";

  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query
      ? {
          OR: [
            // Le numéro d'abord : c'est ce qu'un client dicte au téléphone,
            // et « 48213 » doit suffire à retrouver GSJ-048213.
            { reference: { contains: query, mode: "insensitive" as const } },
            { title: { contains: query, mode: "insensitive" as const } },
            { destination: { contains: query, mode: "insensitive" as const } },
            { country: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [categories, total, offers] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      orderBy: [{ status: "asc" }, { position: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        category: { select: { label: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Offres</h1>
          <p className="mt-1 text-sm text-navy-600">
            {total} offre{total > 1 ? "s" : ""} dans le catalogue.
          </p>
        </div>
        <Link
          href="/admin/offres/nouvelle"
          className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
        >
          <Icon name="sparkles" className="size-4" />
          Nouvelle offre
        </Link>
      </div>

      {sp.supprime && <AdminNotice>Offre supprimée.</AdminNotice>}

      <form className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-navy-100 bg-white p-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher un titre, une ville, un pays…"
          className="min-w-52 flex-1 rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
        />
        <select
          name="type"
          defaultValue={categorySlug}
          className="rounded-xl border border-navy-200 px-3 py-2.5 text-sm"
        >
          <option value="">Tous les types</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="statut"
          defaultValue={status}
          className="rounded-xl border border-navy-200 px-3 py-2.5 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="published">En ligne</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivée</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-900"
        >
          Filtrer
        </button>
      </form>

      {offers.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          {total > 0 ? (
            <>
              Cette page n&apos;existe pas.{" "}
              <Link href="/admin/offres" className="font-semibold text-navy-700 underline">
                Revenir au début de la liste
              </Link>
            </>
          ) : (
            "Aucune offre ne correspond à ces critères."
          )}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-navy-100 bg-white">
          <ul className="divide-y divide-navy-100">
            {offers.map((offer) => (
              <li key={offer.id} className="flex items-center gap-4 p-3 hover:bg-navy-50/50">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy-100">
                  {offer.images[0] && (
                    <Image
                      src={offer.images[0].url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/offres/${offer.id}`}
                    className="block truncate text-sm font-bold text-navy-900 hover:text-gold-700"
                  >
                    {offer.title}
                  </Link>
                  <p className="truncate text-xs text-navy-500">
                    <span className="font-mono font-semibold text-navy-600">
                      {offer.reference}
                    </span>{" "}
                    · {offer.destination}, {offer.country} · {offer.category.label}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    {offer._count.bookings} réservation(s) · {offer._count.reviews} avis
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-extrabold text-navy-900">{price(offer.price)}</p>
                  {offer.oldPrice && (
                    <p className="text-xs text-navy-400 line-through">{price(offer.oldPrice)}</p>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                    offer.status === "published"
                      ? "bg-teal-50 text-teal-600"
                      : offer.status === "archived"
                        ? "bg-navy-100 text-navy-600"
                        : "bg-gold-50 text-gold-700"
                  }`}
                >
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>

                <Link
                  href={`/admin/offres/${offer.id}`}
                  aria-label={`Modifier ${offer.title}`}
                  className="shrink-0 rounded-lg border border-navy-200 p-2 text-navy-600 hover:border-navy-400"
                >
                  <Icon name="chevronRight" className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination
        base="/admin/offres"
        params={{ q: query, statut: status, type: categorySlug }}
        page={page}
        total={total}
        perPage={PER_PAGE}
      />
    </div>
  );
}

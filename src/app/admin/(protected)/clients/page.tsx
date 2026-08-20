import Link from "next/link";
import Icon from "@/components/ui/Icon";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/admin/Pagination";
import { prisma } from "@/server/prisma";
import { loyaltyTier } from "@/lib/constants";
import { dateLabel } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const SORTS = {
  recent: { label: "Inscription", order: { createdAt: "desc" } },
  points: { label: "Points", order: { loyaltyPoints: "desc" } },
  nom: { label: "Nom", order: { lastName: "asc" } },
} as const;

type SortKey = keyof typeof SORTS;

export default async function CustomersAdminPage({ searchParams }: PageProps<"/admin/clients">) {
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort: SortKey = typeof sp.tri === "string" && sp.tri in SORTS ? (sp.tri as SortKey) : "recent";
  const page = Math.max(1, Number(sp.page) || 1);

  // La recherche porte sur les trois identifiants qu'un conseiller a sous la
  // main quand un voyageur appelle : son nom, son adresse ou son téléphone.
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: SORTS[sort].order,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { bookings: true, favourites: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Clients</h1>
      <p className="mt-1 text-sm text-navy-600">
        Voyageurs disposant d&apos;un espace client. Les demandes passées sans compte
        n&apos;apparaissent que dans les réservations.
      </p>

      {sp.supprime && <AdminNotice>Client supprimé, réservations comprises.</AdminNotice>}
      {sp.anonymise && <AdminNotice>Client anonymisé : les réservations sont conservées.</AdminNotice>}
      {sp.erreur === "droits" && (
        <AdminNotice tone="error">
          Seul un compte « owner » peut supprimer ou anonymiser un client.
        </AdminNotice>
      )}
      {sp.erreur === "introuvable" && (
        <AdminNotice tone="error">Ce client n&apos;existe plus.</AdminNotice>
      )}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <AdminSearch
          action="/admin/clients"
          defaultValue={q}
          placeholder="Nom, e-mail ou téléphone"
          hidden={{ tri: sort }}
        />
        <nav className="flex gap-1">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <Link
              key={key}
              href={`/admin/clients?tri=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                sort === key ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {SORTS[key].label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-3 text-xs text-navy-500">
        {total} client{total > 1 ? "s" : ""}
        {q && ` correspondant à « ${q} »`}
      </p>

      {customers.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          {/* Une page hors plage renvoie une liste vide alors que des clients
              existent : le dire évite de croire que la base l'est aussi. */}
          {total > 0 ? (
            <>
              Cette page n&apos;existe pas.{" "}
              <Link href="/admin/clients" className="font-semibold text-navy-700 underline">
                Revenir au début de la liste
              </Link>
            </>
          ) : q ? (
            "Aucun client ne correspond à cette recherche."
          ) : (
            "Aucun client inscrit pour l'instant."
          )}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {customers.map((customer) => {
            const tier = loyaltyTier(customer.loyaltyPoints);
            const name = `${customer.firstName} ${customer.lastName}`.trim() || "Sans nom";

            return (
              <li key={customer.id}>
                <Link
                  href={`/admin/clients/${customer.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-navy-100 bg-white p-4 transition hover:border-navy-300"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-800 font-extrabold text-gold-400">
                    {(customer.firstName || customer.email).charAt(0).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-navy-900">{name}</span>
                    <span className="block truncate text-xs text-navy-500">{customer.email}</span>
                  </span>

                  <span className="text-xs text-navy-500">
                    {customer._count.bookings} réservation(s)
                  </span>

                  <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-800">
                    {tier.label} · {customer.loyaltyPoints} pts
                  </span>

                  {!customer.active && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                      Désactivé
                    </span>
                  )}

                  <span className="text-xs text-navy-500">
                    Inscrit le {dateLabel(customer.createdAt)}
                  </span>

                  <Icon name="chevronRight" className="size-4 text-navy-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        base="/admin/clients"
        params={{ q, tri: sort }}
        page={page}
        total={total}
        perPage={PER_PAGE}
      />
    </div>
  );
}

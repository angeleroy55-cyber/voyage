import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { prisma } from "@/server/prisma";
import { STATUS_LABELS } from "@/lib/constants";
import { price } from "@/lib/format";

export const metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    publishedOffers,
    draftOffers,
    destinations,
    categories,
    activeCategories,
    customers,
    inactiveCustomers,
    pendingReviews,
    bookings,
    pendingBookings,
    subscribers,
    revenue,
    recentBookings,
    recentReviews,
    topOffers,
  ] = await Promise.all([
    prisma.offer.count({ where: { status: "published" } }),
    prisma.offer.count({ where: { status: "draft" } }),
    prisma.destination.count(),
    prisma.category.count(),
    prisma.category.count({ where: { active: true } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { active: false } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.subscriber.count(),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: "confirmed" },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { offer: { select: { title: true, destination: true } } },
    }),
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: "pending" },
    }),
    prisma.offer.findMany({
      take: 5,
      orderBy: { reviewsCount: "desc" },
      where: { status: "published" },
      select: { id: true, title: true, destination: true, price: true, rating: true },
    }),
  ]);

  const tiles = [
    { label: "Offres en ligne", value: publishedOffers, hint: `${draftOffers} brouillon(s)`, href: "/admin/offres", icon: "package" },
    { label: "Réservations", value: bookings, hint: `${pendingBookings} à traiter`, href: "/admin/reservations", icon: "calendar" },
    { label: "Avis à modérer", value: pendingReviews, hint: "en attente", href: "/admin/avis", icon: "star" },
    { label: "Destinations", value: destinations, hint: `${subscribers} inscrit(s) newsletter`, href: "/admin/destinations", icon: "pin" },
    { label: "Catégories", value: categories, hint: `${activeCategories} visible(s) sur le site`, href: "/admin/categories", icon: "route" },
    { label: "Clients", value: customers, hint: inactiveCustomers > 0 ? `${inactiveCustomers} compte(s) désactivé(s)` : "tous actifs", href: "/admin/clients", icon: "users" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Tableau de bord</h1>
      <p className="mt-1 text-sm text-navy-600">
        Vue d&apos;ensemble du catalogue et de l&apos;activité commerciale.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group rounded-2xl border border-navy-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-700">
              <Icon name={t.icon} className="size-5" />
            </span>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-navy-900">{t.value}</p>
            <p className="text-sm font-semibold text-navy-800">{t.label}</p>
            <p className="text-xs text-navy-500">{t.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-gold-200 bg-gold-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-700">
          Chiffre d&apos;affaires confirmé
        </p>
        <p className="mt-1 text-3xl font-extrabold text-navy-900">
          {price(revenue._sum.totalPrice ?? 0)}
        </p>
        <p className="text-xs text-navy-600">
          Somme des réservations au statut « confirmée ».
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-navy-900">Dernières réservations</h2>
            <Link href="/admin/reservations" className="text-sm font-semibold text-gold-700 hover:underline">
              Tout voir
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">Aucune réservation pour l&apos;instant.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-100">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-900">
                      {b.customerName}
                    </span>
                    <span className="block truncate text-xs text-navy-500">
                      {b.reference} · {b.offer?.destination ?? "offre supprimée"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-navy-900">{price(b.totalPrice)}</span>
                    <StatusPill status={b.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-navy-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-navy-900">Avis en attente</h2>
            <Link href="/admin/avis" className="text-sm font-semibold text-gold-700 hover:underline">
              Modérer
            </Link>
          </div>
          {recentReviews.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">Rien à modérer, tout est à jour.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-100">
              {recentReviews.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                    {r.author}
                    <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                      {r.score.toFixed(1).replace(".", ",")}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-xs text-navy-600">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Offres les plus commentées</h2>
        {topOffers.length === 0 && (
          <p className="mt-3 text-sm text-navy-500">
            Aucune offre en ligne pour l&apos;instant.{" "}
            <Link href="/admin/offres/nouvelle" className="font-semibold text-gold-700 hover:underline">
              En créer une
            </Link>
          </p>
        )}
        <ul className="mt-3 divide-y divide-navy-100">
          {topOffers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link
                href={`/admin/offres/${o.id}`}
                className="min-w-0 truncate text-sm font-semibold text-navy-900 hover:text-gold-700"
              >
                {o.destination} · {o.title}
              </Link>
              <span className="shrink-0 text-sm font-bold text-navy-900">{price(o.price)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed"
      ? "bg-teal-50 text-teal-700"
      : status === "cancelled"
        ? "bg-red-50 text-red-600"
        : status === "completed"
          ? "bg-navy-100 text-navy-700"
          : "bg-gold-50 text-gold-700";

  // Le libellé vient de `STATUS_LABELS` : une liste écrite en dur ici affichait
  // « À traiter » pour un séjour terminé, faute de cas prévu.
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

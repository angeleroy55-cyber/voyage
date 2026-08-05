import Link from "next/link";
import { prisma } from "@/server/prisma";
import { saveBookingNotes, setBookingStatus } from "@/server/actions/admin";
import { STATUS_LABELS } from "@/lib/constants";
import { price } from "@/lib/format";

export const metadata = { title: "Réservations" };
export const dynamic = "force-dynamic";

export default async function BookingsPage({ searchParams }: PageProps<"/admin/reservations">) {
  const sp = await searchParams;
  const status = typeof sp.statut === "string" ? sp.statut : "tous";

  const bookings = await prisma.booking.findMany({
    where: status === "tous" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { offer: { select: { id: true, title: true, destination: true } } },
  });

  const counts = await prisma.booking.groupBy({ by: ["status"], _count: true });
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Réservations</h1>
      <p className="mt-1 text-sm text-navy-600">
        Les demandes envoyées depuis le site arrivent ici au statut « en attente ».
      </p>

      <nav className="mt-5 flex flex-wrap gap-2">
        {[
          { id: "tous", label: "Toutes" },
          { id: "pending", label: `En attente (${countOf("pending")})` },
          { id: "confirmed", label: `Confirmées (${countOf("confirmed")})` },
          { id: "cancelled", label: `Annulées (${countOf("cancelled")})` },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/reservations?statut=${tab.id}`}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              status === tab.id
                ? "bg-navy-900 text-white"
                : "border border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          Aucune réservation pour le moment. Elles apparaîtront ici dès qu&apos;un visiteur enverra
          une demande depuis une fiche offre.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-2xl border border-navy-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy-900">
                    {booking.customerName}
                    <span className="ml-2 rounded bg-navy-50 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600">
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </p>
                  <p className="text-xs text-navy-500">
                    {booking.reference} · {booking.customerEmail}
                    {booking.customerPhone && ` · ${booking.customerPhone}`}
                  </p>
                  <p className="mt-1 text-xs text-navy-500">
                    {booking.travellers} voyageur(s)
                    {booking.insurance && " · assurance annulation"} ·{" "}
                    {booking.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                  {booking.offer && (
                    <Link
                      href={`/admin/offres/${booking.offer.id}`}
                      className="mt-1 inline-block text-xs font-semibold text-gold-700 hover:underline"
                    >
                      {booking.offer.destination} — {booking.offer.title}
                    </Link>
                  )}
                </div>
                <p className="shrink-0 text-lg font-extrabold text-navy-900">
                  {price(booking.totalPrice)}
                </p>
              </div>

              <form
                action={saveBookingNotes.bind(null, booking.id)}
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <label className="min-w-48 flex-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Note interne
                  </span>
                  <input
                    name="notes"
                    defaultValue={booking.notes}
                    className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2 text-sm outline-none focus:border-navy-400"
                  />
                </label>
                <button className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400">
                  Enregistrer
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {booking.status !== "confirmed" && (
                  <form action={setBookingStatus.bind(null, booking.id, "confirmed")}>
                    <button className="rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-600">
                      Confirmer
                    </button>
                  </form>
                )}
                {booking.status !== "cancelled" && (
                  <form action={setBookingStatus.bind(null, booking.id, "cancelled")}>
                    <button className="rounded-lg border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                      Annuler
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

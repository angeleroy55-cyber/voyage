import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import AdminNotice from "@/components/admin/AdminNotice";
import BookingForm from "@/components/admin/BookingForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { deleteBooking, updateBooking } from "@/server/actions/bookings";
import { STATUS_LABELS, paymentLabel } from "@/lib/constants";
import { dateLabel, price } from "@/lib/format";

export const metadata = { title: "Modifier une réservation" };
export const dynamic = "force-dynamic";

/**
 * Édition d'un dossier, sur sa propre page.
 *
 * Le formulaire embarque un menu déroulant de tout le catalogue : le laisser
 * dans la liste le dupliquait à chaque ligne, pour une page de plusieurs
 * centaines de kilo-octets dont l'essentiel restait replié. Une page dédiée
 * laisse aussi la place de respirer sur mobile.
 */
export default async function EditBookingPage({ params }: PageProps<"/admin/reservations/[id]">) {
  const { id } = await params;

  const [booking, offers] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        offer: { select: { id: true, title: true, destination: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.offer.findMany({
      where: { status: { not: "archived" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, destination: true, price: true },
    }),
  ]);

  if (!booking) notFound();

  const due = booking.totalPrice - booking.paidAmount;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-700"
      >
        <Icon name="chevronLeft" className="size-4" />
        Toutes les réservations
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl font-extrabold tracking-tight text-navy-900">
            {booking.reference}
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {booking.customerName} · créée le {dateLabel(booking.createdAt)} ·{" "}
            {STATUS_LABELS[booking.status] ?? booking.status}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-navy-900">{price(booking.totalPrice)}</p>
          <p className={`text-xs font-semibold ${due > 0 ? "text-red-600" : "text-teal-700"}`}>
            {due > 0 ? `Reste ${price(due)}` : "Soldée"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-navy-500">
        <span className="rounded-full bg-navy-50 px-3 py-1.5">
          Paiement : {paymentLabel(booking.paymentMethod)}
        </span>
        {booking.instalments > 1 && (
          <span className="rounded-full bg-navy-50 px-3 py-1.5">
            {booking.instalments} fois sans frais
          </span>
        )}
        {booking.customer && (
          <Link
            href={`/admin/clients/${booking.customer.id}`}
            className="rounded-full bg-navy-50 px-3 py-1.5 font-semibold text-navy-700 hover:bg-navy-100"
          >
            Fiche de {booking.customer.firstName} {booking.customer.lastName}
          </Link>
        )}
        {booking.offer && (
          <Link
            href={`/admin/offres/${booking.offer.id}`}
            className="rounded-full bg-navy-50 px-3 py-1.5 font-semibold text-navy-700 hover:bg-navy-100"
          >
            {booking.offer.title}
          </Link>
        )}
      </div>

      {!booking.offer && (
        <AdminNotice tone="error">
          L&apos;offre d&apos;origine a été supprimée. Choisissez-en une autre pour que le dossier
          reste exploitable.
        </AdminNotice>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-navy-900">Détail du dossier</h2>
        <div className="mt-3">
          <BookingForm
            offers={offers}
            booking={booking}
            action={updateBooking.bind(null, booking.id)}
            submitLabel="Enregistrer les modifications"
          />
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-red-800">Supprimer ce dossier</h2>
        <p className="mt-1 text-sm text-red-700">
          Les règlements enregistrés disparaissent avec lui. Préférez le statut « Annulée » pour
          garder une trace.
        </p>
        <div className="mt-3">
          <ConfirmButton
            action={deleteBooking.bind(null, booking.id)}
            label="Supprimer définitivement"
            title={`Supprimer ${booking.reference} ?`}
            description={`Le dossier de ${booking.customerName} (${price(booking.totalPrice)}, dont ${price(booking.paidAmount)} réglés) sera effacé de la base. C'est définitif.`}
            confirmLabel="Supprimer"
            confirmWord={booking.reference}
            className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
          />
        </div>
      </section>
    </div>
  );
}

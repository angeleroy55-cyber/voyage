import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/account/StatusBadge";
import Icon from "@/components/ui/Icon";
import { dateRange, durationLabel, price } from "@/lib/format";
import { daysUntil, type AccountBooking } from "@/server/account";

/**
 * Ligne de réservation telle qu'elle apparaît dans la liste et sur le tableau
 * de bord : visuel, référence, dates, état du règlement.
 */
export default function BookingCard({ booking }: { booking: AccountBooking }) {
  const offer = booking.offer;
  const countdown = booking.departureDate ? daysUntil(booking.departureDate) : null;
  const paidRatio =
    booking.totalPrice > 0 ? Math.round((booking.paidAmount / booking.totalPrice) * 100) : 100;

  return (
    <article className="group hover-lift overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card sm:flex">
      <div className="relative aspect-16/9 sm:aspect-auto sm:w-52 sm:shrink-0">
        {offer ? (
          <Image
            src={offer.image}
            alt={`${offer.title}, ${offer.destination}`}
            fill
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          // L'offre a pu être retirée du catalogue depuis la réservation : le
          // dossier reste consultable, seul le visuel manque.
          <div className="grid h-full place-items-center bg-navy-50 text-navy-300">
            <Icon name="package" className="size-8" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            <span className="rounded-md bg-navy-50 px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-navy-600">
              {booking.reference}
            </span>
          </div>

          <h3 className="mt-2 text-base font-bold leading-snug text-navy-900">
            {offer ? (
              <Link
                href={`/compte/reservations/${booking.reference}`}
                className="transition hover:text-gold-700"
              >
                {offer.title}
              </Link>
            ) : (
              "Séjour retiré du catalogue"
            )}
          </h3>

          {offer && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-600">
              <span className="flex items-center gap-1">
                <Icon name="pin" className="size-3.5 text-navy-400" />
                {offer.destination}, {offer.country}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="calendar" className="size-3.5 text-navy-400" />
                {dateRange(booking.departureDate, booking.returnDate)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="users" className="size-3.5 text-navy-400" />
                {booking.travellers} voyageur{booking.travellers > 1 ? "s" : ""}
              </span>
            </p>
          )}

          {countdown !== null && countdown >= 0 && booking.status !== "cancelled" && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-800">
              <Icon name="bolt" className="size-3.5" />
              {countdown === 0
                ? "Départ aujourd'hui"
                : `Départ dans ${countdown} jour${countdown > 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-end justify-between gap-3 border-navy-100 sm:w-44 sm:flex-col sm:items-end sm:border-l sm:pl-4">
          <div className="text-right">
            {offer && (
              <p className="text-xs text-navy-500">
                {durationLabel(offer.nights, offer.category)}
              </p>
            )}
            <p className="text-xl font-extrabold text-navy-900">{price(booking.totalPrice)}</p>
            {booking.status !== "cancelled" && booking.remaining > 0 ? (
              <p className="text-[11px] font-semibold text-gold-700">
                Reste {price(booking.remaining)}
              </p>
            ) : (
              booking.status !== "cancelled" && (
                <p className="text-[11px] font-semibold text-teal-600">Intégralement réglé</p>
              )
            )}
            {booking.status !== "cancelled" && (
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, paidRatio))}%` }}
                />
              </div>
            )}
          </div>

          <Link
            href={`/compte/reservations/${booking.reference}`}
            className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-800 transition hover:border-navy-400 hover:bg-navy-50"
          >
            Voir le dossier
          </Link>
        </div>
      </div>
    </article>
  );
}

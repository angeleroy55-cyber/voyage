import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CancelBooking from "@/components/account/CancelBooking";
import StatusBadge from "@/components/account/StatusBadge";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { BOOKING_TIMELINE } from "@/lib/constants";
import { dateLabel, dateRange, durationLabel, price } from "@/lib/format";
import { daysUntil, getBooking } from "@/server/account";
import { requireCustomer } from "@/server/customer-session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/compte/reservations/[reference]">) {
  const { reference } = await params;
  return { title: `Dossier ${reference}` };
}

export default async function BookingDetailPage({
  params,
}: PageProps<"/compte/reservations/[reference]">) {
  const session = await requireCustomer();
  const { reference } = await params;

  // `getBooking` filtre sur le client connecté : une référence valide mais
  // appartenant à quelqu'un d'autre donne un 404, pas un 403 — inutile de
  // confirmer qu'elle existe.
  const booking = await getBooking(session.sub, reference);
  if (!booking) notFound();

  const offer = booking.offer;
  const cancelled = booking.status === "cancelled";
  const countdown = booking.departureDate ? daysUntil(booking.departureDate) : null;

  // Annulation gratuite jusqu'à 30 jours du départ ; à défaut de date de
  // départ connue, la règle se cale sur la date de commande.
  const freeUntil = new Date(booking.departureDate ?? booking.createdAt);
  freeUntil.setDate(freeUntil.getDate() - 30);

  const currentStep = BOOKING_TIMELINE.findIndex((s) => s.status === booking.status);

  const documents = [
    {
      label: "Confirmation de réservation",
      hint: "Récapitulatif du dossier et conditions de vente",
      ready: booking.status !== "pending",
    },
    {
      label: "Bon d'échange (voucher)",
      hint: "À présenter à l'arrivée sur place",
      ready: booking.status === "confirmed" || booking.status === "completed",
    },
    {
      label: "Facture acquittée",
      hint: "Disponible une fois le solde réglé",
      ready: booking.remaining === 0 && !cancelled,
    },
    {
      label: "Attestation d'assurance",
      hint: booking.insurance
        ? "Garantie annulation souscrite"
        : "Aucune assurance souscrite sur ce dossier",
      ready: booking.insurance && booking.status !== "pending",
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/compte/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 transition hover:text-gold-700"
      >
        <Icon name="chevronLeft" className="size-4" />
        Toutes mes réservations
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            <span className="rounded-md bg-navy-50 px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-navy-600">
              {booking.reference}
            </span>
            <span className="text-xs text-navy-500">
              Réservé le {dateLabel(booking.createdAt)}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-navy-900">
            {offer?.title ?? "Séjour retiré du catalogue"}
          </h1>
          {offer && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-600">
              <Icon name="pin" className="size-4 text-navy-400" />
              {offer.destination}, {offer.country}
            </p>
          )}
        </div>
        {countdown !== null && countdown >= 0 && !cancelled && (
          <div className="rounded-2xl border border-gold-200 bg-gold-50 px-4 py-2.5 text-center">
            <p className="text-xl font-extrabold leading-none tabular-nums text-navy-900">
              J−{countdown}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-800">
              avant le départ
            </p>
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {offer && (
            <Reveal>
              <section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
                <div className="relative h-40 sm:h-52">
                  <Image
                    src={offer.image}
                    alt={`${offer.title}, ${offer.destination}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover"
                    priority
                  />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 sm:grid-cols-4">
                  {[
                    { label: "Dates", value: dateRange(booking.departureDate, booking.returnDate) },
                    { label: "Durée", value: durationLabel(offer.nights, offer.category) },
                    {
                      label: "Voyageurs",
                      value: `${booking.travellers} personne${booking.travellers > 1 ? "s" : ""}`,
                    },
                    { label: "Formule", value: offer.board },
                    { label: "Départ de", value: offer.departureCity },
                    { label: "Type de séjour", value: offer.categoryLabel },
                    {
                      label: "Assurance",
                      value: booking.insurance ? "Annulation incluse" : "Non souscrite",
                    },
                    {
                      label: "Catégorie",
                      value: offer.stars > 0 ? `${offer.stars} étoiles` : "Non classé",
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs uppercase tracking-wide text-navy-500">{row.label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-navy-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </Reveal>
          )}

          {/* Suivi du dossier */}
          <Reveal>
            <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                Suivi du dossier
              </h2>

              {cancelled ? (
                <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  <Icon name="close" className="mt-0.5 size-4 shrink-0" />
                  Cette réservation a été annulée. Les sommes déjà réglées sont remboursées sous
                  14 jours sur le moyen de paiement d&apos;origine.
                </p>
              ) : (
                <ol className="mt-4 space-y-0">
                  {BOOKING_TIMELINE.map((step, index) => {
                    const done = index <= currentStep;
                    const last = index === BOOKING_TIMELINE.length - 1;
                    return (
                      <li key={step.status} className="flex gap-3.5">
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                              done ? "bg-teal-500 text-white" : "bg-navy-100 text-navy-400"
                            }`}
                          >
                            {done ? <Icon name="check" className="size-3.5" /> : index + 1}
                          </span>
                          {!last && (
                            <span
                              className={`w-0.5 flex-1 ${
                                index < currentStep ? "bg-teal-500" : "bg-navy-100"
                              }`}
                            />
                          )}
                        </div>
                        <div className={last ? "pb-0" : "pb-6"}>
                          <p
                            className={`text-sm font-bold ${
                              done ? "text-navy-900" : "text-navy-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-sm text-navy-600">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </Reveal>

          {/* Échéancier */}
          <Reveal>
            <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                  Paiement
                </h2>
                <span className="text-xs text-navy-500">
                  {booking.instalments > 1
                    ? `${booking.instalments} fois sans frais`
                    : "Paiement comptant"}
                </span>
              </div>

              <ul className="mt-4 divide-y divide-navy-100">
                {booking.schedule.map((instalment) => (
                  <li key={instalment.index} className="flex items-center gap-3 py-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${
                        instalment.paid
                          ? "bg-teal-50 text-teal-600"
                          : "bg-navy-50 text-navy-400"
                      }`}
                    >
                      <Icon name={instalment.paid ? "check" : "clock"} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy-900">
                        Échéance {instalment.index} sur {booking.schedule.length}
                      </span>
                      <span className="block text-xs text-navy-500">
                        {instalment.paid ? "Réglée le" : "Prélèvement prévu le"}{" "}
                        {dateLabel(instalment.dueDate)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-navy-900">
                      {price(instalment.amount)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-navy-100 pt-3">
                <span className="text-sm font-bold text-navy-900">Total du séjour</span>
                <span className="text-lg font-extrabold text-navy-900">
                  {price(booking.totalPrice)}
                </span>
              </div>
              {!cancelled && booking.remaining > 0 && (
                <p className="mt-1 text-right text-xs font-semibold text-gold-700">
                  Reste à régler : {price(booking.remaining)}
                </p>
              )}
            </section>
          </Reveal>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Reveal variant="right">
            <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
                Documents de voyage
              </h2>
              <ul className="mt-3 space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.label}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 transition ${
                      doc.ready
                        ? "border-navy-200 hover:border-navy-400"
                        : "border-dashed border-navy-200 opacity-60"
                    }`}
                  >
                    <Icon
                      name={doc.ready ? "check" : "clock"}
                      className={`mt-0.5 size-4 shrink-0 ${
                        doc.ready ? "text-teal-500" : "text-navy-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy-900">{doc.label}</span>
                      <span className="block text-xs text-navy-500">{doc.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-navy-500">
                Maquette de démonstration : les documents ne sont pas générés, seul leur état de
                disponibilité est simulé à partir du dossier.
              </p>
            </section>
          </Reveal>

          <Reveal variant="right" delay={80}>
            <section className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                <Icon name="headset" className="size-4 text-gold-600" />
                Assistance
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-navy-600">
                Une question sur ce dossier ? Munissez-vous de la référence{" "}
                <strong className="text-navy-800">{booking.reference}</strong>.
              </p>
              <Link
                href="/aide#contact"
                className="mt-3 block rounded-xl bg-navy-800 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-navy-900"
              >
                Contacter un conseiller
              </Link>

              {!cancelled && booking.status !== "completed" && (
                <div className="mt-2">
                  <CancelBooking reference={booking.reference} freeUntil={dateLabel(freeUntil)} />
                </div>
              )}
            </section>
          </Reveal>

          {offer && (
            <Reveal variant="right" delay={140}>
              <Link
                href={`/offre/${offer.slug}`}
                className="hover-lift block rounded-2xl border border-navy-100 bg-white p-4 text-sm font-semibold text-navy-800 shadow-card"
              >
                <span className="flex items-center justify-between gap-2">
                  Revoir la fiche du séjour
                  <Icon name="chevronRight" className="size-4 text-navy-400" />
                </span>
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

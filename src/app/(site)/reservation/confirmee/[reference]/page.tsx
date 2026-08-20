import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { PaymentLogo } from "@/components/ui/BrandLogos";
import { getBookingConfirmation } from "@/server/catalogue";
import { getCustomerSession } from "@/server/customer-session";
import { PAYMENT_METHODS, paymentLabel, type PaymentId } from "@/lib/constants";
import { dateRange, price } from "@/lib/format";

/**
 * Étape 3 : la demande est enregistrée.
 *
 * La page est atteinte par redirection après l'envoi du formulaire, et reste
 * consultable ensuite avec la référence. Elle n'affiche donc que ce qu'un client
 * peut relire sans risque ; le dossier détaillé vit dans l'espace client.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Demande enregistrée", robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({
  params,
}: PageProps<"/reservation/confirmee/[reference]">) {
  const { reference } = await params;
  const booking = await getBookingConfirmation(reference);
  if (!booking) notFound();

  const session = await getCustomerSession();
  const known = PAYMENT_METHODS.some((m) => m.id === booking.paymentMethod);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-teal-500 text-white">
          <Icon name="check" className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-900">
          Demande enregistrée
        </h1>
        <p className="mt-2 text-sm text-navy-700">
          Un conseiller vérifie les disponibilités et vous recontacte sous 24 h à l&apos;adresse{" "}
          <strong className="text-navy-900">{booking.customerEmail}</strong>.
        </p>
        <p className="mt-4 inline-block rounded-xl border border-teal-200 bg-white px-4 py-2">
          <span className="text-xs uppercase tracking-wide text-navy-500">Votre référence</span>
          <span className="ml-2 text-lg font-extrabold tracking-wider text-navy-900">
            {booking.reference}
          </span>
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
          Récapitulatif
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {[
            { label: "Séjour", value: booking.offer?.title ?? "Offre retirée du catalogue" },
            {
              label: "Destination",
              value: booking.offer
                ? `${booking.offer.destination}, ${booking.offer.country}`
                : "Non précisée",
            },
            { label: "Voyageurs", value: String(booking.travellers) },
            { label: "Dates souhaitées", value: dateRange(booking.departureDate, booking.returnDate) },
            { label: "Assurance annulation", value: booking.insurance ? "Incluse" : "Non retenue" },
            {
              label: "Échéancier",
              value:
                booking.instalments > 1
                  ? `${booking.instalments} fois sans frais, ${price(Math.ceil(booking.totalPrice / booking.instalments))} par mois`
                  : "En une fois, à la confirmation",
            },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-navy-500">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-navy-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 pt-4">
          <span className="flex items-center gap-2.5">
            {known && <PaymentLogo id={booking.paymentMethod as PaymentId} />}
            <span>
              <span className="block text-xs uppercase tracking-wide text-navy-500">
                Moyen de paiement choisi
              </span>
              <span className="block text-sm font-bold text-navy-900">
                {paymentLabel(booking.paymentMethod)}
              </span>
            </span>
          </span>
          <span className="text-right">
            <span className="block text-xs uppercase tracking-wide text-navy-500">Total</span>
            <span className="block text-xl font-extrabold text-navy-900">
              {price(booking.totalPrice)}
            </span>
          </span>
        </div>

        <p className="mt-3 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
          Aucun montant n&apos;a été débité. Le règlement par{" "}
          {paymentLabel(booking.paymentMethod).toLowerCase()} n&apos;est déclenché qu&apos;une fois
          le séjour confirmé par nos équipes.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {session && booking.customerId === session.sub ? (
          <Link
            href={`/compte/reservations/${booking.reference}`}
            className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            Suivre ma demande
          </Link>
        ) : (
          <Link
            href="/compte"
            className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            Créer mon espace client pour la suivre
          </Link>
        )}
        <Link
          href="/"
          className="rounded-xl border border-navy-200 px-5 py-3 text-sm font-bold text-navy-800 transition hover:border-navy-400"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

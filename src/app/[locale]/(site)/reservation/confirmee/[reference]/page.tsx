import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { PaymentLogo } from "@/components/ui/BrandLogos";
import { getBankDetails, getBookingConfirmation } from "@/server/catalogue";
import { getCustomerSession } from "@/server/customer-session";
import { PAYMENT_METHODS, paymentLabel, type PaymentId } from "@/lib/constants";
import { dateRange, price } from "@/lib/format";
import { getRequestLocale, getRequestDictionary } from "@/i18n/server";
import { localizedPath } from "@/i18n/config";

/**
 * Étape 3 : la demande est enregistrée.
 *
 * La page est atteinte par redirection après l'envoi du formulaire, et reste
 * consultable ensuite avec la référence. Elle n'affiche donc que ce qu'un client
 * peut relire sans risque ; le dossier détaillé vit dans l'espace client.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const dict = await getRequestDictionary();
  return { title: dict.confirmation.title, robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({
  params,
}: PageProps<"/[locale]/reservation/confirmee/[reference]">) {
  const { reference } = await params;
  const locale = await getRequestLocale();
  const dict = await getRequestDictionary();
  const t = dict.confirmation;
  const booking = await getBookingConfirmation(reference);
  if (!booking) notFound();

  const session = await getCustomerSession();
  const known = PAYMENT_METHODS.some((m) => m.id === booking.paymentMethod);

  // Les coordonnées bancaires ne sont lues que pour un dossier réglé par
  // virement : elles ne vont pas vers une page qui n'a pas à les montrer.
  const banque = booking.paymentMethod === "sepa" ? await getBankDetails() : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-teal-500 text-white">
          <Icon name="check" className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-900">
          {t.title}
        </h1>
        <p className="mt-2 text-sm text-navy-700">
          {t.intro}{" "}
          <strong className="text-navy-900">{booking.customerEmail}</strong>.
        </p>
        <p className="mt-4 inline-block rounded-xl border border-teal-200 bg-white px-4 py-2">
          <span className="text-xs uppercase tracking-wide text-navy-500">{t.yourReference}</span>
          <span className="ml-2 text-lg font-extrabold tracking-wider text-navy-900">
            {booking.reference}
          </span>
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
          {t.summary}
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {[
            { label: t.trip, value: booking.offer?.title ?? t.tripRemoved },
            // Quatrième et dernier endroit imposé par le cahier. Le client
            // repart avec deux numéros : celui de son dossier, en tête de page,
            // et celui de l'offre, qui identifie le produit chez le prestataire.
            {
              label: t.offerReference,
              value: booking.offer?.reference ?? t.notAvailable,
            },
            {
              label: t.destination,
              value: booking.offer
                ? `${booking.offer.destination}, ${booking.offer.country}`
                : t.notSpecified,
            },
            { label: t.travellers, value: String(booking.travellers) },
            { label: t.desiredDates, value: dateRange(booking.departureDate, booking.returnDate) },
            { label: t.insurance, value: booking.insurance ? t.included : t.notSelected },
            {
              label: t.schedule,
              value:
                booking.instalments > 1
                  ? t.instalments
                      .replace("{n}", String(booking.instalments))
                      .replace("{amount}", price(Math.ceil(booking.totalPrice / booking.instalments)))
                  : t.oneOff,
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
                {t.paymentMethod}
              </span>
              <span className="block text-sm font-bold text-navy-900">
                {paymentLabel(booking.paymentMethod)}
              </span>
            </span>
          </span>
          <span className="text-right">
            <span className="block text-xs uppercase tracking-wide text-navy-500">{t.total}</span>
            <span className="block text-xl font-extrabold text-navy-900">
              {price(booking.totalPrice)}
            </span>
          </span>
        </div>

        {/* Coordonnées du virement, montrées au seul client qui l'a choisi et
            sur son propre dossier. La référence est rappelée comme libellé :
            sans elle, un virement arrive sans qu'on sache à quoi le rattacher. */}
        {banque && (
          <div className="mt-4 rounded-xl border border-navy-200 bg-white p-4">
            <h3 className="text-sm font-extrabold text-navy-900">
              {t.bankDetailsTitle}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {banque.holder && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-navy-500">{t.holder}</dt>
                  <dd className="font-semibold text-navy-900">{banque.holder}</dd>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-navy-500">IBAN</dt>
                <dd className="font-mono font-semibold tracking-wide text-navy-900">
                  {banque.iban}
                </dd>
              </div>
              {banque.bic && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-navy-500">BIC</dt>
                  <dd className="font-mono font-semibold tracking-wide text-navy-900">
                    {banque.bic}
                  </dd>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2 border-t border-navy-100 pt-2">
                <dt className="text-navy-500">{t.reference}</dt>
                <dd className="font-semibold text-navy-900">{booking.reference}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-navy-500">{t.bankNote}</p>
          </div>
        )}

        <p className="mt-3 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
          {t.noCharge.replace("{method}", paymentLabel(booking.paymentMethod).toLowerCase())}
        </p>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {session && booking.customerId === session.sub ? (
          <Link
            href={localizedPath(`/compte/reservations/${booking.reference}`, locale)}
            className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            {t.trackRequest}
          </Link>
        ) : (
          <Link
            href={localizedPath("/compte", locale)}
            className="rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            {t.createAccount}
          </Link>
        )}
        <Link
          href={localizedPath("/", locale)}
          className="rounded-xl border border-navy-200 px-5 py-3 text-sm font-bold text-navy-800 transition hover:border-navy-400"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}

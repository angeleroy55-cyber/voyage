import Icon from "@/components/ui/Icon";
import { essentialsFor, NO_COMMITMENT_LINE } from "@/lib/offer-details";
import type { LegalEntity } from "@/server/catalogue";
import type { Offer } from "@/lib/types";

/**
 * « L'essentiel avant de réserver » : ce que les clients demandent par écrit
 * avant de valider (hébergement, vols, bagages, repas, transferts, prix final,
 * entreprise responsable), affiché d'office en haut de la fiche au lieu
 * d'attendre la question. Contenu : src/lib/offer-details.ts (`essentialsFor`)
 * et réglages `legal.*` du back-office pour l'organisateur.
 */
export default function OfferEssentials({
  offer,
  legal,
}: {
  offer: Offer;
  legal: LegalEntity | null;
}) {
  const rows = essentialsFor(offer);

  return (
    <section className="mt-9 rounded-2xl border border-navy-100 bg-white p-5">
      <h2 className="text-lg font-extrabold text-navy-900">L&apos;essentiel avant de réserver</h2>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-teal-50 px-3.5 py-2.5 text-sm font-semibold text-teal-800">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
        {/* Seconde phrase reprise du tunnel de paiement (CheckoutForm) : même
            promesse, mêmes mots, pour ne pas en créer une nouvelle. */}
        {NO_COMMITMENT_LINE} Rien n&apos;est débité aujourd&apos;hui : nous vous recontactons
        d&apos;abord pour confirmer les disponibilités.
      </p>

      <dl className="mt-4 divide-y divide-navy-50">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">{row.label}</dt>
            <dd className="text-sm text-navy-700">{row.value}</dd>
          </div>
        ))}
        {legal && (
          <div className="grid gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-navy-500">
              Organisateur responsable
            </dt>
            <dd className="text-sm text-navy-700">
              <span className="font-semibold text-navy-900">{legal.company}</span>
              {legal.address && `, ${legal.address}`}
              {legal.siret && <>. SIRET {legal.siret}</>}
              {legal.registration && <>. Immatriculation {legal.registration}</>}
              {legal.guarantee && <>. Garantie financière : {legal.guarantee}</>}.
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

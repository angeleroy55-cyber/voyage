import { createBookingByAdmin } from "@/server/actions/bookings";
import { BOOKING_STATUSES, PAYMENT_CHOICES, STATUS_LABELS } from "@/lib/constants";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

const LABEL = "text-xs font-medium uppercase tracking-wide text-navy-500";

/** Date `AAAA-MM-JJ` attendue par `<input type="date">`. */
function isoDay(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

type BookingRow = {
  offerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travellers: number;
  insurance: boolean;
  totalPrice: number;
  paidAmount: number;
  instalments: number;
  paymentMethod: string;
  departureDate: Date | null;
  returnDate: Date | null;
  notes: string;
  status: string;
};

/**
 * Saisie d'un dossier par un conseiller.
 *
 * Le même formulaire sert à la création et à la modification : les règles
 * métier sont identiques, seule l'action serveur change. Le montant est libre,
 * contrairement au parcours public où il est recalculé — un dossier téléphonique
 * peut porter une remise négociée que le catalogue ignore.
 */
export default function BookingForm({
  offers,
  booking,
  action = createBookingByAdmin,
  submitLabel = "Enregistrer la réservation",
}: {
  offers: { id: string; title: string; destination: string; price: number }[];
  booking?: BookingRow;
  action?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={LABEL}>Offre *</span>
        <select name="offerId" required defaultValue={booking?.offerId ?? ""} className={INPUT}>
          <option value="" disabled>
            Choisir une offre du catalogue
          </option>
          {offers.map((offer) => (
            <option key={offer.id} value={offer.id}>
              {offer.destination} — {offer.title} ({offer.price} €/pers.)
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>Nom du client *</span>
        <input name="customerName" required defaultValue={booking?.customerName} className={INPUT} />
      </label>

      <label className="block">
        <span className={LABEL}>E-mail *</span>
        <input
          type="email"
          name="customerEmail"
          required
          defaultValue={booking?.customerEmail}
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Téléphone</span>
        <input name="customerPhone" defaultValue={booking?.customerPhone} className={INPUT} />
      </label>

      <label className="block">
        <span className={LABEL}>Voyageurs</span>
        <input
          type="number"
          name="travellers"
          min={1}
          max={20}
          defaultValue={booking?.travellers ?? 2}
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Départ</span>
        <input
          type="date"
          name="departureDate"
          defaultValue={isoDay(booking?.departureDate)}
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Retour</span>
        <input
          type="date"
          name="returnDate"
          defaultValue={isoDay(booking?.returnDate)}
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Total dû (€) *</span>
        <input
          type="number"
          name="totalPrice"
          min={0}
          required
          defaultValue={booking?.totalPrice ?? 0}
          className={INPUT}
        />
      </label>

      {!booking && (
        <label className="block">
          <span className={LABEL}>Déjà réglé (€)</span>
          <input type="number" name="paidAmount" min={0} defaultValue={0} className={INPUT} />
        </label>
      )}

      <label className="block">
        <span className={LABEL}>Moyen de paiement</span>
        <select name="paymentMethod" defaultValue={booking?.paymentMethod ?? ""} className={INPUT}>
          <option value="">Non précisé</option>
          {PAYMENT_CHOICES.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>Échéancier</span>
        <select name="instalments" defaultValue={String(booking?.instalments ?? 1)} className={INPUT}>
          <option value="1">Comptant</option>
          <option value="4">4× sans frais</option>
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>Statut</span>
        <select name="status" defaultValue={booking?.status ?? "pending"} className={INPUT}>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-end gap-2 pb-2 text-sm text-navy-700">
        <input
          type="checkbox"
          name="insurance"
          defaultChecked={booking?.insurance}
          className="size-4 rounded accent-gold-500"
        />
        Assurance annulation
      </label>

      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={LABEL}>Note interne</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={booking?.notes}
          placeholder="Conditions négociées, rappel à passer…"
          className={INPUT}
        />
      </label>

      <button className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-span-2 sm:justify-self-end lg:col-span-3">
        {submitLabel}
      </button>
    </form>
  );
}

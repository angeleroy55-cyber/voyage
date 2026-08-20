"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import { PaymentLogo } from "@/components/ui/BrandLogos";
import { createBooking, type FormState } from "@/server/actions/public";
import { PAYMENT_CHOICES } from "@/lib/constants";
import { price } from "@/lib/format";
import type { Offer } from "@/lib/types";

const INITIAL: FormState = { ok: false, message: "" };

type Prefill = { name: string; email: string; phone: string };

/**
 * Coordonnées et paiement, dernière étape avant l'enregistrement de la demande.
 *
 * Le moyen de paiement et l'échéancier sont deux choix distincts : le premier
 * dit par quel canal le règlement passera, le second en combien de fois. C'est
 * la découpe du modèle (`paymentMethod` et `instalments`), et elle évite d'avoir
 * à proposer « carte » et « carte en 4× » comme deux moyens différents.
 */
export default function CheckoutForm({
  offer,
  travellers,
  insurance,
  departureDate,
  returnDate,
  customer,
}: {
  offer: Offer;
  travellers: number;
  insurance: boolean;
  departureDate: string;
  returnDate: string;
  customer: Prefill | null;
}) {
  const [state, formAction] = useActionState(createBooking, INITIAL);
  const [method, setMethod] = useState<string>("");
  const [instalments, setInstalments] = useState(1);

  const insurancePerPerson = Math.round(offer.price * 0.06);
  const total = useMemo(
    () => travellers * (offer.price + (insurance ? insurancePerPerson : 0)),
    [travellers, insurance, offer.price, insurancePerPerson],
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="offerSlug" value={offer.slug} />
      <input type="hidden" name="travellers" value={travellers} />
      <input type="hidden" name="insurance" value={insurance ? "on" : ""} />
      <input type="hidden" name="departureDate" value={departureDate} />
      <input type="hidden" name="returnDate" value={returnDate} />

      <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
          <span className="grid size-6 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
            1
          </span>
          Vos coordonnées
        </h2>
        {customer && (
          <p className="mt-1.5 text-xs text-teal-700">
            Champs pré-remplis depuis votre compte. Vous pouvez les modifier pour ce séjour.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Nom et prénom
            </span>
            <input
              name="customerName"
              required
              autoComplete="name"
              defaultValue={customer?.name ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Adresse e-mail
            </span>
            <input
              type="email"
              name="customerEmail"
              required
              autoComplete="email"
              defaultValue={customer?.email ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Téléphone <span className="normal-case text-navy-400">(facultatif)</span>
            </span>
            <input
              name="customerPhone"
              autoComplete="tel"
              defaultValue={customer?.phone ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Précisions pour le conseiller{" "}
              <span className="normal-case text-navy-400">(facultatif)</span>
            </span>
            <textarea
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Chambres souhaitées, régime alimentaire, horaires de vol préférés…"
              className={`${FIELD} resize-y`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
          <span className="grid size-6 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
            2
          </span>
          Moyen de paiement
        </h2>
        <p className="mt-1.5 text-sm text-navy-600">
          Choisissez comment vous souhaitez régler. Rien n&apos;est débité aujourd&apos;hui : nous
          vous recontactons d&apos;abord pour confirmer les disponibilités.
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Moyen de paiement souhaité</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PAYMENT_CHOICES.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                  method === m.id
                    ? "border-gold-400 bg-gold-50 ring-1 ring-gold-400"
                    : "border-navy-200 hover:border-navy-400"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  required
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="size-4 shrink-0 accent-gold-500"
                />
                <PaymentLogo id={m.id} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-navy-900">{m.label}</span>
                  <span className="block text-xs text-navy-500">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5 border-t border-navy-100 pt-4">
          <legend className="text-xs font-medium uppercase tracking-wide text-navy-500">
            Échéancier
          </legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {[
              { value: 1, label: "En une fois", detail: `${price(total)} à la confirmation` },
              {
                value: 4,
                label: "En 4× sans frais",
                detail: `${price(Math.ceil(total / 4))} par mois`,
              },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                  instalments === option.value
                    ? "border-gold-400 bg-gold-50 ring-1 ring-gold-400"
                    : "border-navy-200 hover:border-navy-400"
                }`}
              >
                <input
                  type="radio"
                  name="instalments"
                  value={option.value}
                  checked={instalments === option.value}
                  onChange={() => setInstalments(option.value)}
                  className="size-4 shrink-0 accent-gold-500"
                />
                {option.value === 4 && <PaymentLogo id="instalments" />}
                <span>
                  <span className="block text-sm font-bold text-navy-900">{option.label}</span>
                  <span className="block text-xs text-navy-500">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
          <span className="grid size-6 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
            3
          </span>
          Récapitulatif
        </h2>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-navy-600">
            <dt>
              {price(offer.price)} × {travellers} voyageur{travellers > 1 ? "s" : ""}
            </dt>
            <dd>{price(offer.price * travellers)}</dd>
          </div>
          {insurance && (
            <div className="flex justify-between text-navy-600">
              <dt>Assurance annulation × {travellers}</dt>
              <dd>{price(insurancePerPerson * travellers)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-extrabold text-navy-900">
            <dt>Total</dt>
            <dd>{price(total)}</dd>
          </div>
          <div className="flex justify-between text-navy-600">
            <dt>À régler aujourd&apos;hui</dt>
            <dd className="font-semibold text-teal-700">0 €</dd>
          </div>
        </dl>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-navy-50 p-3.5">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
          />
          <span className="text-sm text-navy-700">
            J&apos;accepte les conditions de vente et la politique de confidentialité, et j&apos;auto&shy;rise
            GoSéjour à me recontacter au sujet de cette demande.
          </span>
        </label>

        <SubmitButton />

        {state.message && !state.ok && (
          <p
            role="alert"
            className="animate-fade-up mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            <Icon name="close" className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <p className="mt-3 text-center text-xs text-navy-500">
          Demande sans engagement. Annulation gratuite jusqu&apos;à 30 jours avant le départ.
        </p>
      </section>
    </form>
  );
}

const FIELD =
  "mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-xl bg-gold-400 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : "Valider ma demande"}
    </button>
  );
}

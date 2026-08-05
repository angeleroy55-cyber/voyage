"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import { createBooking, type FormState } from "@/server/actions/public";
import { discount, durationLabel, price } from "@/lib/format";
import type { Offer } from "@/lib/types";

const INITIAL: FormState = { ok: false, message: "" };

export default function BookingBox({ offer }: { offer: Offer }) {
  const [travellers, setTravellers] = useState(2);
  const [insurance, setInsurance] = useState(false);
  const [state, formAction] = useActionState(createBooking, INITIAL);

  const off = discount(offer.price, offer.oldPrice);
  const insurancePerPerson = Math.round(offer.price * 0.06);

  // Total affiché à titre indicatif : le montant qui fait foi est recalculé par
  // l'action serveur, à partir du prix en base.
  const total = useMemo(
    () => travellers * (offer.price + (insurance ? insurancePerPerson : 0)),
    [travellers, insurance, offer.price, insurancePerPerson],
  );

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <form action={formAction} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
        <input type="hidden" name="offerSlug" value={offer.slug} />
        <input type="hidden" name="travellers" value={travellers} />

        {off && (
          <span className="inline-block rounded-md bg-gold-400 px-2 py-1 text-xs font-bold text-navy-900">
            −{off} % pour une durée limitée
          </span>
        )}

        <div className="mt-3 flex items-end gap-2">
          {offer.oldPrice && (
            <span className="text-base text-navy-400 line-through">{price(offer.oldPrice)}</span>
          )}
          <span className="text-3xl font-extrabold text-navy-900">{price(offer.price)}</span>
          <span className="pb-1 text-sm text-navy-500">/ pers.</span>
        </div>
        <p className="mt-0.5 text-xs text-navy-500">
          {durationLabel(offer.nights, offer.category)} · {offer.board} · taxes incluses
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-navy-200 px-3.5 py-3">
          <span className="text-sm font-semibold text-navy-800">Voyageurs</span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTravellers((t) => Math.max(1, t - 1))}
              disabled={travellers <= 1}
              aria-label="Retirer un voyageur"
              className="size-8 rounded-full border border-navy-200 text-lg leading-none text-navy-700 transition hover:border-navy-400 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-5 text-center font-bold tabular-nums">{travellers}</span>
            <button
              type="button"
              onClick={() => setTravellers((t) => Math.min(9, t + 1))}
              disabled={travellers >= 9}
              aria-label="Ajouter un voyageur"
              className="size-8 rounded-full border border-navy-200 text-lg leading-none text-navy-700 transition hover:border-navy-400 disabled:opacity-40"
            >
              +
            </button>
          </span>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-navy-50 p-3.5">
          <input
            type="checkbox"
            name="insurance"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
          />
          <span className="text-sm text-navy-700">
            <span className="font-semibold text-navy-900">Assurance annulation</span> — remboursement
            en cas d&apos;imprévu, {price(insurancePerPerson)} par personne.
          </span>
        </label>

        <div className="mt-4 space-y-2 border-t border-navy-100 pt-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Nom et prénom
            </span>
            <input
              name="customerName"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
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
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Téléphone <span className="normal-case text-navy-400">(facultatif)</span>
            </span>
            <input
              name="customerPhone"
              autoComplete="tel"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
            />
          </label>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-navy-100 pt-4 text-sm">
          <div className="flex justify-between text-navy-600">
            <span>
              {price(offer.price)} × {travellers}
            </span>
            <span>{price(offer.price * travellers)}</span>
          </div>
          {insurance && (
            <div className="flex justify-between text-navy-600">
              <span>Assurance × {travellers}</span>
              <span>{price(insurancePerPerson * travellers)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 text-base font-extrabold text-navy-900">
            <span>Total</span>
            <span>{price(total)}</span>
          </div>
          <p className="text-xs text-navy-500">ou {price(Math.ceil(total / 4))} × 4 sans frais</p>
        </div>

        <SubmitButton />

        {state.message && (
          <p
            role="status"
            className={`animate-fade-up mt-3 flex items-start gap-2 rounded-xl p-3 text-sm ${
              state.ok ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-700"
            }`}
          >
            <Icon name={state.ok ? "check" : "close"} className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <ul className="mt-4 space-y-2 text-xs text-navy-600">
          {[
            { icon: "check", text: "Annulation gratuite jusqu'à 30 jours avant le départ" },
            { icon: "shield", text: "Demande sans engagement, aucun paiement en ligne" },
            { icon: "headset", text: "Assistance francophone 24 h/24 pendant le voyage" },
          ].map((l) => (
            <li key={l.text} className="flex items-start gap-2">
              <Icon name={l.icon} className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
              {l.text}
            </li>
          ))}
        </ul>
      </form>

      <p className="mt-3 text-center text-xs text-navy-500">
        Besoin d&apos;un conseil ? Appelez-nous, un spécialiste {offer.destination} vous répond.
      </p>
    </aside>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-xl bg-gold-400 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 disabled:opacity-60"
    >
      {pending ? "Envoi en cours…" : "Demander cette offre"}
    </button>
  );
}

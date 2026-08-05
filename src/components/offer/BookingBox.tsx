"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { discount, durationLabel, price } from "@/lib/format";
import type { Offer } from "@/lib/types";

export default function BookingBox({ offer }: { offer: Offer }) {
  const [travellers, setTravellers] = useState(2);
  const [insurance, setInsurance] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const off = discount(offer.price, offer.oldPrice);
  const insurancePerPerson = Math.round(offer.price * 0.06);

  const total = useMemo(
    () => travellers * (offer.price + (insurance ? insurancePerPerson : 0)),
    [travellers, insurance, offer.price, insurancePerPerson],
  );

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
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
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
          />
          <span className="text-sm text-navy-700">
            <span className="font-semibold text-navy-900">Assurance annulation</span> — remboursement
            en cas d&apos;imprévu, {price(insurancePerPerson)} par personne.
          </span>
        </label>

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
          <p className="text-xs text-navy-500">
            ou {price(Math.ceil(total / 4))} × 4 sans frais
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmed(true)}
          className="mt-4 w-full rounded-xl bg-gold-400 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500"
        >
          Réserver
        </button>

        {confirmed && (
          <p className="animate-fade-up mt-3 flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-sm text-teal-700">
            <Icon name="check" className="mt-0.5 size-4 shrink-0" />
            Maquette de démonstration : aucun paiement n&apos;est réellement effectué. Votre
            sélection ({travellers} voyageur{travellers > 1 ? "s" : ""}, {price(total)}) est bien
            prise en compte.
          </p>
        )}

        <ul className="mt-4 space-y-2 text-xs text-navy-600">
          {[
            { icon: "check", text: "Annulation gratuite jusqu'à 30 jours avant le départ" },
            { icon: "shield", text: "Paiement sécurisé, aucun frais de dossier" },
            { icon: "headset", text: "Assistance francophone 24 h/24 pendant le voyage" },
          ].map((l) => (
            <li key={l.text} className="flex items-start gap-2">
              <Icon name={l.icon} className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
              {l.text}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-center text-xs text-navy-500">
        Besoin d&apos;un conseil ? Appelez-nous, un spécialiste {offer.destination} vous répond.
      </p>
    </aside>
  );
}

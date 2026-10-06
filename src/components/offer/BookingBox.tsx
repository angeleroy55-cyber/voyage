"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { discount, durationLabel, price } from "@/lib/format";
import type { Offer } from "@/lib/types";

/**
 * Première étape de la réservation, sur la fiche offre.
 *
 * L'encart ne fait que composer le séjour (nombre de voyageurs, assurance) puis
 * passe la main à `/reservation/[slug]`, où sont saisies les coordonnées et
 * choisi le moyen de paiement. Le formulaire part donc en `GET` : les choix
 * voyagent dans l'URL, ce qui rend l'étape suivante partageable, rechargeable
 * et accessible au bouton « précédent » sans réenvoi de formulaire.
 */
/** Catégories où le départ se négocie par date libre, en devis. */
const QUOTE_CATEGORIES = new Set(["sejours", "circuits", "croisieres"]);

/** Jour civil local au format `AAAA-MM-JJ`, décalé de `days` jours. */
function isoDayFrom(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export default function BookingBox({
  offer,
  departureDate = "",
  returnDate = "",
}: {
  offer: Offer;
  departureDate?: string;
  returnDate?: string;
}) {
  const [travellers, setTravellers] = useState(2);
  const [insurance, setInsurance] = useState(false);

  // Séjours, circuits et croisières : le client choisit sa propre date de
  // départ plutôt que de rester figé sur l'unique date du catalogue. La date
  // de retour suit automatiquement, à la durée réelle de la formule — aucun
  // prix par date n'est inventé, le montant affiché reste celui du catalogue,
  // confirmé ensuite dans le devis.
  const quoteFlow = QUOTE_CATEGORIES.has(offer.category);
  const todayIso = isoDayFrom(new Date(), 0);
  const [pickedDeparture, setPickedDeparture] = useState(departureDate || "");
  const pickedReturn = pickedDeparture
    ? isoDayFrom(new Date(`${pickedDeparture}T12:00:00`), Math.max(offer.nights, 1))
    : "";

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
      <form
        method="get"
        action={`/reservation/${offer.slug}`}
        className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card"
      >
        <input type="hidden" name="voyageurs" value={travellers} />
        {!quoteFlow && departureDate && <input type="hidden" name="du" value={departureDate} />}
        {!quoteFlow && returnDate && <input type="hidden" name="au" value={returnDate} />}
        {quoteFlow && pickedDeparture && <input type="hidden" name="du" value={pickedDeparture} />}
        {quoteFlow && pickedReturn && <input type="hidden" name="au" value={pickedReturn} />}

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

        {quoteFlow && (
          <div className="mt-4 rounded-xl border border-navy-200 p-3.5">
            <label className="block text-sm font-semibold text-navy-800" htmlFor="booking-departure">
              Date de départ souhaitée
            </label>
            <input
              id="booking-departure"
              type="date"
              name="du-visible"
              min={todayIso}
              value={pickedDeparture}
              onChange={(e) => setPickedDeparture(e.target.value)}
              className="mt-2 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
            />
            <p className="mt-2 text-xs text-navy-500">
              {pickedReturn
                ? `Retour estimé le ${new Date(`${pickedReturn}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}, pour ${durationLabel(offer.nights, offer.category)}.`
                : "Le retour se calcule automatiquement à partir de la durée de la formule."}
              {" "}Prix indicatif ci-dessus : le tarif définitif pour ces dates est confirmé dans le devis.
            </p>
          </div>
        )}

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
            name="assurance"
            value="1"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
          />
          <span className="text-sm text-navy-700">
            <span className="font-semibold text-navy-900">Assurance annulation</span> : remboursement
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
          <p className="text-xs text-navy-500">ou {price(Math.ceil(total / 4))} × 4 sans frais</p>
        </div>

        <button
          type="submit"
          disabled={quoteFlow && !pickedDeparture}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-3.5 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {quoteFlow ? "Demander un devis" : "Demander cette offre"}
          <Icon name="chevronRight" className="size-4" />
        </button>
        <p className="mt-2 text-center text-xs text-navy-500">
          {quoteFlow
            ? "Étape suivante : vos coordonnées, pour recevoir votre devis par e-mail."
            : "Étape suivante : vos coordonnées et le moyen de paiement."}
        </p>

        <ul className="mt-4 space-y-2 text-xs text-navy-600">
          {[
            { icon: "check", text: "Annulation gratuite jusqu'à 30 jours avant le départ" },
            { icon: "shield", text: "Aucun débit maintenant : le règlement suit la confirmation" },
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

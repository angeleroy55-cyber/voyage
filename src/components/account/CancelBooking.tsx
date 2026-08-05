"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { requestCancellation, type FormState } from "@/server/actions/account";

const INITIAL: FormState = { ok: false, message: "" };

/**
 * Demande d'annulation, confirmée dans une modale.
 *
 * L'action serveur revérifie la propriété du dossier et son état : ce
 * composant ne fait que recueillir le motif et afficher le retour.
 */
export default function CancelBooking({
  reference,
  freeUntil,
}: {
  reference: string;
  /** Date limite d'annulation sans frais, déjà formatée. */
  freeUntil: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(requestCancellation, INITIAL);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:border-red-300 hover:text-red-700"
      >
        Demander l&apos;annulation
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Annuler cette réservation"
        description={`Dossier ${reference}. Annulation sans frais jusqu'au ${freeUntil}.`}
        size="md"
        sheetOnMobile
      >
        {state.ok ? (
          <p className="animate-fade-up flex items-start gap-2.5 rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
            <Icon name="check" className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="reference" value={reference} />

            <div className="rounded-xl bg-gold-50 p-3.5 text-sm leading-relaxed text-navy-700">
              <p className="font-semibold text-navy-900">Avant de confirmer</p>
              <p className="mt-1">
                Les sommes déjà réglées sont remboursées sous 14 jours sur le moyen de paiement
                d&apos;origine. Passée la date d&apos;annulation gratuite, les conditions du
                prestataire s&apos;appliquent.
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Motif (facultatif)
              </span>
              <textarea
                name="reason"
                rows={3}
                placeholder="Changement de dates, imprévu personnel…"
                className="mt-1 w-full resize-none rounded-xl border border-navy-200 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
              />
            </label>

            {state.message && !state.ok && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {state.message}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
              >
                Conserver ma réservation
              </button>
              <SubmitButton />
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Confirmer l'annulation"}
    </button>
  );
}

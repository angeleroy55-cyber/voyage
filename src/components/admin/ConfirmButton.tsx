"use client";

import { useId, useState } from "react";
import Modal from "@/components/ui/Modal";

type Props = {
  /** Action serveur déjà liée à son identifiant via `.bind()`. */
  action: () => Promise<void>;
  label: string;
  title: string;
  /** Ce que l'action va réellement faire, à la première personne du pluriel. */
  description: string;
  confirmLabel?: string;
  /**
   * Mot à retaper pour débloquer le bouton. Réservé aux actions sans retour
   * possible : une confirmation qu'on peut valider par réflexe n'en est pas une.
   */
  confirmWord?: string;
  tone?: "danger" | "neutral";
  className?: string;
};

/**
 * Bouton d'action destructive : rien ne part en base tant que la fenêtre n'a pas
 * été confirmée, et la fenêtre nomme toujours l'objet visé plutôt que de
 * demander « Confirmer ? » dans le vide.
 */
export default function ConfirmButton({
  action,
  label,
  title,
  description,
  confirmLabel = "Confirmer",
  confirmWord,
  tone = "danger",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const fieldId = useId();

  const locked = Boolean(confirmWord) && typed.trim() !== confirmWord;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
        className={
          className ||
          (tone === "danger"
            ? "text-xs font-semibold text-red-600 hover:underline"
            : "text-xs font-semibold text-navy-600 hover:underline")
        }
      >
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title} size="sm">
        <p className="text-sm leading-relaxed text-navy-600">{description}</p>

        {confirmWord && (
          <label htmlFor={fieldId} className="mt-4 block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Retapez «&nbsp;{confirmWord}&nbsp;» pour confirmer
            </span>
            <input
              id={fieldId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
            />
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
          >
            Annuler
          </button>
          <form action={action}>
            <button
              type="submit"
              disabled={locked}
              className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                tone === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-navy-800 hover:bg-navy-900"
              }`}
            >
              {confirmLabel}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}

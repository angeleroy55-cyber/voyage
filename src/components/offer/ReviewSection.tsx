"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import { submitReview, type FormState } from "@/server/actions/public";
import type { Review } from "@/lib/types";

const INITIAL: FormState = { ok: false, message: "" };

/**
 * Avis publiés d'une offre, suivis du formulaire de dépôt.
 *
 * Un avis envoyé ici part au statut « en attente » : il n'apparaît qu'une fois
 * validé depuis le back-office, d'où le message affiché après envoi.
 */
export default function ReviewSection({
  offerSlug,
  offerTitle,
  reviews,
}: {
  offerSlug: string;
  offerTitle: string;
  reviews: Review[];
}) {
  const [state, formAction] = useActionState(submitReview, INITIAL);
  const [open, setOpen] = useState(false);

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-12 border-t border-navy-100 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy-900">
            Avis des voyageurs
          </h2>
          <p className="mt-1 text-sm text-navy-600">
            {reviews.length === 0
              ? "Aucun avis publié pour le moment : soyez le premier."
              : `${reviews.length} avis publié${reviews.length > 1 ? "s" : ""}${
                  average ? ` · note moyenne ${average.replace(".", ",")}/10` : ""
                }.`}
          </p>
        </div>
        {!open && !state.ok && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-bold text-navy-800 transition hover:border-navy-400"
          >
            Donner mon avis
          </button>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <li
              key={`${review.author}-${review.date}`}
              className="rounded-2xl border border-navy-100 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className={`size-4 ${
                        i < Math.round(review.score / 2)
                          ? "fill-amber-400 text-amber-400"
                          : "text-navy-200"
                      }`}
                    />
                  ))}
                </span>
                <span className="rounded-lg bg-navy-700 px-2 py-1 text-xs font-bold text-white tabular-nums">
                  {review.score.toFixed(1).replace(".", ",")}
                </span>
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-navy-700">
                « {review.text} »
              </blockquote>
              <p className="mt-3 border-t border-navy-100 pt-3 text-xs text-navy-500">
                <span className="font-bold text-navy-900">{review.author}</span>
                {review.city && `, ${review.city}`} · {review.date}
              </p>
            </li>
          ))}
        </ul>
      )}

      {state.ok ? (
        <p className="animate-fade-up mt-5 flex items-start gap-2 rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
          <Icon name="check" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      ) : (
        open && (
          <form
            action={formAction}
            className="animate-fade-up mt-5 rounded-2xl border border-navy-100 bg-navy-50/60 p-5"
          >
            <input type="hidden" name="offerSlug" value={offerSlug} />
            <input type="hidden" name="trip" value={offerTitle} />

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Votre nom *
                </span>
                <input name="author" required minLength={2} className={INPUT} />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Ville
                </span>
                <input name="city" className={INPUT} />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                  Note sur 10 *
                </span>
                <input
                  type="number"
                  name="score"
                  required
                  min={0}
                  max={10}
                  step={0.5}
                  defaultValue={9}
                  className={INPUT}
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Votre avis *
              </span>
              <textarea
                name="text"
                required
                minLength={20}
                rows={4}
                placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…"
                className={INPUT}
              />
            </label>

            {state.message && !state.ok && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {state.message}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SubmitButton />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-navy-600 hover:text-navy-900"
              >
                Annuler
              </button>
              <span className="text-xs text-navy-500">
                Publié après relecture par notre équipe.
              </span>
            </div>
          </form>
        )
      )}
    </section>
  );
}

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-400";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-500 disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Envoyer mon avis"}
    </button>
  );
}

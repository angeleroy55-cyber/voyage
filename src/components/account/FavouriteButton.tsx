"use client";

import { useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { toggleFavourite } from "@/server/actions/account";

/**
 * Bouton « mettre de côté ».
 *
 * L'état bascule immédiatement pour que le clic soit ressenti, puis se recale
 * sur la réponse du serveur : si l'écriture échoue, le cœur revient à son état
 * réel plutôt que de mentir.
 */
export default function FavouriteButton({
  slug,
  initial = false,
  variant = "icon",
}: {
  slug: string;
  initial?: boolean;
  variant?: "icon" | "inline";
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function click() {
    const optimistic = !on;
    setOn(optimistic);
    startTransition(async () => {
      const result = await toggleFavourite(slug);
      setOn(result.favourite);
    });
  }

  const label = on ? "Retirer des favoris" : "Ajouter aux favoris";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={click}
        disabled={pending}
        aria-pressed={on}
        className="flex items-center gap-2 rounded-xl border border-navy-200 px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:border-navy-400 disabled:opacity-60"
      >
        <Icon
          name="heart"
          className={`size-4 transition ${on ? "fill-red-500 text-red-500" : "text-navy-400"}`}
        />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={pending}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full bg-white/95 text-navy-600 shadow-card backdrop-blur transition duration-200 hover:scale-110 hover:text-red-600 disabled:opacity-60"
    >
      <Icon
        name="heart"
        className={`size-4.5 transition ${on ? "fill-red-500 text-red-500" : ""}`}
      />
    </button>
  );
}

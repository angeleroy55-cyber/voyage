"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const INTERESTS = ["Plage & soleil", "Croisières", "Circuits", "Week-ends", "Famille", "Longue distance"];

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>(["Plage & soleil"]);
  const [sent, setSent] = useState(false);

  function toggle(tag: string) {
    setPicked((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));
  }

  return (
    <section className="mx-auto max-w-page px-4">
      <div className="overflow-hidden rounded-2xl bg-navy-800 px-6 py-10 text-white sm:px-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-300">
              <Icon name="mail" className="size-4" />
              Alertes bons plans
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
              Recevez les baisses de prix sur ce qui vous intéresse
            </h2>
            <p className="mt-2 text-sm text-navy-100">
              Un e-mail par semaine, uniquement sur les thèmes que vous cochez. Désinscription en un
              clic, sans question.
            </p>
          </div>

          <div>
            {sent ? (
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-5">
                <Icon name="check" className="mt-0.5 size-5 shrink-0 text-teal-400" />
                <p className="text-sm">
                  C&apos;est noté pour <strong>{email}</strong>. Vous recevrez les alertes sur&nbsp;:{" "}
                  {picked.length ? picked.join(", ").toLowerCase() : "toutes nos offres"}.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    aria-label="Votre adresse e-mail"
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-navy-200 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gold-400 px-6 py-3 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500"
                  >
                    Je m&apos;inscris
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {INTERESTS.map((tag) => {
                    const on = picked.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggle(tag)}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          on
                            ? "border-gold-400 bg-gold-400 text-navy-900"
                            : "border-white/25 text-navy-100 hover:border-white/60"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-navy-200">
                  En vous inscrivant, vous acceptez notre politique de confidentialité.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

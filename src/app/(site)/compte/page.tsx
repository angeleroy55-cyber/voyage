import Link from "next/link";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Connexion" };

export default function AccountPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Connectez-vous à votre espace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Retrouvez vos réservations, vos documents de voyage et vos recherches enregistrées.
          L&apos;espace client permet aussi de modifier vos coordonnées avant le départ.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            "Vos bons d'échange disponibles à tout moment",
            "Alertes prix sur les destinations suivies",
            "Historique de vos voyages et factures",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-sm text-navy-700">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-teal-500" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
        <form className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">E-mail</span>
            <input
              type="email"
              placeholder="votre@email.fr"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Mot de passe
            </span>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
            />
          </label>
          <button
            type="button"
            className="w-full rounded-xl bg-gold-400 py-3 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-navy-600">
          Pas encore de compte&nbsp;?{" "}
          <Link href="/aide" className="font-semibold text-gold-700 hover:underline">
            Créer un compte
          </Link>
        </p>
        <p className="mt-4 border-t border-navy-100 pt-4 text-xs text-navy-500">
          Formulaire de démonstration : aucune donnée n&apos;est envoyée ni enregistrée.
        </p>
      </div>
    </div>
  );
}

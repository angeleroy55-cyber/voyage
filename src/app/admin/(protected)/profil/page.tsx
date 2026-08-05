import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { changeOwnPassword, updateOwnProfile } from "@/server/actions/team";

export const metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400";

const ERRORS: Record<string, string> = {
  actuel: "Le mot de passe actuel est incorrect.",
  court: "Le nouveau mot de passe doit faire au moins 10 caractères.",
  confirmation: "Les deux nouveaux mots de passe ne correspondent pas.",
};

export default async function ProfilePage({ searchParams }: PageProps<"/admin/profil">) {
  const session = await requireSession();
  const sp = await searchParams;

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  const error = typeof sp.erreur === "string" ? ERRORS[sp.erreur] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Mon profil</h1>
      <p className="mt-1 text-sm text-navy-600">
        Connecté en tant que {session.email} —{" "}
        {session.role === "owner" ? "administrateur principal" : "éditeur"}.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {sp.enregistre && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          Profil enregistré.
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Identité</h2>
        <form action={updateOwnProfile} className="mt-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Nom affiché
            </span>
            <input name="name" defaultValue={user?.name ?? ""} className={INPUT} />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Adresse e-mail
            </span>
            <input
              value={session.email}
              readOnly
              disabled
              className={`${INPUT} bg-navy-50 text-navy-500`}
            />
            <span className="mt-1 block text-xs text-navy-400">
              L&apos;adresse sert d&apos;identifiant de connexion : seul un administrateur principal
              peut la changer, depuis la page Équipe.
            </span>
          </label>
          <button
            type="submit"
            className="mt-4 rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-900"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Changer mon mot de passe</h2>
        <p className="mt-1 text-sm text-navy-600">
          Par sécurité, vous serez déconnecté après le changement et devrez vous reconnecter.
        </p>
        <form action={changeOwnPassword} className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Mot de passe actuel
            </span>
            <input
              type="password"
              name="current"
              required
              autoComplete="current-password"
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              name="next"
              required
              minLength={10}
              autoComplete="new-password"
              className={INPUT}
            />
            <span className="mt-1 block text-xs text-navy-400">10 caractères minimum.</span>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Confirmer le nouveau mot de passe
            </span>
            <input
              type="password"
              name="confirm"
              required
              minLength={10}
              autoComplete="new-password"
              className={INPUT}
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500"
          >
            Changer le mot de passe
          </button>
        </form>
      </section>
    </div>
  );
}

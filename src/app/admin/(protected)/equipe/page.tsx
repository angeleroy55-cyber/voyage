import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import {
  createAdmin,
  deleteAdmin,
  resetAdminPassword,
  setAdminActive,
  setAdminRole,
} from "@/server/actions/team";

export const metadata = { title: "Équipe" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

const ERRORS: Record<string, string> = {
  droits: "Seul un administrateur principal peut gérer l'équipe.",
  email: "Cette adresse e-mail n'est pas valide.",
  motdepasse: "Le mot de passe doit faire au moins 10 caractères.",
  doublon: "Un compte existe déjà avec cette adresse.",
  dernier: "Impossible : il doit rester au moins un administrateur principal actif.",
  soi: "Vous ne pouvez pas désactiver ou supprimer votre propre compte.",
};

export default async function TeamPage({ searchParams }: PageProps<"/admin/equipe">) {
  const session = await requireSession();
  const sp = await searchParams;
  const isOwner = session.role === "owner";

  const members = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  const error = typeof sp.erreur === "string" ? ERRORS[sp.erreur] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Équipe</h1>
      <p className="mt-1 text-sm text-navy-600">
        Deux rôles : <strong>principal</strong> (accès complet, gère l&apos;équipe) et{" "}
        <strong>éditeur</strong> (gère le catalogue, pas les comptes).
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {(sp.cree || sp.supprime || sp.motdepasse) && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {sp.cree
            ? "Compte créé."
            : sp.supprime
              ? "Compte supprimé."
              : "Mot de passe réinitialisé."}
        </p>
      )}

      {!isOwner && (
        <p className="mt-4 rounded-xl bg-gold-50 px-4 py-3 text-sm text-navy-700">
          Votre rôle est « éditeur » : cette page est en lecture seule. Vous pouvez changer votre
          propre mot de passe depuis la page Profil.
        </p>
      )}

      {isOwner && (
        <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Ajouter un membre</h2>
          <form action={createAdmin} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Nom
              </span>
              <input name="name" placeholder="Camille Dubois" className={INPUT} />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Adresse e-mail *
              </span>
              <input type="email" name="email" required className={INPUT} />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Mot de passe provisoire *
              </span>
              <input
                name="password"
                required
                minLength={10}
                className={INPUT}
                placeholder="10 caractères minimum"
              />
              <span className="mt-1 block text-xs text-navy-400">
                À communiquer au membre, qui le changera depuis sa page Profil.
              </span>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Rôle
              </span>
              <select name="role" defaultValue="editor" className={INPUT}>
                <option value="editor">Éditeur</option>
                <option value="owner">Administrateur principal</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-start-2"
            >
              Créer le compte
            </button>
          </form>
        </section>
      )}

      <ul className="mt-5 space-y-3">
        {members.map((member) => {
          const isSelf = member.id === session.sub;
          return (
            <li
              key={member.id}
              className={`rounded-2xl border bg-white p-5 ${
                member.active ? "border-navy-100" : "border-navy-200 bg-navy-50/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy-900">
                    {member.name || member.email}
                    {isSelf && (
                      <span className="ml-2 rounded bg-navy-100 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600">
                        vous
                      </span>
                    )}
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                        member.role === "owner"
                          ? "bg-gold-100 text-gold-700"
                          : "bg-navy-100 text-navy-600"
                      }`}
                    >
                      {member.role === "owner" ? "Principal" : "Éditeur"}
                    </span>
                    {!member.active && (
                      <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
                        Désactivé
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy-500">{member.email}</p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    {member.lastLoginAt
                      ? `Dernière connexion le ${member.lastLoginAt.toLocaleDateString("fr-FR")}`
                      : "Jamais connecté"}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-navy-100 pt-4">
                  <form action={setAdminRole.bind(null, member.id, member.role === "owner" ? "editor" : "owner")}>
                    <button className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400">
                      {member.role === "owner" ? "Passer éditeur" : "Passer principal"}
                    </button>
                  </form>

                  <form action={setAdminActive.bind(null, member.id, !member.active)}>
                    <button
                      disabled={isSelf && member.active}
                      className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400 disabled:opacity-40"
                    >
                      {member.active ? "Désactiver" : "Réactiver"}
                    </button>
                  </form>

                  <form
                    action={resetAdminPassword.bind(null, member.id)}
                    className="flex items-end gap-2"
                  >
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                        Nouveau mot de passe
                      </span>
                      <input
                        name="password"
                        required
                        minLength={10}
                        className="mt-1 w-48 rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
                      />
                    </label>
                    <button className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400">
                      Réinitialiser
                    </button>
                  </form>

                  {!isSelf && (
                    <form action={deleteAdmin.bind(null, member.id)} className="ml-auto">
                      <button className="rounded-lg border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                        Supprimer
                      </button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

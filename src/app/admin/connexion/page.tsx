import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { verifyPassword } from "@/server/auth";
import { getSession, openSession } from "@/server/session";

export const metadata = { title: "Connexion au back-office" };

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Message identique dans tous les cas d'échec : distinguer « compte inconnu »
  // de « mot de passe faux » permettrait d'énumérer les adresses valides.
  const failure = "/admin/connexion?erreur=1";
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    redirect(failure);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await openSession(user);
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/connexion">) {
  if (await getSession()) redirect("/admin");
  const { erreur } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Image
            src="/brand/logo-full.png"
            alt="GoSéjour"
            width={190}
            height={275}
            priority
            className="h-auto w-40 rounded-2xl"
          />
          <p className="mt-5 text-sm text-navy-200">Back-office</p>
        </div>

        <form
          action={signIn}
          className="mt-6 rounded-2xl bg-white p-6 shadow-pop"
        >
          {erreur && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              Identifiants incorrects.
            </p>
          )}

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Adresse e-mail
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Mot de passe
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
            />
          </label>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-gold-400 py-3 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-navy-300">
          Accès réservé à l&apos;équipe GoSéjour.
        </p>
      </div>
    </div>
  );
}

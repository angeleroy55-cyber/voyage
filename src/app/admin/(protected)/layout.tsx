import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/components/ui/Icon";
import AdminNav from "@/components/admin/AdminNav";
import { requireSession } from "@/server/session";
import { closeSession } from "@/server/session";

export const metadata = { title: "Back-office" };

// Le rendu doit être dynamique : la garde lit le cookie de session, qui n'est
// pas connu au moment de la construction.
export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  await closeSession();
  redirect("/admin/connexion");
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen bg-navy-50/40">
      {/* Colonne figée : elle occupe toute la hauteur de la fenêtre et ne défile
          pas avec le contenu. `overflow-y-auto` garde le menu atteignable si la
          liste dépasse sur les petits écrans. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-navy-100 bg-white lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-lg"
          />
          <span className="text-lg font-extrabold leading-none tracking-tight text-navy-900">
            <span className="text-gold-500">Go</span>Séjour
          </span>
        </Link>

        <AdminNav />

        <div className="mt-auto border-t border-navy-100 p-4">
          <p className="truncate text-sm font-semibold text-navy-900">{session.name || session.email}</p>
          <p className="truncate text-xs text-navy-500">{session.email}</p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-lg border border-navy-200 px-2 py-1.5 text-center text-xs font-semibold text-navy-700 hover:bg-navy-50"
            >
              Voir le site
            </Link>
            <form action={signOut} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-navy-100 bg-white px-4 py-3 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/brand/logo-mark.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
            <span className="font-extrabold text-navy-900">Back-office</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700"
            >
              Quitter
            </button>
          </form>
        </header>

        <div className="border-b border-navy-100 bg-white px-4 py-2 lg:hidden">
          <AdminNav compact />
        </div>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="px-4 pb-6 text-xs text-navy-400 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="shield" className="size-3.5" />
            Session valable 12 h — GoSéjour back-office
          </span>
        </footer>
      </div>
    </div>
  );
}

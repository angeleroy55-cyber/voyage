import Link from "next/link";
import AccountNav from "@/components/account/AccountNav";
import Icon from "@/components/ui/Icon";
import { LOYALTY_TIERS, loyaltyTier } from "@/lib/constants";
import { getCustomer } from "@/server/account";
import { prisma } from "@/server/prisma";
import { requireCustomer } from "@/server/customer-session";
import { logoutCustomer } from "@/server/actions/account";

// Le groupe `(espace)` couvre les pages accessibles une fois connecté ; la page
// de connexion vit hors de ce groupe pour ne pas hériter de la barre latérale.
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: LayoutProps<"/compte">) {
  const session = await requireCustomer();

  const [customer, bookings, favourites] = await Promise.all([
    getCustomer(session.sub),
    prisma.booking.count({
      where: { customerId: session.sub, status: { notIn: ["cancelled", "completed"] } },
    }),
    prisma.favourite.count({ where: { customerId: session.sub } }),
  ]);

  const points = customer?.loyaltyPoints ?? 0;
  const tier = loyaltyTier(points);
  const next = [...LOYALTY_TIERS].reverse().find((t) => t.from > points);
  const initials =
    `${customer?.firstName?.[0] ?? ""}${customer?.lastName?.[0] ?? ""}`.toUpperCase() || "GS";

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="transition hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Espace client</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 text-sm font-extrabold text-gold-400"
              >
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-navy-900">
                  {customer?.firstName} {customer?.lastName}
                </span>
                <span className="block truncate text-xs text-navy-500">{session.email}</span>
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-linear-to-br from-navy-800 to-navy-600 p-3.5 text-white">
              <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gold-300">
                Statut {tier.label}
                <Icon name="sparkles" className="size-3.5" />
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">
                {points.toLocaleString("fr-FR")} pts
              </p>
              {next ? (
                <>
                  {/* La barre montre la progression à l'intérieur du palier
                      courant, pas depuis zéro : c'est la distance qui reste qui
                      intéresse le voyageur. */}
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-gold-400 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((points - tier.from) / (next.from - tier.from)) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-white">
                    Encore {(next.from - points).toLocaleString("fr-FR")} pts pour le statut{" "}
                    {next.label}
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-[11px] text-white">
                  Statut maximum atteint : {tier.perk.toLowerCase()}.
                </p>
              )}
            </div>

            <div className="mt-4">
              <AccountNav
                counts={{
                  "/compte/reservations": bookings,
                  "/compte/favoris": favourites,
                }}
              />
            </div>
          </div>

          <div className="mt-4 hidden rounded-2xl border border-navy-100 bg-navy-50/60 p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Icon name="headset" className="size-4 text-gold-600" />
              Besoin d&apos;aide ?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-navy-600">
              Nos conseillers répondent 7 j/7 de 8 h à 21 h, et 24 h/24 pendant votre séjour.
            </p>
            <Link
              href="/aide"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-700 transition hover:underline"
            >
              Contacter le service client
              <Icon name="chevronRight" className="size-3" />
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          {children}

          <form action={logoutCustomer} className="mt-8 lg:hidden">
            <button
              type="submit"
              className="w-full rounded-xl border border-navy-200 py-3 text-sm font-semibold text-navy-700"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

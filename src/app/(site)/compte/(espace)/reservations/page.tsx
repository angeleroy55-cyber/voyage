import Link from "next/link";
import BookingCard from "@/components/account/BookingCard";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { price } from "@/lib/format";
import { getBookings } from "@/server/account";
import { requireCustomer } from "@/server/customer-session";

export const metadata = { title: "Mes réservations" };

const TABS = [
  { id: "toutes", label: "Toutes" },
  { id: "a-venir", label: "À venir" },
  { id: "terminees", label: "Terminées" },
  { id: "annulees", label: "Annulées" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function BookingsPage({ searchParams }: PageProps<"/compte/reservations">) {
  const session = await requireCustomer();
  const sp = await searchParams;
  const raw = typeof sp.etat === "string" ? sp.etat : "toutes";
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : "toutes";

  const bookings = await getBookings(session.sub);

  const buckets: Record<TabId, typeof bookings> = {
    toutes: bookings,
    "a-venir": bookings.filter((b) => b.status === "pending" || b.status === "confirmed"),
    terminees: bookings.filter((b) => b.status === "completed"),
    annulees: bookings.filter((b) => b.status === "cancelled"),
  };

  const shown = buckets[tab];
  const totalValue = shown
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
            Mes réservations
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            Suivez l&apos;état de chaque dossier, ses documents et son échéancier.
          </p>
        </div>
        {totalValue > 0 && (
          <p className="text-sm text-navy-600">
            Valeur des séjours&nbsp;: <strong className="text-navy-900">{price(totalValue)}</strong>
          </p>
        )}
      </header>

      {/* Le filtre passe par l'URL plutôt que par un état local : un dossier
          ouvert puis refermé ramène à l'onglet d'où l'on vient. */}
      <div className="rail flex gap-1 overflow-x-auto border-b border-navy-100">
        {TABS.map((item) => {
          const count = buckets[item.id].length;
          const on = item.id === tab;
          return (
            <Link
              key={item.id}
              href={item.id === "toutes" ? "/compte/reservations" : `/compte/reservations?etat=${item.id}`}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
                on
                  ? "border-gold-500 text-navy-900"
                  : "border-transparent text-navy-500 hover:text-navy-800"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  on ? "bg-gold-100 text-gold-800" : "bg-navy-100 text-navy-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-200 p-12 text-center">
          <Icon name="package" className="mx-auto size-8 text-navy-300" />
          <p className="mt-3 text-lg font-bold text-navy-900">
            {tab === "toutes" ? "Aucune réservation" : "Rien dans cette catégorie"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
            {tab === "toutes"
              ? "Dès votre première réservation, le dossier complet apparaîtra ici : documents, échéancier et assistance."
              : "Changez d'onglet pour retrouver vos autres dossiers."}
          </p>
          {tab === "toutes" && (
            <Link
              href="/recherche/vol-hotel"
              className="mt-4 inline-block rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
            >
              Trouver un séjour
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((booking, index) => (
            <Reveal key={booking.id} delay={Math.min(index, 4) * 60}>
              <BookingCard booking={booking} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/admin/Pagination";
import BookingForm from "@/components/admin/BookingForm";
import { prisma } from "@/server/prisma";
import { saveBookingNotes, setBookingStatus } from "@/server/actions/admin";
import { recordPayment } from "@/server/actions/bookings";
import { BOOKING_STATUSES, STATUS_LABELS, paymentLabel } from "@/lib/constants";
import { dateRange, price } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Réservations" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const ERRORS: Record<string, string> = {
  nom: "Le nom du client est obligatoire.",
  email: "Cette adresse e-mail ne semble pas valide.",
  offre: "Choisissez une offre existante.",
  montant: "Indiquez un montant différent de zéro.",
  solde: "Le montant réglé ne peut ni être négatif ni dépasser le total dû.",
  introuvable: "Cette réservation n'existe plus.",
};

export default async function BookingsPage({ searchParams }: PageProps<"/admin/reservations">) {
  const sp = await searchParams;

  const status = typeof sp.statut === "string" ? sp.statut : "tous";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const solde = typeof sp.solde === "string" ? sp.solde : "tous";
  const page = Math.max(1, Number(sp.page) || 1);

  const filters: Prisma.BookingWhereInput[] = [];
  if (status !== "tous") filters.push({ status });
  if (q) {
    filters.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
      ],
    });
  }
  // « Soldée » compare deux colonnes de la même ligne, ce que le `where` de
  // Prisma ne sait pas exprimer. La requête est déléguée à Postgres, sur une
  // chaîne constante : aucune saisie n'y entre, donc rien à échapper.
  if (solde === "soldees" || solde === "dues") {
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      solde === "soldees"
        ? 'SELECT id FROM "Booking" WHERE "paidAmount" >= "totalPrice"'
        : 'SELECT id FROM "Booking" WHERE "paidAmount" < "totalPrice"',
    );
    filters.push({ id: { in: rows.map((row) => row.id) } });
  }

  const where: Prisma.BookingWhereInput = filters.length ? { AND: filters } : {};

  const [total, bookings, counts, offers] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        offer: { select: { id: true, title: true, destination: true } },
        customer: { select: { id: true } },
      },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.offer.findMany({
      where: { status: { not: "archived" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, destination: true, price: true },
    }),
  ]);

  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const params = { statut: status, q, solde };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Réservations</h1>
      <p className="mt-1 text-sm text-navy-600">
        Les demandes du site arrivent au statut « en attente ». Les dossiers pris par téléphone
        s&apos;enregistrent ici.
      </p>

      {sp.cree && <AdminNotice>Réservation créée.</AdminNotice>}
      {sp.enregistre && <AdminNotice>Réservation mise à jour.</AdminNotice>}
      {sp.regle && <AdminNotice>Règlement enregistré.</AdminNotice>}
      {sp.supprime && <AdminNotice>Réservation supprimée.</AdminNotice>}
      {typeof sp.erreur === "string" && (
        <AdminNotice tone="error">{ERRORS[sp.erreur] ?? "L'action a échoué."}</AdminNotice>
      )}

      <details open={Boolean(sp.nouvelle)} className="mt-5 rounded-2xl border border-navy-100 bg-white">
        <summary className="cursor-pointer px-5 py-4 text-base font-extrabold text-navy-900">
          Enregistrer une réservation prise par téléphone
        </summary>
        <div className="border-t border-navy-100 px-5 py-4">
          <BookingForm offers={offers} />
        </div>
      </details>

      <nav className="mt-5 flex flex-wrap gap-2">
        {[
          { id: "tous", label: `Toutes (${counts.reduce((s, c) => s + c._count, 0)})` },
          ...BOOKING_STATUSES.map((s) => ({
            id: s,
            label: `${STATUS_LABELS[s] ?? s} (${countOf(s)})`,
          })),
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/reservations?statut=${tab.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              status === tab.id
                ? "bg-navy-900 text-white"
                : "border border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <AdminSearch
          action="/admin/reservations"
          defaultValue={q}
          placeholder="Référence, nom, e-mail…"
          hidden={{ statut: status, solde }}
        />

        <nav className="flex gap-1">
          {[
            { id: "tous", label: "Tous les soldes" },
            { id: "dues", label: "Non soldées" },
            { id: "soldees", label: "Soldées" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/reservations?statut=${status}&solde=${tab.id}${
                q ? `&q=${encodeURIComponent(q)}` : ""
              }`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                solde === tab.id ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <a
          href={`/admin/reservations/export?statut=${status}&q=${encodeURIComponent(q)}`}
          className="rounded-xl border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
        >
          Exporter en CSV
        </a>
      </div>

      <p className="mt-3 text-xs text-navy-500">
        {total} réservation{total > 1 ? "s" : ""}
        {q && ` correspondant à « ${q} »`}
      </p>

      {bookings.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          {total > 0 ? (
            <>
              Cette page n&apos;existe pas.{" "}
              <Link href="/admin/reservations" className="font-semibold text-navy-700 underline">
                Revenir au début de la liste
              </Link>
            </>
          ) : q || status !== "tous" || solde !== "tous" ? (
            "Aucune réservation ne correspond à ces critères."
          ) : (
            "Aucune réservation pour le moment. Elles apparaîtront ici dès qu'un visiteur enverra une demande."
          )}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((booking) => {
            const due = booking.totalPrice - booking.paidAmount;

            return (
              <li key={booking.id} className="rounded-2xl border border-navy-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy-900">
                      {booking.customerName}
                      <span className="ml-2 rounded bg-navy-50 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600">
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </p>
                    <p className="text-xs text-navy-500">
                      <span className="font-mono font-bold">{booking.reference}</span> ·{" "}
                      {booking.customerEmail}
                      {booking.customerPhone && ` · ${booking.customerPhone}`}
                    </p>
                    <p className="mt-1 text-xs text-navy-500">
                      {booking.travellers} voyageur(s)
                      {booking.insurance && " · assurance annulation"} ·{" "}
                      {dateRange(booking.departureDate, booking.returnDate)}
                    </p>
                    <p className="mt-1 text-xs text-navy-500">
                      Paiement : {paymentLabel(booking.paymentMethod)}
                      {booking.instalments > 1 && ` · ${booking.instalments} fois sans frais`}
                    </p>
                    {booking.offer && (
                      <Link
                        href={`/admin/offres/${booking.offer.id}`}
                        className="mt-1 inline-block text-xs font-semibold text-gold-700 hover:underline"
                      >
                        {booking.offer.destination} · {booking.offer.title}
                      </Link>
                    )}
                    {booking.customer && (
                      <Link
                        href={`/admin/clients/${booking.customer.id}`}
                        className="ml-3 mt-1 inline-block text-xs font-semibold text-navy-600 hover:underline"
                      >
                        Voir la fiche client
                      </Link>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold text-navy-900">
                      {price(booking.totalPrice)}
                    </p>
                    <p className={`text-xs font-semibold ${due > 0 ? "text-red-600" : "text-teal-700"}`}>
                      {due > 0 ? `Reste ${price(due)}` : "Soldée"}
                    </p>
                    <p className="text-[11px] text-navy-500">{price(booking.paidAmount)} réglés</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 border-t border-navy-100 pt-3 lg:grid-cols-2">
                  <form
                    action={recordPayment.bind(null, booking.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="min-w-32 flex-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                        Encaisser (€)
                      </span>
                      <input
                        type="number"
                        name="amount"
                        step={1}
                        placeholder={
                          booking.instalments > 1
                            ? String(Math.ceil(booking.totalPrice / booking.instalments))
                            : String(due)
                        }
                        className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
                      />
                    </label>
                    <button className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700">
                      Enregistrer le règlement
                    </button>
                  </form>

                  <form
                    action={saveBookingNotes.bind(null, booking.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="min-w-40 flex-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                        Note interne
                      </span>
                      <input
                        name="notes"
                        defaultValue={booking.notes}
                        className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2 text-sm outline-none focus:border-navy-400"
                      />
                    </label>
                    <button className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400">
                      Noter
                    </button>
                  </form>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-100 pt-3">
                  {BOOKING_STATUSES.filter((s) => s !== booking.status).map((s) => (
                    <form key={s} action={setBookingStatus.bind(null, booking.id, s)}>
                      <button className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-bold text-navy-700 hover:border-navy-400">
                        {STATUS_LABELS[s] ?? s}
                      </button>
                    </form>
                  ))}

                  <Link
                    href={`/admin/reservations/${booking.id}`}
                    className="ml-auto rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-bold text-navy-700 hover:border-navy-400"
                  >
                    Modifier le dossier
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        base="/admin/reservations"
        params={params}
        page={page}
        total={total}
        perPage={PER_PAGE}
      />
    </div>
  );
}

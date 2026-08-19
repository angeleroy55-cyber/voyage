import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import AdminNotice from "@/components/admin/AdminNotice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import {
  adjustLoyalty,
  anonymiseCustomer,
  deleteCustomer,
  resetCustomerPassword,
  setCustomerActive,
  updateCustomer,
} from "@/server/actions/customers";
import { loyaltyTier, STATUS_LABELS } from "@/lib/constants";
import { dateLabel, dateRange, price } from "@/lib/format";

export const metadata = { title: "Fiche client" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

const ERRORS: Record<string, string> = {
  email: "Cette adresse e-mail ne semble pas valide.",
  doublon: "Un autre client utilise déjà cette adresse e-mail.",
  motdepasse: "Le mot de passe doit compter au moins 10 caractères.",
  points: "Indiquez un nombre de points différent de zéro.",
  motif: "Le motif de l'ajustement est obligatoire.",
  droits: "Seul un compte « owner » peut supprimer ou anonymiser un client.",
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { offer: { select: { title: true, slug: true } } },
      },
      favourites: {
        orderBy: { createdAt: "desc" },
        include: { offer: { select: { title: true, slug: true, price: true } } },
      },
    },
  });

  if (!customer) notFound();

  const tier = loyaltyTier(customer.loyaltyPoints);
  const name = `${customer.firstName} ${customer.lastName}`.trim() || "Sans nom";
  const isOwner = session.role === "owner";
  const spent = customer.bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-gold-700"
      >
        <Icon name="chevronLeft" className="size-4" />
        Tous les clients
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{name}</h1>
          <p className="mt-1 text-sm text-navy-600">
            {customer.email} · inscrit le {dateLabel(customer.createdAt)} · dernière connexion{" "}
            {customer.lastLoginAt ? dateLabel(customer.lastLoginAt) : "jamais"}
          </p>
        </div>
        <form action={setCustomerActive.bind(null, customer.id, !customer.active)}>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              customer.active
                ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {customer.active ? "Compte actif" : "Compte désactivé"}
          </button>
        </form>
      </div>

      {sp.enregistre && <AdminNotice>Coordonnées enregistrées.</AdminNotice>}
      {sp.motdepasse && <AdminNotice>Mot de passe réinitialisé.</AdminNotice>}
      {typeof sp.points === "string" && (
        <AdminNotice>
          Solde ajusté de {sp.points} points : {customer.loyaltyPoints} pts au total.
        </AdminNotice>
      )}
      {typeof sp.erreur === "string" && (
        <AdminNotice tone="error">{ERRORS[sp.erreur] ?? "L'action a échoué."}</AdminNotice>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Statut fidélité" value={tier.label} hint={`${customer.loyaltyPoints} points`} />
        <Stat
          label="Réservations"
          value={String(customer.bookings.length)}
          hint={`${customer.favourites.length} favori(s)`}
        />
        <Stat label="Total réglé" value={price(spent)} hint="Séjours confirmés ou terminés" />
      </div>

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Coordonnées</h2>
        <form action={updateCustomer.bind(null, customer.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Prénom</span>
            <input name="firstName" defaultValue={customer.firstName} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Nom</span>
            <input name="lastName" defaultValue={customer.lastName} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              E-mail *
            </span>
            <input name="email" type="email" required defaultValue={customer.email} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Téléphone
            </span>
            <input name="phone" defaultValue={customer.phone} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Ville</span>
            <input name="city" defaultValue={customer.city} className={INPUT} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-navy-700">
            <input
              type="checkbox"
              name="newsletter"
              defaultChecked={customer.newsletter}
              className="size-4 rounded accent-gold-500"
            />
            Inscrit aux alertes
          </label>
          <button className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-span-2 sm:justify-self-end">
            Enregistrer
          </button>
        </form>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-100 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Points de fidélité</h2>
          <p className="mt-1 text-xs text-navy-500">
            Un ajustement manuel ne se retrouve nulle part ailleurs : le motif est demandé pour que
            le geste reste explicable.
          </p>
          <form action={adjustLoyalty.bind(null, customer.id)} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Points à ajouter ou retirer *
              </span>
              <input type="number" name="delta" required placeholder="-250" className={INPUT} />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Motif *
              </span>
              <input
                name="reason"
                required
                minLength={3}
                placeholder="Geste commercial, dossier GS-4F7K2A"
                className={INPUT}
              />
            </label>
            <button className="rounded-xl bg-navy-800 px-4 py-2 text-sm font-bold text-white hover:bg-navy-900">
              Appliquer
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-navy-100 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Accès au compte</h2>
          <p className="mt-1 text-xs text-navy-500">
            Le voyageur n&apos;est pas prévenu : communiquez-lui le nouveau mot de passe vous-même.
          </p>
          <form action={resetCustomerPassword.bind(null, customer.id)} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                Nouveau mot de passe *
              </span>
              <input
                type="text"
                name="password"
                required
                minLength={10}
                autoComplete="off"
                placeholder="10 caractères minimum"
                className={INPUT}
              />
            </label>
            <button className="rounded-xl bg-navy-800 px-4 py-2 text-sm font-bold text-white hover:bg-navy-900">
              Réinitialiser
            </button>
          </form>
        </section>
      </div>

      <section className="mt-3 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">
          Réservations ({customer.bookings.length})
        </h2>
        {customer.bookings.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">Ce client n&apos;a encore rien réservé.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-100">
            {customer.bookings.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <Link
                  href={`/admin/reservations?q=${booking.reference}`}
                  className="font-mono text-sm font-bold text-navy-900 hover:text-gold-700"
                >
                  {booking.reference}
                </Link>
                <span className="min-w-0 flex-1 truncate text-sm text-navy-600">
                  {booking.offer?.title ?? "Offre supprimée"}
                </span>
                <span className="text-xs text-navy-500">
                  {dateRange(booking.departureDate, booking.returnDate)}
                </span>
                <span className="text-sm font-bold text-navy-900">{price(booking.totalPrice)}</span>
                <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-700">
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">
          Favoris ({customer.favourites.length})
        </h2>
        {customer.favourites.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">Aucun séjour mis de côté.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {customer.favourites.map((favourite) => (
              <li
                key={favourite.id}
                className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700"
              >
                {favourite.offer.title} · {price(favourite.offer.price)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-extrabold text-red-800">Effacement des données</h2>
        <p className="mt-1 text-sm text-red-700">
          {isOwner
            ? "L'anonymisation conserve les réservations pour la comptabilité ; la suppression les emporte."
            : "Réservé aux comptes « owner »."}
        </p>
        {isOwner && (
          <div className="mt-3 flex flex-wrap gap-4">
            <ConfirmButton
              action={anonymiseCustomer.bind(null, customer.id)}
              label="Anonymiser ce client"
              title={`Anonymiser ${name} ?`}
              description={`L'identité de ${name} sera effacée de son compte et de ses ${customer.bookings.length} réservation(s), dont les montants sont conservés. Le compte sera désactivé et ses favoris supprimés. C'est définitif.`}
              confirmLabel="Anonymiser"
              confirmWord={customer.email}
              tone="neutral"
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            />
            <ConfirmButton
              action={deleteCustomer.bind(null, customer.id)}
              label="Supprimer définitivement"
              title={`Supprimer ${name} ?`}
              description={`Le compte de ${name} et ses ${customer.bookings.length} réservation(s) seront effacés de la base. Aucune trace comptable ne subsistera. C'est définitif.`}
              confirmLabel="Supprimer"
              confirmWord={customer.email}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            />
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4">
      <p className="text-xs text-navy-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500">{hint}</p>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import BookingCard from "@/components/account/BookingCard";
import StatusBadge from "@/components/account/StatusBadge";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { loyaltyTier } from "@/lib/constants";
import { dateRange, price } from "@/lib/format";
import { daysUntil, getAccountSummary, getCustomer } from "@/server/account";
import { requireCustomer } from "@/server/customer-session";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const session = await requireCustomer();
  const [summary, customer] = await Promise.all([
    getAccountSummary(session.sub),
    getCustomer(session.sub),
  ]);

  const { nextTrip } = summary;
  const countdown = nextTrip?.departureDate ? daysUntil(nextTrip.departureDate) : null;
  const tier = loyaltyTier(summary.loyaltyPoints);

  // Prochaine échéance impayée, tous dossiers confondus : c'est l'information
  // qui appelle une action de la part du voyageur.
  const nextDue = summary.bookings
    .filter((booking) => booking.status !== "cancelled")
    .flatMap((booking) =>
      booking.schedule
        .filter((instalment) => !instalment.paid)
        .map((instalment) => ({ booking, instalment })),
    )
    .sort((a, b) => a.instalment.dueDate.getTime() - b.instalment.dueDate.getTime())[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          Bonjour {customer?.firstName || "et bienvenue"} 👋
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {summary.counts.upcoming > 0
            ? `${summary.counts.upcoming} voyage${summary.counts.upcoming > 1 ? "s" : ""} à venir. Voici où en sont vos dossiers.`
            : "Aucun voyage prévu pour l'instant : le catalogue vous attend."}
        </p>
      </header>

      {/* Chiffres clés */}
      <Reveal>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Voyages à venir",
              value: String(summary.counts.upcoming),
              icon: "plane",
              tone: "text-gold-600",
            },
            {
              label: "Séjours effectués",
              value: String(summary.counts.completed),
              icon: "check",
              tone: "text-teal-500",
            },
            {
              label: "Total réglé",
              value: price(summary.spent),
              icon: "shield",
              tone: "text-navy-500",
            },
            {
              label: "Reste à payer",
              value: price(summary.outstanding),
              icon: "clock",
              tone: summary.outstanding > 0 ? "text-gold-600" : "text-teal-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="hover-lift rounded-2xl border border-navy-100 bg-white p-4 shadow-card"
            >
              <Icon name={stat.icon} className={`size-5 ${stat.tone}`} />
              <p className="mt-2.5 text-xl font-extrabold tabular-nums text-navy-900">
                {stat.value}
              </p>
              <p className="text-xs text-navy-500">{stat.label}</p>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* Prochain départ */}
      {nextTrip?.offer ? (
        <Reveal>
          <section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
            <div className="relative h-44 sm:h-56">
              <Image
                src={nextTrip.offer.image}
                alt={`${nextTrip.offer.title}, ${nextTrip.offer.destination}`}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy-900/85 via-navy-900/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gold-300">
                  <Icon name="bolt" className="size-3.5" />
                  Prochain départ
                </p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">
                  {nextTrip.offer.title}
                </h2>
                <p className="mt-1 text-sm text-white">
                  {nextTrip.offer.destination}, {nextTrip.offer.country} ·{" "}
                  {dateRange(nextTrip.departureDate, nextTrip.returnDate)}
                </p>
              </div>
              {countdown !== null && countdown >= 0 && (
                <div className="absolute right-4 top-4 rounded-2xl bg-white/95 px-4 py-2.5 text-center shadow-card backdrop-blur">
                  <p className="text-2xl font-extrabold leading-none tabular-nums text-navy-900">
                    J−{countdown}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-500">
                    avant le départ
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge status={nextTrip.status} />
                <span className="text-navy-600">
                  {nextTrip.travellers} voyageur{nextTrip.travellers > 1 ? "s" : ""} ·{" "}
                  {nextTrip.offer.board}
                </span>
                <span className="rounded-md bg-navy-50 px-2 py-1 font-mono text-[11px] font-bold text-navy-600">
                  {nextTrip.reference}
                </span>
              </div>
              <Link
                href={`/compte/reservations/${nextTrip.reference}`}
                className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
              >
                Ouvrir le dossier
              </Link>
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal>
          <section className="rounded-2xl border border-dashed border-navy-200 p-10 text-center">
            <Icon name="compass" className="mx-auto size-8 text-navy-300" />
            <p className="mt-3 text-lg font-bold text-navy-900">Aucun voyage prévu</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
              Vos prochaines réservations s&apos;afficheront ici, avec le compte à rebours, les
              documents et l&apos;échéancier de paiement.
            </p>
            <Link
              href="/recherche/vol-hotel"
              className="mt-4 inline-block rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-500"
            >
              Découvrir les offres
            </Link>
          </section>
        </Reveal>
      )}

      {/* Échéance et fidélité */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal variant="left">
          <section className="h-full rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-navy-900">
              <Icon name="calendar" className="size-4 text-gold-600" />
              Prochaine échéance
            </h2>
            {nextDue ? (
              <>
                <p className="mt-3 text-2xl font-extrabold text-navy-900">
                  {price(nextDue.instalment.amount)}
                </p>
                <p className="mt-1 text-sm text-navy-600">
                  Échéance {nextDue.instalment.index} sur {nextDue.booking.instalments} du dossier{" "}
                  <Link
                    href={`/compte/reservations/${nextDue.booking.reference}`}
                    className="font-semibold text-gold-700 hover:underline"
                  >
                    {nextDue.booking.reference}
                  </Link>
                  , prélevée le{" "}
                  {nextDue.instalment.dueDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  .
                </p>
                <p className="mt-3 rounded-xl bg-navy-50 p-3 text-xs leading-relaxed text-navy-600">
                  Le prélèvement est automatique sur le moyen de paiement enregistré. Aucun frais
                  n&apos;est appliqué sur le paiement en plusieurs fois.
                </p>
              </>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-sm text-teal-700">
                <Icon name="check" className="mt-0.5 size-4 shrink-0" />
                Tout est réglé : aucune échéance en attente.
              </p>
            )}
          </section>
        </Reveal>

        <Reveal variant="right">
          <section className="h-full rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-navy-900">
              <Icon name="gift" className="size-4 text-gold-600" />
              Programme fidélité
            </h2>
            <p className="mt-3 text-sm text-navy-600">
              Statut <strong className="text-navy-900">{tier.label}</strong> :{" "}
              {tier.perk.toLowerCase()}.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "1 point par euro dépensé sur les séjours confirmés",
                "Points valables 24 mois, cumulables sur tous les produits",
                "Avantages appliqués automatiquement à la réservation",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-navy-700">
                  <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      {/* Dossiers récents */}
      {summary.bookings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
              Dossiers récents
            </h2>
            <Link
              href="/compte/reservations"
              className="flex items-center gap-1 text-sm font-semibold text-navy-700 transition hover:text-gold-700"
            >
              Tout voir
              <Icon name="chevronRight" className="size-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {summary.bookings.slice(0, 3).map((booking, index) => (
              <Reveal key={booking.id} delay={index * 70}>
                <BookingCard booking={booking} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

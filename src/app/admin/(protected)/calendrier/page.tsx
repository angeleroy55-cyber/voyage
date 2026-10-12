import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import CalendarFields from "@/components/admin/CalendarFields";
import { prisma } from "@/server/prisma";
import { resetCategoryCalendar, saveCategoryCalendar } from "@/server/actions/calendar";
import { CALENDAR_ERRORS } from "@/server/calendar-form";
import {
  bookableDaysInMonth,
  defaultWindowMonths,
  resolveBookingRules,
} from "@/lib/booking-rules";
import { DEFAULT_DISCOUNT_MAX_PCT, DEFAULT_DISCOUNT_MIN_PCT, leadDaysFor } from "@/lib/pricing";

export const metadata = { title: "Dates & prix" };
export const dynamic = "force-dynamic";

export default async function CalendarAdminPage({ searchParams }: PageProps<"/admin/calendrier">) {
  const sp = await searchParams;
  const erreur = typeof sp.erreur === "string" ? sp.erreur : null;

  // Seules les catégories qui possèdent leurs offres ont un calendrier : les
  // listings calculés (Bons plans…) affichent les offres d'autres catégories,
  // avec les réglages de celles-ci, et les pages éditoriales n'ont pas d'offre.
  const categories = await prisma.category.findMany({
    where: { kind: "catalogue" },
    orderBy: [{ position: "asc" }, { label: "asc" }],
    include: { _count: { select: { offers: true } } },
  });

  // Offres qui ont au moins un réglage propre, par catégorie.
  const overrides = await prisma.offer.groupBy({
    by: ["categoryId"],
    where: {
      OR: [
        { bookingLeadDays: { not: null } },
        { bookingWindowMonths: { not: null } },
        { excludedWeekdays: { not: null } },
        { discountMinPct: { not: null } },
        { discountMaxPct: { not: null } },
      ],
    },
    _count: true,
  });
  const overrideCount = new Map(overrides.map((o) => [o.categoryId, o._count]));

  const today = new Date();
  const months = [0, 1, 2].map((m) => new Date(today.getFullYear(), today.getMonth() + m, 1));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Dates & prix</h1>
      <p className="mt-1 text-sm text-navy-600">
        Calendrier de réservation et fourchette de prix, par catégorie. Une offre peut avoir ses
        propres réglages depuis sa fiche (section « Calendrier et prix ») ; un champ laissé vide
        hérite toujours du niveau au-dessus.
      </p>

      {erreur && (
        <AdminNotice tone="error">{CALENDAR_ERRORS[erreur] ?? "L'enregistrement a échoué."}</AdminNotice>
      )}
      {sp.enregistre && <AdminNotice>Réglages enregistrés, appliqués dès maintenant sur le site.</AdminNotice>}
      {sp.reinitialise && <AdminNotice>Valeurs par défaut rétablies.</AdminNotice>}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5 text-sm leading-relaxed text-navy-700">
        <h2 className="text-base font-extrabold text-navy-900">Comment le prix d&apos;une date est calculé</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Prix catalogue de l&apos;offre.</li>
          <li>
            +5 % pour un départ vendredi, samedi ou dimanche ; −5 % pour un départ dans les dix
            jours.
          </li>
          <li>
            Saison de la date : +4 % en haute demande (grandes vacances, Noël, Pâques), 0 % en
            demande normale (Toussaint, hiver, ponts de mai), −4 % en basse demande (été indien,
            soleil d&apos;hiver).
          </li>
          <li>
            Le résultat est ramené entre la remise minimale et la remise maximale sous le prix de
            référence concurrentiel de l&apos;offre (le prix barré). Exception : une vente flash
            déjà plus basse que la remise maximale garde son prix.
          </li>
        </ol>
        <p className="mt-2 text-xs text-navy-500">
          Le même calcul sert à l&apos;affichage et à l&apos;enregistrement de la demande : le
          montant facturé est toujours celui qui a été montré. Détail dans src/lib/pricing.ts.
        </p>
      </section>

      <ul className="mt-5 space-y-3">
        {categories.map((category) => {
          // Aperçu sur une offre type de la catégorie (7 nuits, sans saison).
          const rules = resolveBookingRules({
            categorySlug: category.slug,
            category,
            offer: { nights: 7, price: 0, oldPrice: null },
          });
          const own = overrideCount.get(category.id) ?? 0;

          return (
            <li
              key={category.id}
              id={`c-${category.id}`}
              className="scroll-mt-24 rounded-2xl border border-navy-100 bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-extrabold text-navy-900">
                  {category.label}{" "}
                  <span className="text-xs font-normal text-navy-500">
                    /{category.slug} · {category._count.offers} offre(s)
                    {own > 0 && (
                      <>
                        {" · "}
                        <Link href={`/admin/offres?type=${category.slug}`} className="underline">
                          dont {own} avec réglage propre
                        </Link>
                      </>
                    )}
                  </span>
                </p>
                <p className="text-xs text-navy-500">
                  Dates ouvertes :{" "}
                  {months
                    .map(
                      (m) =>
                        `${m.toLocaleDateString("fr-FR", { month: "short" })} ${bookableDaysInMonth(rules, m.getFullYear(), m.getMonth())} j`,
                    )
                    .join(" · ")}
                </p>
              </div>

              <form action={saveCategoryCalendar.bind(null, category.id)} className="mt-4">
                <CalendarFields
                  values={category}
                  inheritLabel="par défaut"
                  inherited={{
                    leadDays: leadDaysFor(category.slug),
                    windowMonths: defaultWindowMonths(category.slug),
                    weekdays: [],
                    min: DEFAULT_DISCOUNT_MIN_PCT,
                    max: DEFAULT_DISCOUNT_MAX_PCT,
                  }}
                />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500"
                  >
                    Enregistrer
                  </button>
                  <button
                    formAction={resetCategoryCalendar.bind(null, category.id)}
                    className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"
                  >
                    Revenir aux valeurs par défaut
                  </button>
                  {category.slug && rules.windowMonths !== defaultWindowMonths(category.slug) && (
                    <span className="text-xs text-navy-500">Fenêtre personnalisée</span>
                  )}
                </div>
              </form>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-navy-500">
        Les offres de 9 nuits et plus (long-courrier) reçoivent 3 mois de fenêtre en plus, dans la
        limite de 9 mois, sauf si elles ont leur propre fenêtre. Les offres saisonnières (ski,
        Noël…) ne proposent que les dates de leur saison.
      </p>
    </div>
  );
}

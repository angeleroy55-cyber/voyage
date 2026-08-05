import { prisma } from "@/server/prisma";

export const metadata = { title: "Abonnés" };
export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Répartition par centre d'intérêt : indique quels thèmes méritent une
  // campagne, sans avoir à ouvrir la base.
  const byInterest = new Map<string, number>();
  for (const subscriber of subscribers) {
    for (const interest of subscriber.interests) {
      byInterest.set(interest, (byInterest.get(interest) ?? 0) + 1);
    }
  }
  const interests = [...byInterest.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Abonnés</h1>
      <p className="mt-1 text-sm text-navy-600">
        Inscriptions déposées depuis le bloc « Alertes bons plans » de la page d&apos;accueil.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <p className="text-3xl font-extrabold tabular-nums text-navy-900">
            {subscribers.length}
          </p>
          <p className="text-sm font-semibold text-navy-800">inscrit(s)</p>
        </div>
        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-500">
            Thèmes les plus demandés
          </p>
          {interests.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">Aucun thème coché pour l&apos;instant.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {interests.slice(0, 4).map(([label, count]) => (
                <li key={label} className="flex justify-between text-sm">
                  <span className="text-navy-700">{label}</span>
                  <span className="font-bold text-navy-900 tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {subscribers.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          Aucun abonné pour le moment. Les inscriptions apparaissent ici dès qu&apos;un visiteur
          laisse son adresse sur la page d&apos;accueil.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-navy-100 bg-white">
          <ul className="divide-y divide-navy-100">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {subscriber.email}
                  </p>
                  <p className="text-xs text-navy-500">
                    Inscrit le {subscriber.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subscriber.interests.length === 0 ? (
                    <span className="text-xs text-navy-400">tous les thèmes</span>
                  ) : (
                    subscriber.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-medium text-navy-600"
                      >
                        {interest}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { addSubscriber, deleteSubscriber } from "@/server/actions/admin";

export const metadata = { title: "Abonnés" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/abonnes">) {
  const sp = await searchParams;
  const theme = typeof sp.theme === "string" ? sp.theme : "";

  const subscribers = await prisma.subscriber.findMany({
    where: theme ? { interests: { has: theme } } : {},
    orderBy: { createdAt: "desc" },
  });

  // Le comptage porte sur l'ensemble, pas sur la liste filtrée : les onglets
  // doivent garder leur volumétrie une fois l'un d'eux sélectionné.
  const all = await prisma.subscriber.findMany({ select: { interests: true } });
  const byInterest = new Map<string, number>();
  for (const subscriber of all) {
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

      {sp.ajoute && <AdminNotice>Adresse ajoutée à la liste.</AdminNotice>}
      {sp.supprime && <AdminNotice>Adresse retirée de la liste.</AdminNotice>}
      {sp.erreur === "email" && (
        <AdminNotice tone="error">Cette adresse e-mail ne semble pas valide.</AdminNotice>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <p className="text-3xl font-extrabold tabular-nums text-navy-900">{all.length}</p>
          <p className="text-sm font-semibold text-navy-800">inscrit(s)</p>
          <a
            href={`/admin/abonnes/export?theme=${encodeURIComponent(theme)}`}
            className="mt-3 inline-block rounded-xl border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
          >
            Exporter en CSV
          </a>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-500">
            Ajouter une adresse
          </p>
          <form action={addSubscriber} className="mt-2">
            <label className="block">
              <span className="sr-only">Adresse e-mail</span>
              <input
                type="email"
                name="email"
                required
                placeholder="prenom.nom@exemple.fr"
                className={INPUT}
              />
            </label>
            <button className="mt-2 rounded-xl bg-gold-400 px-4 py-2 text-sm font-bold text-navy-900 hover:bg-gold-500">
              Ajouter
            </button>
          </form>
        </div>
      </div>

      {interests.length > 0 && (
        <nav className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin/abonnes"
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              theme === "" ? "bg-navy-900 text-white" : "border border-navy-200 text-navy-700"
            }`}
          >
            Tous ({all.length})
          </Link>
          {interests.map(([label, count]) => (
            <Link
              key={label}
              href={`/admin/abonnes?theme=${encodeURIComponent(label)}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                theme === label ? "bg-navy-900 text-white" : "border border-navy-200 text-navy-700"
              }`}
            >
              {label} ({count})
            </Link>
          ))}
        </nav>
      )}

      {subscribers.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          {theme
            ? `Aucun abonné sur le thème « ${theme} ».`
            : "Aucun abonné pour le moment. Les inscriptions apparaissent ici dès qu'un visiteur laisse son adresse sur la page d'accueil."}
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
                  <p className="truncate text-sm font-semibold text-navy-900">{subscriber.email}</p>
                  <p className="text-xs text-navy-500">
                    Inscrit le {subscriber.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {subscriber.interests.length === 0 ? (
                    <span className="text-xs text-navy-500">tous les thèmes</span>
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
                  <ConfirmButton
                    action={deleteSubscriber.bind(null, subscriber.id)}
                    label="Retirer"
                    title="Retirer cette adresse ?"
                    description={`${subscriber.email} ne recevra plus les alertes. Cette suppression est définitive et satisfait une demande de désinscription.`}
                    confirmLabel="Retirer"
                    className="ml-2 text-xs font-semibold text-red-600 hover:underline"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

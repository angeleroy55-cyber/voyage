import Link from "next/link";
import { prisma } from "@/server/prisma";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteReview, setReviewStatus } from "@/server/actions/admin";
import { STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Avis" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/avis">) {
  const sp = await searchParams;
  const status = typeof sp.statut === "string" ? sp.statut : "pending";

  const reviews = await prisma.review.findMany({
    where: status === "tous" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: { offer: { select: { id: true, title: true, destination: true } } },
  });

  const counts = await prisma.review.groupBy({ by: ["status"], _count: true });
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Avis</h1>
      <p className="mt-1 text-sm text-navy-600">
        Seuls les avis publiés apparaissent sur le site.
      </p>

      <nav className="mt-5 flex flex-wrap gap-2">
        {[
          { id: "pending", label: `En attente (${countOf("pending")})` },
          { id: "published", label: `Publiés (${countOf("published")})` },
          { id: "rejected", label: `Refusés (${countOf("rejected")})` },
          { id: "tous", label: "Tous" },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/avis?statut=${tab.id}`}
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

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          Aucun avis dans cette catégorie.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-navy-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                    {review.author}
                    <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                      {review.score.toFixed(1).replace(".", ",")}
                    </span>
                    <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600">
                      {STATUS_LABELS[review.status] ?? review.status}
                    </span>
                  </p>
                  <p className="text-xs text-navy-500">
                    {review.city} · {review.trip || "séjour non précisé"} ·{" "}
                    {review.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {review.offer && (
                  <Link
                    href={`/admin/offres/${review.offer.id}`}
                    className="shrink-0 text-xs font-semibold text-gold-700 hover:underline"
                  >
                    {review.offer.destination}
                  </Link>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-navy-700">« {review.text} »</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "published" && (
                  <form action={setReviewStatus.bind(null, review.id, "published")}>
                    <button className="rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-600">
                      Publier
                    </button>
                  </form>
                )}
                {review.status !== "rejected" && (
                  <form action={setReviewStatus.bind(null, review.id, "rejected")}>
                    <button className="rounded-lg border border-navy-200 px-3.5 py-2 text-xs font-bold text-navy-700 hover:border-navy-400">
                      Refuser
                    </button>
                  </form>
                )}
                <ConfirmButton
                  action={deleteReview.bind(null, review.id)}
                  label="Supprimer"
                  title={`Supprimer l'avis de ${review.author} ?`}
                  description="L'avis disparaît de la base et la note de l'offre est recalculée sans lui. C'est définitif : préférez « Refuser » pour le retirer du site tout en le gardant."
                  confirmLabel="Supprimer"
                  className="rounded-lg border border-red-200 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

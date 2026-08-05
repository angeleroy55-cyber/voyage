import Icon from "@/components/ui/Icon";
import Section from "@/components/ui/Section";
import type { Review } from "@/lib/types";

export default function Testimonials({ reviews }: { reviews: Review[] }) {
  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <Section
      title="Votre avis compte"
      subtitle={`Note moyenne de ${average.replace(".", ",")}/10 sur 3 450 avis vérifiés après séjour.`}
    >
      <div className="rail -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {reviews.map((r) => (
          <figure
            key={r.author}
            className="flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:w-[340px]"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon
                    key={i}
                    name="star"
                    className={`size-4 ${
                      i < Math.round(r.score / 2) ? "fill-amber-400 text-amber-400" : "text-navy-200"
                    }`}
                  />
                ))}
              </span>
              <span className="rounded-lg bg-navy-700 px-2 py-1 text-xs font-bold text-white tabular-nums">
                {r.score.toFixed(1).replace(".", ",")}
              </span>
            </div>
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-navy-700">
              « {r.text} »
            </blockquote>
            <figcaption className="mt-4 border-t border-navy-100 pt-3 text-xs text-navy-500">
              <span className="block font-bold text-navy-900">
                {r.author} — {r.city}
              </span>
              {r.trip} · {r.date}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Section from "@/components/ui/Section";
import type { Offer } from "@/lib/types";
import { durationLabel, price } from "@/lib/format";

export default function PopularBookings({ offers }: { offers: Offer[] }) {
  const rows = [...offers]
    .filter((o) => o.category !== "location-voiture")
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 9);

  return (
    <Section
      title="Les plus réservés au départ de Paris"
      subtitle="Classement établi sur les réservations des sept derniers jours."
    >
      <ol className="grid gap-2 md:grid-cols-3">
        {rows.map((o, i) => (
          <li key={o.slug}>
            <Link
              href={`/offre/${o.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-3.5 py-3 transition hover:border-navy-200 hover:bg-navy-50/60"
            >
              <span className="w-5 shrink-0 text-center text-sm font-extrabold text-navy-300 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy-900">
                  {o.destination} · {o.title}
                </span>
                <span className="block text-xs text-navy-500">
                  {durationLabel(o.nights, o.category)} · {o.board}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-extrabold text-navy-900">{price(o.price)}</span>
                <span className="block text-[10px] text-navy-500">par pers.</span>
              </span>
              <Icon
                name="chevronRight"
                className="size-4 shrink-0 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600"
              />
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}

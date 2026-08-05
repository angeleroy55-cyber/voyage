import OfferCard from "@/components/ui/OfferCard";
import Section from "@/components/ui/Section";
import type { Offer } from "@/lib/types";

export default function OfferRail({
  title,
  subtitle,
  href,
  offers,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  offers: Offer[];
}) {
  return (
    <Section title={title} subtitle={subtitle} href={href}>
      <div className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {offers.map((o) => (
          <div key={o.slug} className="w-[268px] shrink-0 snap-start sm:w-[300px]">
            <OfferCard offer={o} />
          </div>
        ))}
      </div>
    </Section>
  );
}

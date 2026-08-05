import Image from "next/image";
import Link from "next/link";
import Section from "@/components/ui/Section";
import type { Destination } from "@/lib/types";
import { photo, price } from "@/lib/format";

export default function DestinationGrid({ destinations }: { destinations: Destination[] }) {
  const [lead, ...rest] = destinations;

  return (
    <Section
      title="Destinations du moment"
      subtitle="Les régions les plus réservées ces trente derniers jours."
      href="/destinations"
    >
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
        <Tile destination={lead} className="md:col-span-2 md:row-span-2" priority />
        {rest.slice(0, 4).map((d) => (
          <Tile key={d.slug} destination={d} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {rest.slice(4).map((d) => (
          <Tile key={d.slug} destination={d} short />
        ))}
      </div>
    </Section>
  );
}

function Tile({
  destination,
  className = "",
  priority = false,
  short = false,
}: {
  destination: Destination;
  className?: string;
  priority?: boolean;
  short?: boolean;
}) {
  return (
    <Link
      href={`/recherche/vol-hotel?q=${encodeURIComponent(destination.name)}`}
      className={`group relative overflow-hidden rounded-2xl ${
        short ? "aspect-16/9" : "aspect-4/3 md:aspect-auto md:min-h-44"
      } ${className}`}
    >
      <Image
        src={destination.image ?? photo(destination.imageSeed, 800, 600)}
        alt={destination.name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-navy-900/85 via-navy-900/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-lg font-extrabold text-white drop-shadow">{destination.name}</p>
        <p className="text-xs text-navy-100">
          {destination.offersCount.toLocaleString("fr-FR")} offres · dès{" "}
          <span className="font-bold text-white">{price(destination.fromPrice)}</span>
        </p>
      </div>
    </Link>
  );
}

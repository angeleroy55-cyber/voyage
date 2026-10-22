import Icon from "@/components/ui/Icon";
import { venueLabel } from "@/lib/offer-details";
import type { Offer } from "@/lib/types";

/**
 * « Votre hébergement » : l'établissement nommé par le relevé de marché, avec
 * sa situation, sa restauration et ses types de chambre. N'affiche que les
 * rubriques réellement relevées ; sans établissement nommé (`details.venue`),
 * rien n'est rendu et la fiche garde son texte générique.
 */
export default function OfferVenueSection({ offer }: { offer: Offer }) {
  const venue = offer.details?.venue;
  if (!venue) return null;

  const blocks = [
    { title: "Situation", icon: "pin", items: venue.distances },
    { title: "Restauration", icon: "bed", items: venue.dining },
    { title: "Types de chambre", icon: "bed", items: venue.rooms },
  ].filter((b) => b.items && b.items.length > 0);

  if (blocks.length === 0 && !venue.localTax) return null;

  return (
    <section className="mt-9">
      <h2 className="text-lg font-extrabold text-navy-900">
        {venueLabel(venue)} : {venue.name}
      </h2>
      {blocks.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {blocks.map((block) => (
            <div key={block.title} className="rounded-xl border border-navy-100 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-navy-500">
                <Icon name={block.icon} className="size-3.5" />
                {block.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {block.items!.map((item) => (
                  <li key={item} className="text-sm text-navy-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {venue.localTax && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-navy-50 px-3.5 py-2.5 text-sm text-navy-700">
          <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-gold-600" />
          <span>
            <span className="font-semibold text-navy-900">À régler sur place :</span> {venue.localTax}
          </span>
        </p>
      )}
    </section>
  );
}

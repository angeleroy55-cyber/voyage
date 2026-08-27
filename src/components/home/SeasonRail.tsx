import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Section from "@/components/ui/Section";
import { SEASONS, currentSeason, upcomingSeason } from "@/lib/seasons";

/**
 * Rotation saisonnière de la page d'accueil.
 *
 * Le cahier la demande explicitement : Toussaint, été indien, hiver et ski,
 * Noël, Pâques, été. Elle est pilotée par la date du jour et non par une saisie
 * au back-office, parce qu'une mise en avant saisonnière laissée en place trois
 * mois de trop fait plus de mal qu'elle n'a fait de bien.
 *
 * La période poussée est la suivante, pas celle en cours : quand les vacances
 * de la Toussaint commencent, ceux qui partent ont déjà réservé. Ce qu'il reste
 * à vendre, c'est Noël.
 */
export default function SeasonRail({ counts }: { counts: Record<string, number> }) {
  const enCours = currentSeason();
  const prochaine = upcomingSeason();

  // Les périodes sans départ ne sont pas proposées : une pastille qui mène à une
  // page vide coûte un clic et une déception.
  const saisons = SEASONS.filter((s) => (counts[s.id] ?? 0) > 0);
  if (saisons.length === 0) return null;

  return (
    <Section
      title="Quand partez-vous&nbsp;?"
      subtitle={`Nous sommes en période « ${enCours.label} ». La prochaine à préparer : ${prochaine.label.toLowerCase()}.`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {saisons.map((saison) => {
          const enAvant = saison.id === prochaine.id;
          return (
            <Link
              key={saison.id}
              href={`/bons-plans-promos?saison=${saison.id}`}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-card ${
                enAvant
                  ? "border-gold-300 bg-gold-50"
                  : "border-navy-100 bg-white hover:border-gold-200"
              }`}
            >
              <div>
                <p className="flex items-center gap-2 text-[15px] font-extrabold text-navy-900">
                  {enAvant && <Icon name="bolt" className="size-4 text-gold-600" />}
                  {saison.label}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600">
                  {saison.blurb}
                </p>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-navy-500 group-hover:text-gold-700">
                {counts[saison.id]} offre{counts[saison.id] > 1 ? "s" : ""}
                <Icon name="chevronRight" className="size-3.5" />
              </p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

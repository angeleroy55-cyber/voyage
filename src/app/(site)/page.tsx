import HeroCarousel from "@/components/home/HeroCarousel";
import TrustBar from "@/components/home/TrustBar";
import Selections from "@/components/home/Selections";
import OfferRail from "@/components/home/OfferRail";
import DestinationGrid from "@/components/home/DestinationGrid";
import PopularBookings from "@/components/home/PopularBookings";
import Newsletter from "@/components/home/Newsletter";
import Benefits from "@/components/home/Benefits";
import GiftCard from "@/components/home/GiftCard";
import Testimonials from "@/components/home/Testimonials";
import BlogSection from "@/components/home/BlogSection";
import VideoSection from "@/components/home/VideoSection";
import SeasonRail from "@/components/home/SeasonRail";
import SearchWidget from "@/components/search/SearchWidget";
import Reveal from "@/components/ui/Reveal";
import { SEASONS, inSeason } from "@/lib/seasons";
import {
  getBestDeals,
  getDestinations,
  getOffers,
  getPosts,
  getReviews,
  getRuleOffers,
  getSearchCategories,
  getSettings,
} from "@/server/catalogue";

// Le contenu vient de la base : il est relu à chaque requête, sinon une
// publication faite au back-office ne remonterait qu'au prochain déploiement.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [deals, lastMinute, france, all, destinations, reviews, posts, settings, categories] =
    await Promise.all([
      getBestDeals(8),
      getRuleOffers("derniere-minute", 8),
      // Séjours France est mis en avant ici sans occuper une entrée de menu :
      // c'est la compensation prévue par le cahier, la cible étant française à
      // plus de la moitié, sans créer d'URL qui cannibaliserait Séjours.
      getRuleOffers("france", 8),
      getOffers(),
      getDestinations(),
      getReviews(6),
      getPosts(4),
      getSettings(),
      getSearchCategories(),
    ]);

  // Volume réel par saison, compté une seule fois sur le catalogue déjà chargé
  // plutôt que par huit requêtes d'agrégation supplémentaires.
  const saisonnier: Record<string, number> = {};
  for (const saison of SEASONS) {
    saisonnier[saison.id] = all.filter(
      (offre) =>
        offre.departureDate &&
        inSeason(new Date(`${offre.departureDate}T12:00:00`), saison),
    ).length;
  }

  const topBooked = [...all]
    .filter((offer) => offer.category !== "location-voiture")
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 9);

  // Les rayons suivent les catégories actives : en désactiver une au
  // back-office retire sa section, sans laisser de slug codé en dur derrière.
  const RAILS: { slug: string; title: string; subtitle: string }[] = [
    {
      slug: "croisieres",
      title: "Croisières au départ d'Europe",
      subtitle: "Pension complète, escales et animations comprises.",
    },
    {
      slug: "circuits",
      title: "Circuits accompagnés",
      subtitle: "Guide francophone, transferts et visites principales inclus.",
    },
    {
      slug: "camping-escapades",
      title: "Camping et escapades en famille",
      subtitle: "Mobil-homes équipés, espaces aquatiques et week-ends prolongés.",
    },
  ];

  const rails = RAILS.filter((rail) => categories.some((c) => c.id === rail.slug)).map((rail) => ({
    ...rail,
    offers: all.filter((offer) => offer.category === rail.slug),
  })).filter((rail) => rail.offers.length > 0);

  return (
    <>
      {/* Bandeau d'accroche : le moteur de recherche chevauche le carrousel. */}
      <div className="bg-linear-to-b from-navy-800 to-navy-700 pb-24 pt-8">
        <div className="mx-auto max-w-page px-4">
          <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            {settings["hero.title"] || "Où partez-vous ?"}
          </h1>
          <p className="mt-1.5 text-sm text-white sm:text-base">
            {settings["hero.subtitle"] ||
              "Vols, hôtels, croisières, circuits et campings : comparés et réservés en une seule fois."}
          </p>
        </div>
        <div className="mx-auto mt-5 max-w-page px-4">
          <SearchWidget categories={categories} />
        </div>
      </div>

      <div className="mx-auto -mt-16 max-w-page px-4">
        <HeroCarousel />
      </div>

      <Reveal variant="fade" className="mt-10">
        <TrustBar />
      </Reveal>

      {/* Chaque bloc apparaît en remontant lorsqu'il entre dans le champ de
          vision ; la page reste entièrement lisible sans JavaScript et les
          animations se désactivent si le système le demande (cf. Reveal). */}
      <div className="space-y-14 py-14">
        <Reveal>
          <Selections />
        </Reveal>

        {/* L'ordre suit le cahier : l'urgence d'abord, la remise ensuite, le
            large en dernier. Chaque rayon renvoie vers sa propre page, qui
            porte la liste complète. */}
        {lastMinute.length > 0 && (
          <Reveal>
            <OfferRail
              title="Départs de dernière minute"
              subtitle="Moins de trois semaines avant le départ, aux derniers prix."
              href="/derniere-minute"
              offers={lastMinute}
            />
          </Reveal>
        )}

        {deals.length > 0 && (
          <Reveal>
            <OfferRail
              title="Les meilleures remises du moment"
              subtitle="Stocks limités, prix valables jusqu'à épuisement."
              href="/bons-plans-promos"
              offers={deals}
            />
          </Reveal>
        )}

        <Reveal>
          <SeasonRail counts={saisonnier} />
        </Reveal>

        <Reveal>
          <DestinationGrid destinations={destinations} />
        </Reveal>

        {/* Les rayons thématiques s'intercalent avant le bloc « populaires » ;
            l'inscription reste après, une fois quelques offres parcourues. */}
        {rails.slice(0, 2).map((rail) => (
          <Reveal key={rail.slug}>
            <OfferRail
              title={rail.title}
              subtitle={rail.subtitle}
              href={`/${rail.slug}`}
              offers={rail.offers}
            />
          </Reveal>
        ))}

        <Reveal>
          <PopularBookings offers={topBooked} />
        </Reveal>

        <Reveal variant="zoom">
          <Newsletter />
        </Reveal>

        {rails.slice(2).map((rail) => (
          <Reveal key={rail.slug}>
            <OfferRail
              title={rail.title}
              subtitle={rail.subtitle}
              href={`/${rail.slug}`}
              offers={rail.offers}
            />
          </Reveal>
        ))}

        {france.length > 0 && (
          <Reveal>
            <OfferRail
              title="Séjours en France"
              subtitle="Littoral, montagne et villes d'art, sans avion ni formalités."
              href="/sejours-france"
              offers={france}
            />
          </Reveal>
        )}

        <Reveal>
          <VideoSection />
        </Reveal>

        <Reveal>
          <Benefits />
        </Reveal>

        <Reveal variant="zoom">
          <GiftCard />
        </Reveal>

        {reviews.length > 0 && (
          <Reveal>
            <Testimonials reviews={reviews} />
          </Reveal>
        )}

        {posts.length > 0 && (
          <Reveal>
            <BlogSection posts={posts} />
          </Reveal>
        )}
      </div>
    </>
  );
}

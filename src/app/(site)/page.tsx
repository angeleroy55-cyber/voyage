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
import SearchWidget from "@/components/search/SearchWidget";
import {
  getBestDeals,
  getDestinations,
  getOffers,
  getPosts,
  getReviews,
  getSettings,
} from "@/server/catalogue";

// Le contenu vient de la base : il est relu à chaque requête, sinon une
// publication faite au back-office ne remonterait qu'au prochain déploiement.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [deals, cruises, tours, camping, all, destinations, reviews, posts, settings] =
    await Promise.all([
      getBestDeals(8),
      getOffers("croisieres"),
      getOffers("circuits"),
      getOffers("campings"),
      getOffers(),
      getDestinations(),
      getReviews(6),
      getPosts(4),
      getSettings(),
    ]);

  const topBooked = [...all]
    .filter((offer) => offer.category !== "voitures")
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 9);

  return (
    <>
      {/* Bandeau d'accroche : le moteur de recherche chevauche le carrousel. */}
      <div className="bg-linear-to-b from-navy-800 to-navy-700 pb-24 pt-8">
        <div className="mx-auto max-w-page px-4">
          <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            {settings["hero.title"] || "Où partez-vous ?"}
          </h1>
          <p className="mt-1.5 text-sm text-navy-100 sm:text-base">
            {settings["hero.subtitle"] ||
              "Vols, hôtels, croisières, circuits et campings — comparés et réservés en une seule fois."}
          </p>
        </div>
        <div className="mx-auto mt-5 max-w-page px-4">
          <SearchWidget />
        </div>
      </div>

      <div className="mx-auto -mt-16 max-w-page px-4">
        <HeroCarousel />
      </div>

      <div className="mt-10">
        <TrustBar />
      </div>

      <div className="space-y-14 py-14">
        <Selections />

        {deals.length > 0 && (
          <OfferRail
            title="Les meilleures remises du moment"
            subtitle="Stocks limités, prix valables jusqu'à épuisement."
            href="/recherche/vol-hotel"
            offers={deals}
          />
        )}

        <DestinationGrid destinations={destinations} />

        {cruises.length > 0 && (
          <OfferRail
            title="Croisières au départ d'Europe"
            subtitle="Pension complète, escales et animations comprises."
            href="/recherche/croisieres"
            offers={cruises}
          />
        )}

        {tours.length > 0 && (
          <OfferRail
            title="Circuits accompagnés"
            subtitle="Guide francophone, transferts et visites principales inclus."
            href="/recherche/circuits"
            offers={tours}
          />
        )}

        <PopularBookings offers={topBooked} />

        <Newsletter />

        {camping.length > 0 && (
          <OfferRail
            title="Campings et clubs en famille"
            subtitle="Mobil-homes équipés, espaces aquatiques et clubs enfants."
            href="/recherche/campings"
            offers={camping}
          />
        )}

        <Benefits />

        <GiftCard />

        {reviews.length > 0 && <Testimonials reviews={reviews} />}

        {posts.length > 0 && <BlogSection posts={posts} />}
      </div>
    </>
  );
}

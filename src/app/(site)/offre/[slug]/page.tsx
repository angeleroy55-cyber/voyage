import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FavouriteButton from "@/components/account/FavouriteButton";
import BookingBox from "@/components/offer/BookingBox";
import ReviewSection from "@/components/offer/ReviewSection";
import Icon from "@/components/ui/Icon";
import OfferCard, { RatingBadge, Stars } from "@/components/ui/OfferCard";
import { getFavouriteSlugs } from "@/server/account";
import { getCustomerSession } from "@/server/customer-session";
import { getCategories, getOfferBySlug, getOfferReviews, getOffers, getPublishedOfferSlugs } from "@/server/catalogue";
import { departureLabel, durationFull } from "@/lib/format";
import { galleryWithMediaFallback } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPublishedOfferSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/offre/[slug]">) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Offre introuvable" };
  return { title: `${offer.title} · ${offer.destination}`, description: offer.description };
}

/** Date `AAAA-MM-JJ` héritée du moteur de recherche, sinon chaîne vide. */
function readDate(value: string | string[] | undefined): string {
  const raw = String(Array.isArray(value) ? value[0] : (value ?? ""));
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

export default async function OfferPage({ params, searchParams }: PageProps<"/offre/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  const [categories, reviews, sameCategory, session] = await Promise.all([
    getCategories(),
    getOfferReviews(slug),
    getOffers(offer.category),
    getCustomerSession(),
  ]);

  // Le bouton « favori » n'apparaît que pour un visiteur connecté : sans compte,
  // il n'y aurait nulle part où enregistrer la sélection.
  const favouriteSlugs = session ? await getFavouriteSlugs(session.sub) : [];

  const category = categories.find((c) => c.slug === offer.category);
  const gallery = galleryWithMediaFallback(offer.images, offer.image);
  const related = sameCategory.filter((o) => o.slug !== offer.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-page px-4 py-6">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <Link href={`/${offer.category}`} className="hover:text-gold-700">
          {category?.label}
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">{offer.destination}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              {offer.title}
            </h1>
            <Stars count={offer.stars} />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-600">
            <Icon name="pin" className="size-4 text-gold-600" />
            {offer.destination}, {offer.country} · {offer.region}
          </p>
          {/* Deuxième des quatre endroits où le cahier impose le numéro :
              carte, fiche, tunnel, confirmation. C'est celui que le client a
              sous les yeux quand il appelle le service client. */}
          <p className="mt-1 font-mono text-xs text-navy-500">
            Réf. <span className="font-semibold text-navy-700">{offer.reference}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RatingBadge score={offer.rating} reviews={offer.reviews} />
          {session && (
            <FavouriteButton
              slug={offer.slug}
              initial={favouriteSlugs.includes(offer.slug)}
              variant="inline"
            />
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-5 grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
        <div className="relative aspect-16/10 md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-80">
          <Image
            src={gallery[0]}
            alt={`${offer.title}, vue principale`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        {gallery.slice(1).map((src, i) => (
          <div key={src} className="relative hidden aspect-4/3 md:block">
            <Image
              src={src}
              alt={`${offer.destination}, ${offer.country}, photo ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Mention obligatoire des visuels sous licence libre à attribution.
          Elle est discrète mais présente : sans elle, la licence n'est pas
          respectée, et une photo du domaine public n'en génère aucune. */}
      {offer.imageCredits && offer.imageCredits.length > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-navy-400">
          Photos de la destination :{" "}
          {offer.imageCredits.map((credit, i) => (
            <span key={`${credit.href}-${i}`}>
              {i > 0 && " · "}
              {credit.href ? (
                <a
                  href={credit.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-navy-200 underline-offset-2 hover:text-navy-600"
                >
                  {credit.text}
                </a>
              ) : (
                credit.text
              )}
            </span>
          ))}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <section>
            <h2 className="text-lg font-extrabold text-navy-900">Ce séjour en bref</h2>
            <p className="mt-2 leading-relaxed text-navy-700">{offer.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "clock", label: "Durée", value: durationFull(offer.category, offer.days, offer.nights) },
                { icon: "bed", label: "Formule", value: offer.board },
                // La date ferme prime sur la période commerciale : c'est elle
                // qui ancre la décision, comme sur la carte offre.
                {
                  icon: "calendar",
                  label: offer.departureDate ? "Prochain départ" : "Disponibilité",
                  value: departureLabel(offer.departureDate).replace("Départ le ", "") || offer.dates,
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-navy-100 bg-white p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-500">
                    <Icon name={s.icon} className="size-3.5" />
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-navy-900">{s.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-9">
            <h2 className="text-lg font-extrabold text-navy-900">Les points forts</h2>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {offer.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-teal-500" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-9">
            <h2 className="text-lg font-extrabold text-navy-900">Équipements et services</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {offer.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-1.5 text-sm text-navy-700"
                >
                  {a}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-9 rounded-2xl border border-navy-100 bg-white p-5">
            <h2 className="text-lg font-extrabold text-navy-900">Compris dans le prix</h2>
            <ul className="mt-3 space-y-2">
              {offer.included.map((inc) => (
                <li key={inc} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-teal-500" />
                  {inc}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-navy-100 pt-3 text-xs text-navy-500">
              Non compris : dépenses personnelles, excursions facultatives et assurance annulation
              (proposée à l&apos;étape suivante).
            </p>
          </section>

          <ReviewSection
            offerSlug={offer.slug}
            offerTitle={offer.title}
            reviews={reviews}
          />
        </div>

        <BookingBox
          offer={offer}
          departureDate={readDate(sp.du)}
          returnDate={readDate(sp.au)}
        />
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-extrabold tracking-tight text-navy-900">
          Vous aimerez peut-être aussi
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((o) => (
            <OfferCard key={o.slug} offer={o} />
          ))}
        </div>
      </section>
    </div>
  );
}

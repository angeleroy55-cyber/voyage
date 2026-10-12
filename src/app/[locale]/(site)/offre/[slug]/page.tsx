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
import OfferEssentials from "@/components/offer/OfferEssentials";
import { getCategories, getLegalEntity, getOfferBySlug, getRelatedOffers, getRetiredOffer, getOfferReviews, getPublishedOfferSlugs } from "@/server/catalogue";
import { departureLabel, durationFull } from "@/lib/format";
import { calendarLabels, firstBookableDate, rulesOf } from "@/lib/booking-rules";
import {
  cancellationPolicyFor,
  defaultItinerary,
  defaultNotIncluded,
  defaultPracticalInfo,
} from "@/lib/offer-details";
import { galleryWithMediaFallback } from "@/lib/media";
import { hreflangAlternates } from "@/i18n/config";
import { getRequestLocale, getRequestDictionary } from "@/i18n/server";
import { localizedPath } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPublishedOfferSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/offre/[slug]">) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Offre introuvable" };
  return {
    title: `${offer.title} · ${offer.destination}`,
    description: offer.description,
    alternates: { languages: hreflangAlternates(`/offre/${slug}`) },
  };
}

/** Date `AAAA-MM-JJ` héritée du moteur de recherche, sinon chaîne vide. */
function readDate(value: string | string[] | undefined): string {
  const raw = String(Array.isArray(value) ? value[0] : (value ?? ""));
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

export default async function OfferPage({ params, searchParams }: PageProps<"/[locale]/offre/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getRequestLocale();
  const dict = await getRequestDictionary();
  const offer = await getOfferBySlug(slug);
  if (!offer) {
    // Lien ancien ou partagé vers une offre retirée de la vente : on le dit
    // clairement et on propose la suite, au lieu d'une 404 qui fait croire à
    // un lien cassé ou à une date passée. Une offre supprimée reste en 404.
    const retired = await getRetiredOffer(slug);
    if (!retired) notFound();
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          Cette offre n&apos;est plus en vente
        </h1>
        <p className="mt-3 text-sm text-navy-600">
          « {retired.title} » ({retired.destination}, {retired.country}), réf.{" "}
          <span className="font-mono font-semibold">{retired.reference}</span>, a été retirée du
          catalogue. Ce n&apos;est pas une question de date : les dates de départ des offres en
          ligne se renouvellent automatiquement. Si vous aviez fait une demande, elle reste
          consultable dans votre espace client.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {retired.category.active && (
            <Link
              href={localizedPath(`/${retired.category.slug}`, locale)}
              className="rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-900 hover:bg-gold-500"
            >
              Voir les offres {retired.category.label}
            </Link>
          )}
          <Link
            href={localizedPath(`/sejours?q=${encodeURIComponent(retired.destination)}`, locale)}
            className="rounded-xl border border-navy-200 px-5 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50"
          >
            Autres voyages à {retired.destination}
          </Link>
        </div>
      </div>
    );
  }

  const [categories, reviews, related, session, legal] = await Promise.all([
    getCategories(),
    getOfferReviews(slug),
    getRelatedOffers(offer.category, offer.slug, 4),
    getCustomerSession(),
    getLegalEntity(),
  ]);

  // Le bouton « favori » n'apparaît que pour un visiteur connecté : sans compte,
  // il n'y aurait nulle part où enregistrer la sélection.
  const favouriteSlugs = session ? await getFavouriteSlugs(session.sub) : [];

  const category = categories.find((c) => c.slug === offer.category);
  const gallery = galleryWithMediaFallback(offer.images, offer.image);

  // Prochaine date : la date ferme si elle est encore à venir, sinon la
  // première date réellement proposée par le calendrier. Jamais une date
  // passée (voir `upcomingDepartureIso` dans src/server/catalogue.ts).
  const firstOpen = offer.departureDate ? null : firstBookableDate(rulesOf(offer));
  const nextDate = offer.departureDate
    ? {
        // « Prise en charge le » pour une voiture, « Arrivée le » pour un hôtel.
        label: `${calendarLabels(offer.category).date} le`,
        value: departureLabel(offer.departureDate).replace("Départ le ", ""),
      }
    : firstOpen
      ? {
          label: `${calendarLabels(offer.category).date} possible`,
          value: `dès le ${firstOpen.split("-").reverse().join("/")}`,
        }
      : { label: "Disponibilité", value: offer.dates };

  // Compléments : le texte saisi au back-office l'emporte, sinon un texte
  // générique déduit des données de l'offre (src/lib/offer-details.ts).
  const itinerary = offer.itinerary?.length ? offer.itinerary : defaultItinerary(offer);
  const notIncluded = offer.notIncluded?.length ? offer.notIncluded : defaultNotIncluded(offer);
  const practicalInfo = offer.practicalInfo?.length
    ? offer.practicalInfo
    : defaultPracticalInfo(offer);
  const cancellation = cancellationPolicyFor(offer.category);

  return (
    <div className="mx-auto max-w-page px-4 py-6">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <Link href={localizedPath("/", locale)} className="hover:text-gold-700">
          {dict.common.home}
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <Link href={localizedPath(`/${offer.category}`, locale)} className="hover:text-gold-700">
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
                { icon: "calendar", ...nextDate },
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

          <OfferEssentials offer={offer} legal={legal} />

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

          {itinerary.length > 0 && (
            <section className="mt-9">
              <h2 className="text-lg font-extrabold text-navy-900">Programme</h2>
              <ol className="mt-3 space-y-3 border-l-2 border-navy-100 pl-5">
                {itinerary.map((step) => {
                  const [day, ...rest] = step.split(" : ");
                  return (
                    <li key={step} className="relative text-sm text-navy-700">
                      <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-gold-400" />
                      {rest.length > 0 ? (
                        <>
                          <span className="font-bold text-navy-900">{day}</span> : {rest.join(" : ")}
                        </>
                      ) : (
                        step
                      )}
                    </li>
                  );
                })}
              </ol>
              {!offer.itinerary?.length && (
                <p className="mt-3 text-xs text-navy-500">
                  Programme indicatif : l&apos;ordre exact des étapes et des escales est confirmé par
                  votre conseiller avec la réservation.
                </p>
              )}
            </section>
          )}

          <section className="mt-9 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-navy-100 bg-white p-5">
              <h2 className="text-lg font-extrabold text-navy-900">Ce prix comprend</h2>
              <ul className="mt-3 space-y-2">
                {offer.included.map((inc) => (
                  <li key={inc} className="flex items-start gap-2.5 text-sm text-navy-700">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-teal-500" />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-navy-100 bg-white p-5">
              <h2 className="text-lg font-extrabold text-navy-900">Ce prix ne comprend pas</h2>
              <ul className="mt-3 space-y-2">
                {notIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-navy-700">
                    <Icon name="close" className="mt-0.5 size-4 shrink-0 text-navy-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-9">
            <h2 className="text-lg font-extrabold text-navy-900">Informations pratiques</h2>
            <ul className="mt-3 space-y-2.5">
              {practicalInfo.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-gold-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-9 rounded-2xl bg-navy-50 p-5">
            <h2 className="text-lg font-extrabold text-navy-900">Conditions d&apos;annulation</h2>
            <ul className="mt-3 space-y-2">
              {cancellation.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-teal-500" />
                  {item}
                </li>
              ))}
            </ul>
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
            <OfferCard key={o.slug} offer={o} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}

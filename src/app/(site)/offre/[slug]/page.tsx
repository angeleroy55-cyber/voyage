import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingBox from "@/components/offer/BookingBox";
import Icon from "@/components/ui/Icon";
import OfferCard, { RatingBadge, Stars } from "@/components/ui/OfferCard";
import { getCategories, getOfferBySlug, getOffers, getPublishedOfferSlugs, getReviews } from "@/server/catalogue";
import { durationLabel, photo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPublishedOfferSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/offre/[slug]">) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return { title: "Offre introuvable" };
  return { title: `${offer.title} — ${offer.destination}`, description: offer.description };
}

export default async function OfferPage({ params }: PageProps<"/offre/[slug]">) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  const [categories, reviews, sameCategory] = await Promise.all([
    getCategories(),
    getReviews(3),
    getOffers(offer.category),
  ]);

  const category = categories.find((c) => c.slug === offer.category);
  // Une offre sans visuel retombe sur un placeholder deterministe.
  const gallery =
    offer.images && offer.images.length > 0
      ? offer.images
      : [0, 1, 2, 3, 4].map((i) => photo(`${offer.imageSeed}-${i}`, 800, 600));
  const related = sameCategory.filter((o) => o.slug !== offer.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-page px-4 py-6">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <Link href={`/recherche/${offer.category}`} className="hover:text-gold-700">
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
        </div>
        <RatingBadge score={offer.rating} reviews={offer.reviews} />
      </div>

      {/* Gallery */}
      <div className="mt-5 grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
        <div className="relative aspect-16/10 md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-80">
          <Image
            src={gallery[0]}
            alt={`${offer.title} — vue principale`}
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
              alt={`${offer.title} — photo ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover"
            />
            {i === 3 && (
              <div className="absolute inset-0 grid place-items-center bg-navy-900/55 text-sm font-bold text-white">
                +18 photos
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <section>
            <h2 className="text-lg font-extrabold text-navy-900">Ce séjour en bref</h2>
            <p className="mt-2 leading-relaxed text-navy-700">{offer.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "clock", label: "Durée", value: durationLabel(offer.nights, offer.category) },
                { icon: "bed", label: "Formule", value: offer.board },
                { icon: "calendar", label: "Disponibilité", value: offer.dates },
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

          <section className="mt-9">
            <h2 className="text-lg font-extrabold text-navy-900">
              Avis des voyageurs ({offer.reviews.toLocaleString("fr-FR")})
            </h2>
            <div className="mt-3 space-y-3">
              {reviews.map((r) => (
                <figure key={r.author} className="rounded-2xl border border-navy-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <figcaption className="text-sm font-bold text-navy-900">
                      {r.author}
                      <span className="ml-2 font-normal text-navy-500">{r.city}</span>
                    </figcaption>
                    <span className="rounded-lg bg-navy-700 px-2 py-1 text-xs font-bold text-white tabular-nums">
                      {r.score.toFixed(1).replace(".", ",")}
                    </span>
                  </div>
                  <blockquote className="mt-2 text-sm leading-relaxed text-navy-700">
                    « {r.text} »
                  </blockquote>
                  <p className="mt-2 text-xs text-navy-500">Séjour effectué en {r.date}</p>
                </figure>
              ))}
            </div>
          </section>
        </div>

        <BookingBox offer={offer} />
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

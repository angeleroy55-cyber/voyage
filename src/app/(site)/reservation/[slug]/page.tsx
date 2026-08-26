import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/offer/CheckoutForm";
import Icon from "@/components/ui/Icon";
import { getCustomer } from "@/server/account";
import { getCustomerSession } from "@/server/customer-session";
import { getOfferBySlug } from "@/server/catalogue";
import { durationFull, price } from "@/lib/format";
import { withMediaFallback } from "@/lib/media";

/**
 * Étape 2 de la réservation : récapitulatif du séjour, coordonnées du client et
 * choix du moyen de paiement.
 *
 * La composition du séjour arrive par l'URL, depuis l'encart de la fiche offre.
 * Elle est revalidée ici, puis une seconde fois par l'action serveur : rien de
 * ce qui vient du navigateur n'est repris tel quel, le prix compris.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/reservation/[slug]">) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  return {
    title: offer ? `Réserver : ${offer.title}` : "Offre introuvable",
    // Une page de tunnel n'a rien à faire dans un index de moteur de recherche.
    robots: { index: false, follow: false },
  };
}

/** Nombre de voyageurs transmis par l'encart, ramené dans les bornes du site. */
function readTravellers(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) ? Math.min(9, Math.max(1, Math.trunc(n))) : 2;
}

function readDate(value: string | string[] | undefined): string {
  const raw = String(Array.isArray(value) ? value[0] : (value ?? ""));
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

export default async function ReservationPage({
  params,
  searchParams,
}: PageProps<"/reservation/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  // Un visiteur déjà connecté ne ressaisit pas ce que son compte contient déjà.
  const session = await getCustomerSession();
  const customer = session ? await getCustomer(session.sub) : null;

  const travellers = readTravellers(sp.voyageurs);
  const insurance = sp.assurance === "1" || sp.assurance === "on";
  const departureDate = readDate(sp.du);
  const returnDate = readDate(sp.au);

  const cover = withMediaFallback(offer.images?.[0] ?? offer.image);

  return (
    <div className="mx-auto max-w-page px-4 py-6">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <Link href={`/offre/${offer.slug}`} className="hover:text-gold-700">
          {offer.title}
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Réservation</span>
      </nav>

      <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {[
          { step: 1, label: "Votre séjour", done: true },
          { step: 2, label: "Coordonnées et paiement", done: false },
          { step: 3, label: "Confirmation", done: false },
        ].map((s, i) => (
          <li key={s.step} className="flex items-center gap-2">
            {i > 0 && <Icon name="chevronRight" className="size-3 text-navy-300" />}
            <span
              className={
                s.step === 2
                  ? "rounded-full bg-navy-900 px-3 py-1 text-white"
                  : s.done
                    ? "rounded-full bg-teal-50 px-3 py-1 text-teal-700"
                    : "rounded-full bg-navy-50 px-3 py-1 text-navy-500"
              }
            >
              {s.done ? "✓ " : `${s.step}. `}
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        Finalisez votre demande
      </h1>
      <p className="mt-1.5 text-sm text-navy-600">
        Il reste vos coordonnées et le moyen de paiement souhaité. Aucun montant n&apos;est débité
        maintenant : le règlement n&apos;intervient qu&apos;après confirmation des disponibilités.
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          offer={offer}
          travellers={travellers}
          insurance={insurance}
          departureDate={departureDate}
          returnDate={returnDate}
          customer={
            customer
              ? {
                  name: [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim(),
                  email: customer.email,
                  phone: customer.phone,
                }
              : null
          }
        />

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
              Votre séjour
            </h2>

            <div className="mt-3 flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={cover}
                  alt={`${offer.title}, vue principale`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-navy-900">{offer.title}</p>
                {/* Troisième des quatre endroits imposés par le cahier : le
                    numéro suit le client du listing jusqu'au règlement. */}
                <p className="mt-0.5 font-mono text-[11px] text-navy-400">
                  Réf. {offer.reference}
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  {offer.destination}, {offer.country}
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  {durationFull(offer.category, offer.days, offer.nights)} · {offer.board}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-navy-100 pt-4 text-sm">
              <div className="flex justify-between text-navy-600">
                <dt>Voyageurs</dt>
                <dd className="font-semibold text-navy-800">{travellers}</dd>
              </div>
              <div className="flex justify-between text-navy-600">
                <dt>Dates souhaitées</dt>
                <dd className="font-semibold text-navy-800">
                  {departureDate ? departureDate.split("-").reverse().join("/") : "À définir"}
                </dd>
              </div>
              <div className="flex justify-between text-navy-600">
                <dt>Départ de</dt>
                <dd className="font-semibold text-navy-800">{offer.departureCity}</dd>
              </div>
            </dl>

            <p className="mt-4 border-t border-navy-100 pt-3 text-xs text-navy-500">
              Prix unitaire {price(offer.price)} par personne, taxes incluses. Le total tenant compte
              de l&apos;assurance est repris dans le formulaire.
            </p>

            <Link
              href={`/offre/${offer.slug}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700 hover:underline"
            >
              Modifier le séjour
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { getCustomerSession } from "@/server/customer-session";
import { sendBookingCreatedEmails, sendNewsletterWelcomeEmail } from "@/server/mail";
import { bookingReference } from "@/lib/reference";
import { PAYMENT_CHOICES } from "@/lib/constants";
import { leadDaysFor, priceForDate } from "@/lib/pricing";

/**
 * Écritures déclenchées par les visiteurs du site public.
 *
 * Aucune de ces actions n'exige de session : ce sont des formulaires ouverts.
 * En contrepartie, tout ce qui en sort arrive en base au statut « en attente »
 * et n'est visible qu'après passage au back-office.
 */

export type FormState = { ok: boolean; message: string };

function email(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Chaîne `AAAA-MM-JJ` transmise par le formulaire, sinon vide. */
function readDateIso(value: FormDataEntryValue | null): string {
  const raw = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

/** Date `AAAA-MM-JJ` transmise par le moteur de recherche, sinon `null`. */
function readDate(value: FormDataEntryValue | null): Date | null {
  const iso = readDateIso(value);
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createBooking(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const offerSlug = String(formData.get("offerSlug") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = email(formData.get("customerEmail"));
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const travellers = Math.min(9, Math.max(1, Number(formData.get("travellers")) || 1));
  const insurance = formData.get("insurance") === "on";
  const paymentMethod = String(formData.get("paymentMethod") ?? "");

  if (!customerName) return { ok: false, message: "Merci d'indiquer votre nom." };
  if (!EMAIL_PATTERN.test(customerEmail)) {
    return { ok: false, message: "Cette adresse e-mail ne semble pas valide." };
  }
  // Le `required` du formulaire ne protège de rien : la liste des moyens
  // acceptés est celle du site, vérifiée ici.
  if (!PAYMENT_CHOICES.some((m) => m.id === paymentMethod)) {
    return { ok: false, message: "Merci de choisir un moyen de paiement." };
  }
  if (formData.get("terms") !== "on") {
    return { ok: false, message: "Merci d'accepter les conditions de vente pour continuer." };
  }

  const offer = await prisma.offer.findFirst({
    where: { slug: offerSlug, status: "published" },
    select: { id: true, price: true, title: true, category: { select: { slug: true } } },
  });
  if (!offer) {
    return { ok: false, message: "Cette offre n'est plus disponible." };
  }

  // Dates issues du moteur de recherche ou du calendrier de la fiche offre.
  // Une valeur illisible est ignorée plutôt que refusée : ce sont des dates
  // souhaitées, confirmées ensuite par un conseiller.
  const departureDateIso = readDateIso(formData.get("departureDate"));
  const departureDate = readDate(formData.get("departureDate"));
  const returnDate = readDate(formData.get("returnDate"));

  // Même délai minimum que celui affiché sur le calendrier de la fiche offre
  // (DepartureCalendar) : une date trop proche envoyée en contournant
  // l'interface est refusée plutôt que silencieusement acceptée.
  if (departureDateIso) {
    const lead = leadDaysFor(offer.category?.slug ?? "");
    if (lead > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + lead);
      const picked = new Date(`${departureDateIso}T00:00:00`);
      if (picked < minDate) {
        return {
          ok: false,
          message: `Cette offre demande un départ au moins ${lead} jours après la date de la demande.`,
        };
      }
    }
  }

  // Le total est recalculé côté serveur à partir du prix en base, jamais de
  // celui envoyé par le formulaire : modifiable depuis le navigateur, il
  // n'est donc pas une source fiable. La variation par date de départ suit la
  // même règle que celle affichée au client (voir src/lib/pricing.ts), pour
  // que le montant facturé soit toujours celui qui a été montré.
  const effectivePrice = departureDateIso
    ? priceForDate(offer.price, departureDateIso)
    : offer.price;
  const insurancePerPerson = Math.round(effectivePrice * 0.06);
  const totalPrice = travellers * (effectivePrice + (insurance ? insurancePerPerson : 0));

  // Un visiteur connecté voit sa demande rattachée à son espace client ; sinon
  // le rattachement se fera à l'inscription, sur l'adresse e-mail.
  const session = await getCustomerSession();

  const instalments = formData.get("instalments") === "4" ? 4 : 1;

  const booking = await prisma.booking.create({
    data: {
      reference: bookingReference(),
      offerId: offer.id,
      customerId: session?.sub ?? null,
      customerName,
      customerEmail,
      customerPhone,
      travellers,
      insurance,
      totalPrice,
      instalments,
      paymentMethod,
      departureDate,
      returnDate,
      notes: String(formData.get("notes") ?? "").trim().slice(0, 500),
      status: "pending",
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  if (session) {
    revalidatePath("/compte/reservations");
    revalidatePath("/compte/tableau-de-bord");
  }

  await sendBookingCreatedEmails(booking.id, "site");

  // La confirmation est une page à part entière : elle survit à un rechargement
  // et à un partage de lien, ce qu'un message rendu dans le formulaire ne fait
  // pas. `redirect` lève une exception traitée par Next, donc rien ne suit.
  redirect(`/reservation/confirmee/${booking.reference}`);
}

export async function subscribe(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const address = email(formData.get("email"));
  if (!EMAIL_PATTERN.test(address)) {
    return { ok: false, message: "Cette adresse e-mail ne semble pas valide." };
  }

  const interests = formData.getAll("interests").map(String).filter(Boolean);

  // Une réinscription met à jour les centres d'intérêt au lieu d'échouer sur
  // la contrainte d'unicité.
  await prisma.subscriber.upsert({
    where: { email: address },
    update: { interests },
    create: { email: address, interests },
  });

  revalidatePath("/admin/abonnes");

  await sendNewsletterWelcomeEmail({ email: address, interests });

  return {
    ok: true,
    message: interests.length
      ? `Inscription confirmée pour ${address} : ${interests.join(", ").toLowerCase()}.`
      : `Inscription confirmée pour ${address}.`,
  };
}

export async function submitReview(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const author = String(formData.get("author") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const score = Math.min(10, Math.max(0, Number(formData.get("score")) || 0));
  const offerSlug = String(formData.get("offerSlug") ?? "");

  if (author.length < 2) return { ok: false, message: "Merci d'indiquer votre nom." };
  if (text.length < 20) {
    return { ok: false, message: "Merci de détailler un peu votre avis (20 caractères minimum)." };
  }

  const offer = await prisma.offer.findUnique({
    where: { slug: offerSlug },
    select: { id: true },
  });

  await prisma.review.create({
    data: {
      author,
      city: String(formData.get("city") ?? "").trim(),
      score,
      text,
      trip: String(formData.get("trip") ?? "").trim(),
      offerId: offer?.id ?? null,
      // Rien n'apparaît sur le site sans passage par la modération.
      status: "pending",
    },
  });

  revalidatePath("/admin/avis");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Merci ! Votre avis est en cours de relecture avant publication.",
  };
}

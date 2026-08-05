"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";
import { getCustomerSession } from "@/server/customer-session";

/**
 * Écritures déclenchées par les visiteurs du site public.
 *
 * Aucune de ces actions n'exige de session : ce sont des formulaires ouverts.
 * En contrepartie, tout ce qui en sort arrive en base au statut « en attente »
 * et n'est visible qu'après passage au back-office.
 */

export type FormState = { ok: boolean; message: string };

/** Référence lisible communiquée au client, sans caractères ambigus (0/O, 1/I). */
function bookingReference(): string {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `GS-${suffix}`;
}

function email(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Date `AAAA-MM-JJ` transmise par le moteur de recherche, sinon `null`. */
function readDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T12:00:00`);
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

  if (!customerName) return { ok: false, message: "Merci d'indiquer votre nom." };
  if (!EMAIL_PATTERN.test(customerEmail)) {
    return { ok: false, message: "Cette adresse e-mail ne semble pas valide." };
  }

  const offer = await prisma.offer.findFirst({
    where: { slug: offerSlug, status: "published" },
    select: { id: true, price: true, title: true },
  });
  if (!offer) {
    return { ok: false, message: "Cette offre n'est plus disponible." };
  }

  // Le total est recalculé côté serveur : un prix envoyé par le formulaire
  // serait modifiable depuis le navigateur.
  const insurancePerPerson = Math.round(offer.price * 0.06);
  const totalPrice = travellers * (offer.price + (insurance ? insurancePerPerson : 0));

  // Un visiteur connecté voit sa demande rattachée à son espace client ; sinon
  // le rattachement se fera à l'inscription, sur l'adresse e-mail.
  const session = await getCustomerSession();

  // Dates issues du moteur de recherche, quand la fiche a été atteinte depuis
  // une recherche datée. Une valeur illisible est ignorée plutôt que refusée :
  // ce sont des dates souhaitées, confirmées ensuite par un conseiller.
  const departureDate = readDate(formData.get("departureDate"));
  const returnDate = readDate(formData.get("returnDate"));

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
      departureDate,
      returnDate,
      status: "pending",
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  if (session) {
    revalidatePath("/compte/reservations");
    revalidatePath("/compte/tableau-de-bord");
  }

  return {
    ok: true,
    message: session
      ? `Demande enregistrée sous la référence ${booking.reference}. Elle apparaît dès maintenant dans votre espace client.`
      : `Demande enregistrée sous la référence ${booking.reference}. Un conseiller vous recontacte sous 24 h.`,
  };
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

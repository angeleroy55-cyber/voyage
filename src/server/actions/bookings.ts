"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import {
  sendBookingCreatedEmails,
  sendBookingStatusUpdateEmail,
  sendPaymentReceiptEmail,
} from "@/server/mail";
import { bookingReference } from "@/lib/reference";
import { PAYMENT_CHOICES } from "@/lib/constants";

/**
 * Réservations pilotées depuis le back-office.
 *
 * Le site public ne sait créer qu'une demande en ligne, au total calculé par le
 * serveur. Ici c'est l'inverse : un conseiller saisit ce qu'il a négocié au
 * téléphone, donc le montant est libre. Les garde-fous portent sur ce qui doit
 * rester cohérent quoi qu'il arrive — le réglé ne dépasse pas le dû, et le moyen
 * de paiement appartient à la liste du site.
 */

function refresh(id?: string) {
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/reservations/${id}`);
  // La fiche du client affiche l'historique : elle se périme aussi.
  revalidatePath("/admin/clients", "layout");
  revalidatePath("/compte", "layout");
}

/** Date `AAAA-MM-JJ` du formulaire, sinon `null`. */
function readDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readFields(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim().toLowerCase();
  const paymentMethod = String(formData.get("paymentMethod") ?? "");

  return {
    customerName,
    customerEmail,
    customerPhone: String(formData.get("customerPhone") ?? "").trim(),
    travellers: Math.min(20, Math.max(1, Math.round(Number(formData.get("travellers")) || 1))),
    insurance: formData.get("insurance") === "on",
    totalPrice: Math.max(0, Math.round(Number(formData.get("totalPrice")) || 0)),
    instalments: String(formData.get("instalments")) === "4" ? 4 : 1,
    paymentMethod: PAYMENT_CHOICES.some((m) => m.id === paymentMethod) ? paymentMethod : "",
    departureDate: readDate(formData.get("departureDate")),
    returnDate: readDate(formData.get("returnDate")),
    notes: String(formData.get("notes") ?? "").trim().slice(0, 2000),
    status: String(formData.get("status") ?? "pending"),
  };
}

export async function createBookingByAdmin(formData: FormData) {
  await requireSession();

  const fields = readFields(formData);
  if (!fields.customerName) redirect("/admin/reservations?erreur=nom&nouvelle=1");
  if (!EMAIL_PATTERN.test(fields.customerEmail)) {
    redirect("/admin/reservations?erreur=email&nouvelle=1");
  }

  const offerId = String(formData.get("offerId") ?? "");
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, select: { id: true } });
  if (!offer) redirect("/admin/reservations?erreur=offre&nouvelle=1");

  // Le rattachement à un espace client est facultatif : beaucoup d'appels
  // viennent de gens qui n'ont pas de compte. Quand l'adresse correspond à un
  // compte existant, on relie pour que la réservation apparaisse chez lui.
  const customer = await prisma.customer.findUnique({
    where: { email: fields.customerEmail },
    select: { id: true },
  });

  const booking = await prisma.booking.create({
    data: {
      ...fields,
      reference: bookingReference(),
      offerId: offer.id,
      customerId: customer?.id ?? null,
      paidAmount: Math.min(
        fields.totalPrice,
        Math.max(0, Math.round(Number(formData.get("paidAmount")) || 0)),
      ),
    },
  });

  await sendBookingCreatedEmails(booking.id, "back-office");

  refresh();
  redirect(`/admin/reservations?q=${booking.reference}&cree=1`);
}

export async function updateBooking(id: string, formData: FormData) {
  await requireSession();

  const fields = readFields(formData);
  if (!fields.customerName) redirect(`/admin/reservations?erreur=nom&q=${id}`);
  if (!EMAIL_PATTERN.test(fields.customerEmail)) {
    redirect(`/admin/reservations?erreur=email&q=${id}`);
  }

  const current = await prisma.booking.findUnique({
    where: { id },
    select: { paidAmount: true, reference: true, status: true },
  });
  if (!current) redirect("/admin/reservations?erreur=introuvable");

  await prisma.booking.update({
    where: { id },
    data: {
      ...fields,
      // Baisser le total sous le montant déjà encaissé laisserait un solde
      // négatif : on ramène le réglé au nouveau total plutôt que de refuser.
      paidAmount: Math.min(current.paidAmount, fields.totalPrice),
    },
  });

  if (current.status !== fields.status) {
    await sendBookingStatusUpdateEmail(id);
  }

  refresh(id);
  redirect(`/admin/reservations?q=${current.reference}&enregistre=1`);
}

/** Encaissement d'une échéance : le montant s'ajoute au déjà réglé. */
export async function recordPayment(id: string, formData: FormData) {
  await requireSession();

  const amount = Math.round(Number(formData.get("amount")) || 0);
  if (amount === 0) redirect(`/admin/reservations?erreur=montant&q=${id}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { paidAmount: true, totalPrice: true, reference: true },
  });
  if (!booking) redirect("/admin/reservations?erreur=introuvable");

  const next = booking.paidAmount + amount;
  if (next < 0 || next > booking.totalPrice) {
    redirect(`/admin/reservations?erreur=solde&q=${booking.reference}`);
  }

  await prisma.booking.update({ where: { id }, data: { paidAmount: next } });
  await sendPaymentReceiptEmail(id, amount);

  refresh(id);
  redirect(`/admin/reservations?q=${booking.reference}&regle=1`);
}

export async function deleteBooking(id: string) {
  await requireSession();
  await prisma.booking.delete({ where: { id } });
  refresh();
  redirect("/admin/reservations?supprime=1");
}

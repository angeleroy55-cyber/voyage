"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/server/auth";
import { prisma } from "@/server/prisma";
import {
  closeCustomerSession,
  getCustomerSession,
  openCustomerSession,
  requireCustomer,
} from "@/server/customer-session";

/**
 * Écritures de l'espace client : inscription, connexion, profil, favoris et
 * demandes d'annulation.
 *
 * Chaque action qui touche à une réservation la relit d'abord en filtrant sur
 * `customerId` : passer une référence appartenant à quelqu'un d'autre ne donne
 * donc accès à rien, quel que soit le formulaire envoyé.
 */

export type FormState = { ok: boolean; message: string; field?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

function normalise(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ") || "Voyageur";
}

// ---- Accès ----------------------------------------------------------------

export async function registerCustomer(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = normalise(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = normalise(formData.get("firstName"));
  const lastName = normalise(formData.get("lastName"));

  if (!firstName) return { ok: false, message: "Merci d'indiquer votre prénom.", field: "firstName" };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "Cette adresse e-mail ne semble pas valide.", field: "email" };
  }
  if (password.length < MIN_PASSWORD) {
    return {
      ok: false,
      message: `Choisissez un mot de passe d'au moins ${MIN_PASSWORD} caractères.`,
      field: "password",
    };
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "Un compte existe déjà avec cette adresse. Connectez-vous plutôt.",
      field: "email",
    };
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      firstName,
      lastName,
      phone: normalise(formData.get("phone")),
      passwordHash: hashPassword(password),
      newsletter: formData.get("newsletter") === "on",
    },
  });

  // Une réservation passée avant la création du compte, avec la même adresse,
  // est rattachée : le voyageur retrouve son historique dès la première visite.
  await prisma.booking.updateMany({
    where: { customerEmail: email, customerId: null },
    data: { customerId: customer.id },
  });

  await openCustomerSession({
    id: customer.id,
    email: customer.email,
    name: fullName(customer.firstName, customer.lastName),
  });

  redirect("/compte/tableau-de-bord");
}

export async function loginCustomer(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = normalise(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");

  const customer = await prisma.customer.findUnique({ where: { email } });

  // Même message et même travail cryptographique dans les deux cas : sans cela,
  // la page indiquerait quelles adresses possèdent un compte.
  const stored = customer?.passwordHash ?? hashPassword("mot-de-passe-inexistant");
  const valid = verifyPassword(password, stored);

  if (!customer || !customer.active || !valid) {
    return { ok: false, message: "Adresse e-mail ou mot de passe incorrect." };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  await openCustomerSession({
    id: customer.id,
    email: customer.email,
    name: fullName(customer.firstName, customer.lastName),
  });

  redirect("/compte/tableau-de-bord");
}

export async function logoutCustomer(): Promise<void> {
  await closeCustomerSession();
  redirect("/compte");
}

// ---- Profil ----------------------------------------------------------------

export async function updateProfile(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireCustomer();

  const firstName = normalise(formData.get("firstName"));
  if (!firstName) return { ok: false, message: "Le prénom ne peut pas être vide.", field: "firstName" };

  await prisma.customer.update({
    where: { id: session.sub },
    data: {
      firstName,
      lastName: normalise(formData.get("lastName")),
      phone: normalise(formData.get("phone")),
      city: normalise(formData.get("city")),
      newsletter: formData.get("newsletter") === "on",
    },
  });

  revalidatePath("/compte/profil");
  revalidatePath("/compte/tableau-de-bord");
  return { ok: true, message: "Vos informations ont été enregistrées." };
}

export async function changePassword(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireCustomer();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < MIN_PASSWORD) {
    return {
      ok: false,
      message: `Le nouveau mot de passe doit faire au moins ${MIN_PASSWORD} caractères.`,
      field: "newPassword",
    };
  }
  if (next !== confirm) {
    return { ok: false, message: "Les deux saisies ne correspondent pas.", field: "confirmPassword" };
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer || !verifyPassword(current, customer.passwordHash)) {
    return { ok: false, message: "Le mot de passe actuel est incorrect.", field: "currentPassword" };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: hashPassword(next) },
  });

  return { ok: true, message: "Mot de passe mis à jour." };
}

// ---- Favoris ---------------------------------------------------------------

/**
 * Bascule une offre en favori. Renvoie l'état obtenu pour que le bouton reflète
 * la base plutôt que sa propre supposition.
 */
export async function toggleFavourite(offerSlug: string): Promise<{ favourite: boolean }> {
  const session = await getCustomerSession();
  if (!session) return { favourite: false };

  const offer = await prisma.offer.findUnique({
    where: { slug: offerSlug },
    select: { id: true },
  });
  if (!offer) return { favourite: false };

  const existing = await prisma.favourite.findUnique({
    where: { customerId_offerId: { customerId: session.sub, offerId: offer.id } },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favourite.create({ data: { customerId: session.sub, offerId: offer.id } });
  }

  revalidatePath("/compte/favoris");
  return { favourite: !existing };
}

// ---- Réservations ----------------------------------------------------------

export async function requestCancellation(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireCustomer();
  const reference = normalise(formData.get("reference"));

  const booking = await prisma.booking.findFirst({
    where: { reference, customerId: session.sub },
  });
  if (!booking) {
    return { ok: false, message: "Réservation introuvable." };
  }
  if (booking.status === "cancelled") {
    return { ok: false, message: "Cette réservation est déjà annulée." };
  }
  if (booking.status === "completed") {
    return { ok: false, message: "Ce voyage est terminé : il ne peut plus être annulé." };
  }

  const reason = normalise(formData.get("reason"));
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "cancelled",
      // La demande est conservée en clair dans les notes : le back-office la
      // relit telle quelle avant de traiter le remboursement.
      notes: [booking.notes, reason && `Annulation demandée par le client : ${reason}`]
        .filter(Boolean)
        .join("\n"),
    },
  });

  revalidatePath("/compte/reservations");
  revalidatePath(`/compte/reservations/${reference}`);
  revalidatePath("/admin/reservations");

  return {
    ok: true,
    message:
      "Votre demande d'annulation est enregistrée. Un conseiller confirme le remboursement sous 48 h.",
  };
}

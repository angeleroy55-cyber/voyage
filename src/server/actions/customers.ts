"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { hashPassword } from "@/server/auth";

/**
 * Comptes voyageurs, vus depuis le back-office.
 *
 * Deux principes :
 * - les suppressions et l'anonymisation sont réservées au rôle « owner » : ce
 *   sont les seules actions du back-office qui détruisent des données
 *   personnelles sans reprise possible ;
 * - une réservation n'est jamais supprimée avec son client. La comptabilité doit
 *   survivre à un départ, d'où l'anonymisation, qui vide l'identité en gardant
 *   les montants.
 */

const MIN_PASSWORD = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect("/admin/clients?erreur=droits");
  }
  return session;
}

function refresh(id?: string) {
  revalidatePath("/admin/clients");
  if (id) revalidatePath(`/admin/clients/${id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireSession();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    redirect(`/admin/clients/${id}?erreur=email`);
  }

  // L'adresse sert d'identifiant de connexion : un doublon rendrait l'un des
  // deux comptes inaccessible.
  const clash = await prisma.customer.findUnique({ where: { email }, select: { id: true } });
  if (clash && clash.id !== id) {
    redirect(`/admin/clients/${id}?erreur=doublon`);
  }

  await prisma.customer.update({
    where: { id },
    data: {
      email,
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      newsletter: formData.get("newsletter") === "on",
    },
  });

  refresh(id);
  redirect(`/admin/clients/${id}?enregistre=1`);
}

export async function setCustomerActive(id: string, active: boolean) {
  await requireSession();
  await prisma.customer.update({ where: { id }, data: { active } });
  refresh(id);
}

/** Réinitialisation par l'équipe, quand un voyageur a perdu son accès. */
export async function resetCustomerPassword(id: string, formData: FormData) {
  await requireSession();

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) {
    redirect(`/admin/clients/${id}?erreur=motdepasse`);
  }

  await prisma.customer.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
  });

  refresh(id);
  redirect(`/admin/clients/${id}?motdepasse=1`);
}

/**
 * Ajustement manuel des points de fidélité.
 *
 * Le motif est obligatoire mais n'est pas archivé : le schéma n'a pas de table
 * de journal, et en ajouter une demande une migration que cette itération ne
 * couvre pas. Il est donc renvoyé dans le message de confirmation, pour que
 * l'auteur du geste voie ce qu'il vient de justifier. Voir `docs/BACK-OFFICE.md`.
 */
export async function adjustLoyalty(id: string, formData: FormData) {
  await requireSession();

  const delta = Math.round(Number(formData.get("delta")) || 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (delta === 0) redirect(`/admin/clients/${id}?erreur=points`);
  if (reason.length < 3) redirect(`/admin/clients/${id}?erreur=motif`);

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { loyaltyPoints: true },
  });
  if (!customer) redirect("/admin/clients?erreur=introuvable");

  await prisma.customer.update({
    where: { id },
    // Le solde ne descend pas sous zéro : un total négatif n'a pas de sens pour
    // le voyageur, qui verrait un palier de fidélité incohérent.
    data: { loyaltyPoints: Math.max(0, customer.loyaltyPoints + delta) },
  });

  refresh(id);
  // Le signe est encodé : un « + » brut dans une chaîne de requête se relit
  // comme une espace, et le message annoncerait « 250 » au lieu de « +250 ».
  redirect(`/admin/clients/${id}?points=${encodeURIComponent(delta > 0 ? `+${delta}` : delta)}`);
}

/**
 * Anonymisation : le compte perd toute donnée personnelle mais les réservations
 * restent, rattachées à une identité neutre. C'est la réponse à une demande
 * d'effacement quand des pièces comptables sont encore à conserver.
 */
export async function anonymiseCustomer(id: string) {
  await requireOwner();

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) redirect("/admin/clients?erreur=introuvable");

  const placeholder = `anonyme-${customer.id.slice(-8)}@gosejour.invalid`;

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { customerId: id },
      data: { customerName: "Client anonymisé", customerEmail: placeholder, customerPhone: "" },
    }),
    // Les favoris ne portent aucune valeur comptable : ils partent avec l'identité.
    prisma.favourite.deleteMany({ where: { customerId: id } }),
    prisma.customer.update({
      where: { id },
      data: {
        email: placeholder,
        firstName: "Client",
        lastName: "anonymisé",
        phone: "",
        city: "",
        newsletter: false,
        active: false,
        // Le compte ne doit plus pouvoir servir : l'empreinte est remplacée par
        // une valeur aléatoire dont personne ne connaît l'antécédent.
        passwordHash: hashPassword(`${customer.id}-${Date.now()}`),
      },
    }),
  ]);

  refresh(id);
  redirect("/admin/clients?anonymise=1");
}

/** Suppression définitive, y compris les réservations rattachées. */
export async function deleteCustomer(id: string) {
  await requireOwner();

  // `Booking.customerId` est en `SetNull` : sans ce détachement explicite, les
  // réservations resteraient en base sans plus aucun lien vers qui que ce soit.
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { customerId: id } }),
    prisma.customer.delete({ where: { id } }),
  ]);

  refresh();
  redirect("/admin/clients?supprime=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { hashPassword, verifyPassword } from "@/server/auth";
import { closeSession, requireSession } from "@/server/session";

/**
 * Comptes du back-office.
 *
 * Deux règles structurent tout ce fichier :
 * - seul un compte « owner » administre l'équipe ; un « editor » ne peut agir
 *   que sur son propre mot de passe ;
 * - il doit rester en permanence au moins un owner actif, sinon plus personne
 *   ne pourrait rendre la main à qui que ce soit.
 */

const MIN_PASSWORD = 10;

async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect("/admin/equipe?erreur=droits");
  }
  return session;
}

async function activeOwnerCount(excludeId?: string): Promise<number> {
  return prisma.adminUser.count({
    where: {
      role: "owner",
      active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createAdmin(formData: FormData) {
  await requireOwner();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "editor") === "owner" ? "owner" : "editor";
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    redirect("/admin/equipe?erreur=email");
  }
  if (password.length < MIN_PASSWORD) {
    redirect("/admin/equipe?erreur=motdepasse");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    redirect("/admin/equipe?erreur=doublon");
  }

  await prisma.adminUser.create({
    data: { email, name, role, passwordHash: hashPassword(password) },
  });

  revalidatePath("/admin/equipe");
  redirect("/admin/equipe?cree=1");
}

export async function setAdminRole(id: string, role: string) {
  const session = await requireOwner();
  const next = role === "owner" ? "owner" : "editor";

  // Se rétrograder soi-même alors qu'on est le dernier owner actif fermerait la
  // porte à clé de l'intérieur.
  if (next === "editor" && id === session.sub && (await activeOwnerCount(id)) === 0) {
    redirect("/admin/equipe?erreur=dernier");
  }

  await prisma.adminUser.update({ where: { id }, data: { role: next } });
  revalidatePath("/admin/equipe");
}

export async function setAdminActive(id: string, active: boolean) {
  const session = await requireOwner();

  if (!active) {
    if (id === session.sub) redirect("/admin/equipe?erreur=soi");
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (target?.role === "owner" && (await activeOwnerCount(id)) === 0) {
      redirect("/admin/equipe?erreur=dernier");
    }
  }

  await prisma.adminUser.update({ where: { id }, data: { active } });
  revalidatePath("/admin/equipe");
}

export async function deleteAdmin(id: string) {
  const session = await requireOwner();

  if (id === session.sub) redirect("/admin/equipe?erreur=soi");
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (target?.role === "owner" && (await activeOwnerCount(id)) === 0) {
    redirect("/admin/equipe?erreur=dernier");
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe?supprime=1");
}

/** Réinitialisation par un owner : utile quand quelqu'un a perdu son accès. */
export async function resetAdminPassword(id: string, formData: FormData) {
  await requireOwner();

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) {
    redirect("/admin/equipe?erreur=motdepasse");
  }

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
  });

  revalidatePath("/admin/equipe");
  redirect("/admin/equipe?motdepasse=1");
}

/** Changement de son propre mot de passe : accessible à tous les rôles. */
export async function changeOwnPassword(formData: FormData) {
  const session = await requireSession();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    redirect("/admin/profil?erreur=actuel");
  }
  if (next.length < MIN_PASSWORD) {
    redirect("/admin/profil?erreur=court");
  }
  if (next !== confirm) {
    redirect("/admin/profil?erreur=confirmation");
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });

  // Le cookie porte l'identité, pas le mot de passe : il resterait valable
  // après le changement. On force une reconnexion, seul moyen de couper une
  // session ouverte ailleurs avec l'ancien mot de passe.
  await closeSession();
  redirect("/admin/connexion?motdepasse=change");
}

export async function updateOwnProfile(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();

  await prisma.adminUser.update({ where: { id: session.sub }, data: { name } });
  revalidatePath("/admin/profil");
  redirect("/admin/profil?enregistre=1");
}

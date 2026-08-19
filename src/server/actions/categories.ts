"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { FORM_FIELDS, type FormFieldId } from "@/lib/constants";
import { slugify } from "@/lib/slug";

/**
 * Types de voyage du moteur de recherche.
 *
 * Une catégorie ne porte pas seulement un onglet : `formFields` décide des
 * champs affichés par le moteur, et `active` retire la catégorie du site sans
 * toucher aux offres. C'est le seul endroit du back-office où une saisie change
 * la forme d'un formulaire public, d'où les validations strictes ci-dessous.
 */

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

/** Ne conserve que des identifiants de champs connus, dans l'ordre du moteur. */
function readFormFields(formData: FormData): string {
  const picked = new Set(formData.getAll("formFields").map(String));
  const kept = FORM_FIELDS.filter((f) => picked.has(f.id)).map((f) => f.id as FormFieldId);
  // Une catégorie sans aucun champ afficherait un onglet inutilisable.
  return (kept.length > 0 ? kept : ["destination", "dates", "travellers"]).join(",");
}

export async function saveCategory(id: string | null, formData: FormData) {
  await requireSession();

  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    redirect(`/admin/categories?erreur=libelle${id ? `&ligne=${id}` : ""}`);
  }

  const slug = slugify(String(formData.get("slug") ?? "") || label);
  if (!slug) {
    redirect(`/admin/categories?erreur=slug${id ? `&ligne=${id}` : ""}`);
  }

  // Le slug se retrouve dans l'URL des pages de résultats : un doublon casserait
  // le routage. Prisma lèverait bien une erreur, mais illisible pour l'équipe.
  const clash = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    redirect(`/admin/categories?erreur=doublon${id ? `&ligne=${id}` : ""}`);
  }

  const data = {
    label,
    slug,
    icon: String(formData.get("icon") ?? "pin").trim() || "pin",
    blurb: String(formData.get("blurb") ?? "").trim(),
    formFields: readFormFields(formData),
    active: formData.get("active") === "on",
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    const last = await prisma.category.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.category.create({
      data: { ...data, position: (last?.position ?? 0) + 1 },
    });
  }

  refresh();
  redirect("/admin/categories?enregistre=1");
}

export async function setCategoryActive(id: string, active: boolean) {
  await requireSession();
  await prisma.category.update({ where: { id }, data: { active } });
  refresh();
}

/**
 * Déplacement d'un cran, par échange de position avec la voisine. Le
 * glisser-déposer serait plus direct à la souris, mais inutilisable au clavier
 * et au lecteur d'écran pour un gain nul sur une liste de cette taille.
 */
export async function moveCategory(id: string, direction: "up" | "down") {
  await requireSession();

  const ordered = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { label: "asc" }],
    select: { id: true },
  });

  const index = ordered.findIndex((c) => c.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ordered.length) return;

  // Les positions sont réécrites en bloc : celles héritées du seed comportent
  // des trous et des ex æquo, qu'un simple échange de valeurs ne corrigerait pas.
  const reordered = [...ordered];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await prisma.$transaction(
    reordered.map((category, position) =>
      prisma.category.update({ where: { id: category.id }, data: { position } }),
    ),
  );

  refresh();
}

export async function deleteCategory(id: string) {
  await requireSession();

  // La relation est en `onDelete: Restrict` : Prisma refuserait de toute façon,
  // mais avec une erreur brute. On renvoie l'équipe vers les offres à traiter.
  const offers = await prisma.offer.count({ where: { categoryId: id } });
  if (offers > 0) {
    redirect(`/admin/categories?erreur=offres&nombre=${offers}`);
  }

  await prisma.category.delete({ where: { id } });
  refresh();
  redirect("/admin/categories?supprime=1");
}

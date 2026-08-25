"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import {
  CATEGORY_ACCENTS,
  CATEGORY_KINDS,
  FORM_FIELDS,
  OFFER_RULES,
  type FormFieldId,
} from "@/lib/constants";
import { slugify } from "@/lib/slug";

/**
 * Catégories de navigation.
 *
 * Une catégorie ne porte pas seulement un onglet : `slug` devient une URL de
 * premier niveau, `kind` décide si elle possède ses offres ou les sélectionne à
 * la lecture, `formFields` fixe les champs du moteur, et `active` la retire du
 * site sans toucher aux offres. C'est l'endroit du back-office où une saisie a
 * le plus d'effet sur le site public, d'où les validations strictes ci-dessous.
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

  const kind = String(formData.get("kind") ?? "catalogue");
  const rule = String(formData.get("rule") ?? "");

  const data = {
    label,
    slug,
    title: String(formData.get("title") ?? "").trim(),
    icon: String(formData.get("icon") ?? "pin").trim() || "pin",
    blurb: String(formData.get("blurb") ?? "").trim(),
    kind: CATEGORY_KINDS.some((k) => k.id === kind) ? kind : "catalogue",
    // La règle n'a de sens que pour un listing calculé : la conserver ailleurs
    // laisserait une catégorie du catalogue avec un filtre fantôme.
    rule: kind === "dynamique" && OFFER_RULES.some((r) => r.id === rule) ? rule : "",
    accent: CATEGORY_ACCENTS.some((a) => a.id === formData.get("accent"))
      ? String(formData.get("accent"))
      : "navy",
    isOverflow: formData.get("isOverflow") === "on",
    showDiscountPercent: formData.get("showDiscountPercent") === "on",
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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { deleteImage, uploadImage } from "@/server/media";
import { recomputeDestinationStats } from "@/server/counters";
import { nextOfferReference } from "@/server/references";
import { continentOf } from "@/lib/data";
import { OFFER_SUBTYPES } from "@/lib/constants";
import { slugify, toList } from "@/lib/slug";

/** Rafraîchit le site public et le back-office après toute écriture. */
function revalidateOffer(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/offres");
  if (slug) revalidatePath(`/offre/${slug}`);
}

/**
 * Date de départ saisie au format `AAAA-MM-JJ`, ramenée à midi.
 *
 * Midi plutôt que minuit : sur un serveur en UTC, une date de nuit bascule d'un
 * jour à l'affichage en France. Un champ vide rend `null`, l'offre restant
 * alors annoncée par sa période commerciale.
 */
function readDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Sous-type, restreint aux valeurs connues : un libellé libre ne filtre rien. */
function readSubtype(formData: FormData): string {
  const raw = String(formData.get("subtype") ?? "").trim();
  return OFFER_SUBTYPES.some((s) => s.id === raw) ? raw : "";
}

function readOfferForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();

  const number = (name: string, fallback = 0) => {
    const raw = formData.get(name);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const oldPrice = number("oldPrice", 0);
  const country = String(formData.get("country") ?? "").trim();
  const nights = Math.max(0, Math.round(number("nights")));

  return {
    title,
    destination,
    country,
    region: String(formData.get("region") ?? "").trim(),
    // Le continent se déduit du pays plutôt que d'être saisi : deux champs à
    // renseigner, c'est un risque d'incohérence dans le hub Destinations.
    continent: continentOf(country),
    departureCity: String(formData.get("departureCity") ?? "Paris").trim(),
    categoryId: String(formData.get("categoryId") ?? ""),
    subtype: readSubtype(formData),
    destinationId: String(formData.get("destinationId") ?? "") || null,
    // Une nuit de moins que de jours par défaut : le retour compte dans la
    // durée annoncée, pas dans les nuits facturées.
    days: Math.max(0, Math.round(number("days", nights + 1))) || nights + 1,
    nights,
    stars: Math.min(5, Math.max(0, Math.round(number("stars")))),
    board: String(formData.get("board") ?? "Sans repas"),
    price: Math.max(0, Math.round(number("price"))),
    // Un prix barré inférieur ou égal au prix courant n'a pas de sens :
    // on l'efface plutôt que d'afficher une remise négative.
    oldPrice: oldPrice > number("price") ? Math.round(oldPrice) : null,
    referencePriceSource: String(formData.get("referencePriceSource") ?? "").trim(),
    rating: Math.min(10, Math.max(0, number("rating"))),
    reviewsCount: Math.max(0, Math.round(number("reviewsCount"))),
    departureDate: readDate(formData.get("departureDate")),
    dates: String(formData.get("dates") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    tags: toList(formData.get("tags")),
    amenities: toList(formData.get("amenities")),
    highlights: toList(formData.get("highlights")),
    included: toList(formData.get("included")),
    status: String(formData.get("status") ?? "draft"),
    featured: formData.get("featured") === "on",
    position: Math.round(number("position")),
  };
}

/** Garantit l'unicité du slug en suffixant un compteur si besoin. */
async function uniqueSlug(base: string, currentId?: string): Promise<string> {
  const root = slugify(base) || "offre";
  let candidate = root;
  let n = 2;
  for (;;) {
    const existing = await prisma.offer.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${root}-${n++}`;
  }
}

export async function createOffer(formData: FormData) {
  await requireSession();
  const data = readOfferForm(formData);
  if (!data.title || !data.categoryId) {
    throw new Error("Le titre et la catégorie sont obligatoires.");
  }

  const slug = await uniqueSlug(
    String(formData.get("slug") || `${data.destination} ${data.title}`),
  );
  // Le numéro est attribué ici, une fois pour toutes : il ne change plus, même
  // si l'offre change de catégorie, de destination ou de slug.
  const reference = await nextOfferReference();
  const offer = await prisma.offer.create({ data: { ...data, slug, reference } });

  await recomputeDestinationStats(offer.destinationId);
  revalidateOffer(slug);
  redirect(`/admin/offres/${offer.id}?cree=1`);
}

export async function updateOffer(id: string, formData: FormData) {
  await requireSession();
  const data = readOfferForm(formData);
  const slug = await uniqueSlug(String(formData.get("slug") || data.title), id);

  const previous = await prisma.offer.findUnique({
    where: { id },
    select: { slug: true, destinationId: true },
  });
  const offer = await prisma.offer.update({ where: { id }, data: { ...data, slug } });

  // Les deux destinations sont recalculées : celle qu'on quitte perd une offre,
  // celle qu'on rejoint en gagne une, et le prix d'appel bouge des deux côtés.
  await recomputeDestinationStats(previous?.destinationId);
  if (offer.destinationId !== previous?.destinationId) {
    await recomputeDestinationStats(offer.destinationId);
  }

  revalidateOffer(slug);
  if (previous && previous.slug !== slug) revalidateOffer(previous.slug);
  redirect(`/admin/offres/${id}?enregistre=1`);
}

export async function deleteOffer(id: string) {
  await requireSession();
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!offer) redirect("/admin/offres");

  // Les visuels sont supprimés chez l'hébergeur avant la ligne en base :
  // l'inverse laisserait des fichiers orphelins sans moyen de les retrouver.
  for (const image of offer.images) await deleteImage(image.publicId);
  await prisma.offer.delete({ where: { id } });

  await recomputeDestinationStats(offer.destinationId);
  revalidateOffer(offer.slug);
  redirect("/admin/offres?supprime=1");
}

export async function addOfferImage(offerId: string, formData: FormData) {
  await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/offres/${offerId}?erreur=fichier`);
  }

  const stored = await uploadImage(file);
  const count = await prisma.offerImage.count({ where: { offerId } });
  await prisma.offerImage.create({
    data: {
      offerId,
      url: stored.url,
      publicId: stored.publicId,
      alt: String(formData.get("alt") ?? "").trim(),
      position: count,
    },
  });

  revalidateOffer();
  redirect(`/admin/offres/${offerId}?image=1`);
}

export async function deleteOfferImage(imageId: string) {
  await requireSession();
  const image = await prisma.offerImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await deleteImage(image.publicId);
  await prisma.offerImage.delete({ where: { id: imageId } });

  revalidateOffer();
  redirect(`/admin/offres/${image.offerId}`);
}

export async function setOfferStatus(id: string, status: string) {
  await requireSession();
  const offer = await prisma.offer.update({ where: { id }, data: { status } });
  // Publier ou archiver fait entrer ou sortir l'offre du décompte de sa
  // destination, et peut changer son prix d'appel.
  await recomputeDestinationStats(offer.destinationId);
  revalidateOffer(offer.slug);
}

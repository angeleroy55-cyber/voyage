"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { sendBookingStatusUpdateEmail } from "@/server/mail";
import { deleteImage, uploadImage } from "@/server/media";
import { recomputeAllCounters, recomputeOfferRating } from "@/server/counters";
import { slugify } from "@/lib/slug";

function refresh(path: string) {
  revalidatePath("/", "layout");
  revalidatePath(path);
}

// ---- Avis ----

export async function setReviewStatus(id: string, status: string) {
  await requireSession();
  const review = await prisma.review.update({ where: { id }, data: { status } });
  // La note de l'offre ne compte que les avis publiés : modérer, c'est la
  // déplacer.
  await recomputeOfferRating(review.offerId);
  refresh("/admin/avis");
}

export async function deleteReview(id: string) {
  await requireSession();
  const review = await prisma.review.delete({ where: { id } });
  await recomputeOfferRating(review.offerId);
  refresh("/admin/avis");
}

// ---- Réservations ----

export async function setBookingStatus(id: string, status: string) {
  await requireSession();
  await prisma.booking.update({ where: { id }, data: { status } });
  await sendBookingStatusUpdateEmail(id);
  refresh("/admin/reservations");
}

export async function saveBookingNotes(id: string, formData: FormData) {
  await requireSession();
  await prisma.booking.update({
    where: { id },
    data: { notes: String(formData.get("notes") ?? "") },
  });
  refresh("/admin/reservations");
}

// ---- Destinations ----

export async function saveDestination(id: string | null, formData: FormData) {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Le nom de la destination est obligatoire.");

  const data = {
    name,
    country: String(formData.get("country") ?? "").trim(),
    region: String(formData.get("region") ?? "").trim(),
    imageAlt: String(formData.get("imageAlt") ?? "").trim(),
    fromPrice: Math.max(0, Math.round(Number(formData.get("fromPrice")) || 0)),
    offersCount: Math.max(0, Math.round(Number(formData.get("offersCount")) || 0)),
    featured: formData.get("featured") === "on",
    position: Math.round(Number(formData.get("position")) || 0),
  };

  const file = formData.get("file");
  let image: { imageUrl?: string; imageId?: string } = {};
  if (file instanceof File && file.size > 0) {
    const publicId = slugify(name) || `destination-${Date.now()}`;
    const stored = await uploadImage(file, {
      folder: "gosejour/destinations",
      publicId,
    });
    image = { imageUrl: stored.url, imageId: stored.publicId };

    // Le visuel remplacé est retiré du stockage pour ne pas accumuler d'orphelins.
    if (id) {
      const previous = await prisma.destination.findUnique({
        where: { id },
        select: { imageId: true },
      });
      if (previous?.imageId) await deleteImage(previous.imageId);
    }
  }

  if (id) {
    await prisma.destination.update({ where: { id }, data: { ...data, ...image } });
  } else {
    await prisma.destination.create({
      data: { ...data, ...image, slug: slugify(name) || `destination-${Date.now()}` },
    });
  }

  refresh("/admin/destinations");
  redirect("/admin/destinations?enregistre=1");
}

export async function deleteDestination(id: string) {
  await requireSession();
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (destination?.imageId) await deleteImage(destination.imageId);
  await prisma.destination.delete({ where: { id } });
  refresh("/admin/destinations");
  redirect("/admin/destinations?supprime=1");
}

// ---- Articles ----

export async function savePost(id: string | null, formData: FormData) {
  await requireSession();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Le titre est obligatoire.");

  const data = {
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    category: String(formData.get("category") ?? "Conseils").trim(),
    readingTime: Math.max(1, Math.round(Number(formData.get("readingTime")) || 5)),
    imageAlt: String(formData.get("imageAlt") ?? "").trim(),
    status: String(formData.get("status") ?? "draft"),
  };

  const file = formData.get("file");
  let image: { imageUrl?: string; imageId?: string } = {};
  if (file instanceof File && file.size > 0) {
    const publicId = slugify(title) || `article-${Date.now()}`;
    const stored = await uploadImage(file, {
      folder: "gosejour/posts",
      publicId,
    });
    image = { imageUrl: stored.url, imageId: stored.publicId };

    if (id) {
      const previous = await prisma.post.findUnique({
        where: { id },
        select: { imageId: true },
      });
      if (previous?.imageId) await deleteImage(previous.imageId);
    }
  }

  if (id) {
    await prisma.post.update({ where: { id }, data: { ...data, ...image } });
  } else {
    await prisma.post.create({
      data: { ...data, ...image, slug: slugify(title) || `article-${Date.now()}` },
    });
  }

  refresh("/admin/articles");
  redirect("/admin/articles?enregistre=1");
}

export async function deletePost(id: string) {
  await requireSession();
  const post = await prisma.post.findUnique({ where: { id } });
  if (post?.imageId) await deleteImage(post.imageId);
  await prisma.post.delete({ where: { id } });
  refresh("/admin/articles");
  redirect("/admin/articles?supprime=1");
}

// ---- Réglages ----

export async function saveSettings(formData: FormData) {
  await requireSession();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  refresh("/admin/parametres");
  redirect("/admin/parametres?enregistre=1");
}

/**
 * Reprise complète des compteurs dénormalisés. Sert après un import, ou pour
 * rattraper les écarts accumulés avant que le recalcul ne soit branché sur
 * chaque action.
 */
export async function recomputeCounters() {
  await requireSession();
  const done = await recomputeAllCounters();
  revalidatePath("/", "layout");
  redirect(`/admin/parametres?compteurs=${done.offers}-${done.destinations}`);
}

// ---- Abonnés ----

export async function addSubscriber(formData: FormData) {
  await requireSession();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    redirect("/admin/abonnes?erreur=email");
  }

  const interests = formData.getAll("interests").map(String).filter(Boolean);

  // Une réinscription ne doit pas échouer sur la contrainte d'unicité : on
  // complète les centres d'intérêt de l'inscription existante.
  await prisma.subscriber.upsert({
    where: { email },
    update: { interests },
    create: { email, interests },
  });

  refresh("/admin/abonnes");
  redirect("/admin/abonnes?ajoute=1");
}

export async function deleteSubscriber(id: string) {
  await requireSession();
  await prisma.subscriber.delete({ where: { id } });
  refresh("/admin/abonnes");
  redirect("/admin/abonnes?supprime=1");
}

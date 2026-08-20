"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/session";
import { deleteImage, uploadImage } from "@/server/media";
import { slugify } from "@/lib/slug";
import { requireHeroSlideDelegate } from "@/server/hero-slides";

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/hero");
}

export async function saveHeroSlide(id: string | null, formData: FormData) {
  await requireSession();
  const heroSlide = requireHeroSlideDelegate();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Le titre du slide est obligatoire.");

  const data = {
    kicker: String(formData.get("kicker") ?? "").trim(),
    title,
    text: String(formData.get("text") ?? "").trim(),
    href: String(formData.get("href") ?? "/").trim() || "/",
    cta: String(formData.get("cta") ?? "").trim(),
    imageAlt: String(formData.get("imageAlt") ?? "").trim(),
    position: Math.max(0, Math.round(Number(formData.get("position")) || 0)),
    active: formData.get("active") === "on",
  };

  const file = formData.get("file");
  let image: { imageUrl?: string; imageId?: string } = {};
  if (file instanceof File && file.size > 0) {
    const publicId = `${data.position + 1}-${slugify(title) || `slide-${Date.now()}`}`;
    const stored = await uploadImage(file, {
      folder: "gosejour/hero",
      publicId,
    });
    image = { imageUrl: stored.url, imageId: stored.publicId };

    if (id) {
      const previous = await heroSlide.findUnique({
        where: { id },
        select: { imageId: true },
      });
      if (previous?.imageId) await deleteImage(previous.imageId);
    }
  }

  if (id) {
    await heroSlide.update({
      where: { id },
      data: { ...data, ...image },
    });
  } else {
    await heroSlide.create({
      data: { ...data, ...image },
    });
  }

  refresh();
  redirect("/admin/hero?enregistre=1");
}

export async function deleteHeroSlide(id: string) {
  await requireSession();
  const heroSlide = requireHeroSlideDelegate();
  const slide = await heroSlide.findUnique({ where: { id } });
  if (!slide) return;
  if (slide.imageId) await deleteImage(slide.imageId);
  await heroSlide.delete({ where: { id } });
  refresh();
  redirect("/admin/hero?supprime=1");
}

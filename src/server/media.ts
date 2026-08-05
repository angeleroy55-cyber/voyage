import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

/**
 * Stockage des visuels.
 *
 * Cloudinary dès que les trois variables CLOUDINARY_* sont renseignées, sinon
 * repli sur public/uploads. Le repli permet de faire tourner le back-office
 * sans compte Cloudinary ; les URL produites sont relatives et fonctionnent de
 * la même façon côté rendu.
 */

export type StoredImage = { url: string; publicId: string };

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImage(file: File): Promise<StoredImage> {
  if (!file || file.size === 0) throw new Error("Fichier vide.");
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde (8 Mo maximum).");
  if (!ALLOWED.has(file.type)) {
    throw new Error("Format accepté : JPEG, PNG, WebP ou AVIF.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (cloudinaryConfigured()) {
    configure();
    const folder = process.env.CLOUDINARY_FOLDER || "gosejour";
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (error, uploaded) => {
            if (error || !uploaded) reject(error ?? new Error("Téléversement refusé."));
            else resolve(uploaded as { secure_url: string; public_id: string });
          },
        );
        stream.end(bytes);
      },
    );
    return { url: result.secure_url, publicId: result.public_id };
  }

  // Repli local. Le nom mêle empreinte du contenu et identifiant aléatoire :
  // deux téléversements du même visuel ne s'écrasent pas l'un l'autre.
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${digest}-${randomUUID().slice(0, 8)}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return { url: `/uploads/${name}`, publicId: `local:${name}` };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;

  if (publicId.startsWith("local:")) {
    const name = publicId.slice("local:".length);
    // Un média déjà absent ne doit pas faire échouer la suppression de l'offre.
    await unlink(path.join(process.cwd(), "public", "uploads", name)).catch(() => {});
    return;
  }

  if (!cloudinaryConfigured()) return;
  configure();
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}

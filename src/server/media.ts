import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
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
type UploadOptions = { folder?: string; publicId?: string };

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

function ensureAllowed(mimeType: string, size: number) {
  if (size === 0) throw new Error("Fichier vide.");
  if (size > MAX_BYTES) throw new Error("Image trop lourde (8 Mo maximum).");
  if (!ALLOWED.has(mimeType)) {
    throw new Error("Format accepté : JPEG, PNG, WebP ou AVIF.");
  }
}

function extensionFromMimeType(mimeType: string): string {
  return mimeType.split("/")[1].replace("jpeg", "jpg");
}

export function guessMimeType(source: string): string {
  const ext = source.toLowerCase().split("?")[0].split(".").pop();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

export async function uploadImageBytes(
  bytes: Buffer,
  mimeType: string,
  options: UploadOptions = {},
): Promise<StoredImage> {
  ensureAllowed(mimeType, bytes.length);

  if (cloudinaryConfigured()) {
    configure();
    const folder = options.folder ?? (process.env.CLOUDINARY_FOLDER || "gosejour");
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: options.publicId,
            overwrite: Boolean(options.publicId),
            resource_type: "image",
          },
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
  const extension = extensionFromMimeType(mimeType);
  const name = `${digest}-${randomUUID().slice(0, 8)}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return { url: `/uploads/${name}`, publicId: `local:${name}` };
}

export async function uploadImage(file: File, options: UploadOptions = {}): Promise<StoredImage> {
  if (!file || file.size === 0) throw new Error("Fichier vide.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return uploadImageBytes(bytes, file.type, options);
}

export async function uploadRemoteImage(
  input: { sourceUrl: string } & UploadOptions,
): Promise<StoredImage> {
  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    throw new Error(`Téléchargement source refusé (${response.status}) pour ${input.sourceUrl}`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] || guessMimeType(input.sourceUrl);
  const bytes = Buffer.from(await response.arrayBuffer());
  return uploadImageBytes(bytes, mimeType, input);
}

export async function uploadLocalImage(
  input: { absolutePath: string } & UploadOptions,
): Promise<StoredImage> {
  const bytes = await readFile(input.absolutePath);
  return uploadImageBytes(bytes, guessMimeType(input.absolutePath), input);
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

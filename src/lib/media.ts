export const MEDIA_PLACEHOLDER = "/placeholders/travel.svg";

export function withMediaFallback(src?: string | null): string {
  const value = src?.trim();
  return value ? value : MEDIA_PLACEHOLDER;
}

export function galleryWithMediaFallback(images?: string[], cover?: string | null): string[] {
  const items = (images ?? []).map((image) => image.trim()).filter(Boolean);
  if (items.length > 0) return items;

  const main = cover?.trim();
  return main ? [main] : [MEDIA_PLACEHOLDER];
}

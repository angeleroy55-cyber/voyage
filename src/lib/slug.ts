/** Transforme un libellé en identifiant d'URL : « Crète, Héraklion » → « crete-heraklion ». */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    // Retire les diacritiques une fois les caractères décomposés par NFD.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Découpe une saisie multi-lignes en liste, en ignorant les lignes vides. */
export function toList(input: FormDataEntryValue | null): string[] {
  return String(input ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Export CSV des listes du back-office.
 *
 * Le séparateur est le point-virgule et le fichier commence par une BOM UTF-8 :
 * c'est ce qu'attend Excel en configuration française, qui sinon découpe mal les
 * colonnes et casse les accents. Les autres tableurs s'en accommodent.
 */

function cell(value: unknown): string {
  if (value == null) return "";
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  // Un point-virgule, un guillemet ou un saut de ligne dans une cellule
  // déplacerait toutes les colonnes suivantes s'il n'était pas échappé.
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(";"), ...rows.map((row) => row.map(cell).join(";"))];
  return `﻿${lines.join("\r\n")}`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Un export daté ne doit jamais être resservi depuis un cache.
      "Cache-Control": "no-store",
    },
  });
}

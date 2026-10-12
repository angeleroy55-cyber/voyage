"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { readCalendarSettings } from "@/server/calendar-form";

/**
 * Réglages de calendrier et de fourchette de prix d'une catégorie
 * (/admin/calendrier). Ils s'appliquent à toutes les offres de la catégorie
 * qui n'ont pas leur propre réglage, dès le rendu suivant : la fiche, le
 * tunnel et `createBooking` relisent les règles en base à chaque demande.
 */
export async function saveCategoryCalendar(id: string, formData: FormData) {
  await requireSession();

  const result = readCalendarSettings(formData);
  if (!result.ok) redirect(`/admin/calendrier?erreur=${result.error}&ligne=${id}#c-${id}`);

  await prisma.category.update({ where: { id }, data: result.data });

  revalidatePath("/", "layout");
  revalidatePath("/admin/calendrier");
  redirect(`/admin/calendrier?enregistre=1#c-${id}`);
}

/** Retour aux valeurs par défaut documentées dans src/lib/booking-rules.ts. */
export async function resetCategoryCalendar(id: string) {
  await requireSession();
  await prisma.category.update({
    where: { id },
    data: {
      bookingLeadDays: null,
      bookingWindowMonths: null,
      excludedWeekdays: null,
      discountMinPct: null,
      discountMaxPct: null,
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/calendrier");
  redirect(`/admin/calendrier?reinitialise=1#c-${id}`);
}

import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { csvResponse, toCsv } from "@/lib/csv";
import { STATUS_LABELS, paymentLabel } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

// Un gestionnaire de route ne traverse pas le layout du back-office : la garde
// de session doit être posée ici, sinon l'export serait ouvert à tous.
export async function GET(request: Request) {
  await requireSession();

  const url = new URL(request.url);
  const status = url.searchParams.get("statut") ?? "tous";
  const q = (url.searchParams.get("q") ?? "").trim();

  const filters: Prisma.BookingWhereInput[] = [];
  if (status !== "tous") filters.push({ status });
  if (q) {
    filters.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const bookings = await prisma.booking.findMany({
    where: filters.length ? { AND: filters } : {},
    orderBy: { createdAt: "desc" },
    include: { offer: { select: { title: true, destination: true } } },
  });

  const body = toCsv(
    [
      "Référence",
      "Statut",
      "Client",
      "E-mail",
      "Téléphone",
      "Offre",
      "Destination",
      "Voyageurs",
      "Départ",
      "Retour",
      "Total dû",
      "Réglé",
      "Reste dû",
      "Paiement",
      "Échéances",
      "Créée le",
    ],
    bookings.map((b) => [
      b.reference,
      STATUS_LABELS[b.status] ?? b.status,
      b.customerName,
      b.customerEmail,
      b.customerPhone,
      b.offer?.title ?? "",
      b.offer?.destination ?? "",
      b.travellers,
      b.departureDate,
      b.returnDate,
      b.totalPrice,
      b.paidAmount,
      b.totalPrice - b.paidAmount,
      paymentLabel(b.paymentMethod),
      b.instalments,
      b.createdAt,
    ]),
  );

  return csvResponse(`gosejour-reservations-${status}.csv`, body);
}

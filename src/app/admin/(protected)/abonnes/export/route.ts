import { prisma } from "@/server/prisma";
import { requireSession } from "@/server/session";
import { csvResponse, toCsv } from "@/lib/csv";

// Comme tout gestionnaire de route, celui-ci ne passe pas par le layout du
// back-office : la garde de session lui est propre.
export async function GET(request: Request) {
  await requireSession();

  const theme = new URL(request.url).searchParams.get("theme") ?? "";

  const subscribers = await prisma.subscriber.findMany({
    where: theme ? { interests: { has: theme } } : {},
    orderBy: { createdAt: "desc" },
  });

  const body = toCsv(
    ["E-mail", "Centres d'intérêt", "Inscrit le"],
    subscribers.map((s) => [s.email, s.interests.join(", "), s.createdAt]),
  );

  return csvResponse(`gosejour-abonnes${theme ? `-${theme}` : ""}.csv`, body);
}

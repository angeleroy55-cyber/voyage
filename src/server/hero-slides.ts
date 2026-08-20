import { withMediaFallback } from "@/lib/media";
import type { HeroSlide } from "@/lib/types";
import { prisma } from "@/server/prisma";

type HeroSlideRow = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  imageUrl: string;
  imageId: string;
  imageAlt: string;
  position: number;
  active: boolean;
};

type HeroSlideDelegate = {
  findMany(args: {
    where?: { active?: boolean };
    orderBy?: { position: "asc" | "desc" };
  }): Promise<HeroSlideRow[]>;
  findUnique(args: { where: { id: string }; select?: { imageId?: true } }): Promise<{
    imageId?: string;
  } | null>;
  create(args: { data: Partial<HeroSlideRow> }): Promise<unknown>;
  update(args: { where: { id: string }; data: Partial<HeroSlideRow> }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};

let warnedMissingDelegate = false;

function warnMissingHeroSlideDelegate() {
  if (warnedMissingDelegate) return;
  warnedMissingDelegate = true;
  console.warn(
    "[hero] Le process Next en cours ne connaît pas encore le modèle HeroSlide. " +
      "Redémarrer le serveur de dev ou relancer le déploiement recharge le client Prisma généré.",
  );
}

export function getHeroSlideDelegate(client: unknown = prisma): HeroSlideDelegate | null {
  if (!client || typeof client !== "object") return null;
  const delegate = Reflect.get(client, "heroSlide");
  if (!delegate || typeof delegate !== "object") return null;
  if (typeof Reflect.get(delegate, "findMany") !== "function") return null;
  return delegate as HeroSlideDelegate;
}

export function heroSlidesFeatureAvailable(client: unknown = prisma): boolean {
  return Boolean(getHeroSlideDelegate(client));
}

export function requireHeroSlideDelegate(client: unknown = prisma): HeroSlideDelegate {
  const delegate = getHeroSlideDelegate(client);
  if (delegate) return delegate;

  throw new Error(
    "Le client Prisma chargé par ce process ne connaît pas encore HeroSlide. " +
      "Redémarrer Next.js ou régénérer Prisma recharge les nouveaux modèles.",
  );
}

export async function listHeroSlideRows(client: unknown = prisma): Promise<HeroSlideRow[]> {
  const delegate = getHeroSlideDelegate(client);
  if (!delegate) {
    warnMissingHeroSlideDelegate();
    return [];
  }

  return delegate.findMany({ orderBy: { position: "asc" } });
}

export async function listHeroSlides(client: unknown = prisma): Promise<HeroSlide[]> {
  const rows = await listHeroSlideRows(client);

  return rows
    .filter((row) => row.active)
    .map((row) => ({
      id: row.id,
      kicker: row.kicker,
      title: row.title,
      text: row.text,
      href: row.href,
      cta: row.cta,
      image: withMediaFallback(row.imageUrl),
      imageAlt: row.imageAlt || row.title,
      position: row.position,
    }));
}

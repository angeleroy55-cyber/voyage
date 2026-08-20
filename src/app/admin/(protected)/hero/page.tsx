import Image from "next/image";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { deleteHeroSlide, saveHeroSlide } from "@/server/actions/hero";
import { withMediaFallback } from "@/lib/media";

export const metadata = { title: "Hero accueil" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

export default async function HeroAdminPage({ searchParams }: PageProps<"/admin/hero">) {
  const sp = await searchParams;
  const slides = await prisma.heroSlide.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Hero accueil</h1>
      <p className="mt-1 text-sm text-navy-600">
        Slides du grand carrousel en haut de la page d&apos;accueil.
      </p>

      {(sp.enregistre || sp.supprime) && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {sp.supprime ? "Slide supprimé." : "Slide enregistré."}
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Ajouter un slide</h2>
        <form action={saveHeroSlide.bind(null, null)} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Kicker</span>
            <input name="kicker" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Position</span>
            <input type="number" name="position" min={0} defaultValue={slides.length} className={INPUT} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Titre *</span>
            <input name="title" required className={INPUT} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Texte</span>
            <textarea name="text" rows={2} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Lien</span>
            <input name="href" defaultValue="/" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Libellé CTA</span>
            <input name="cta" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Visuel</span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-800"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Texte alternatif
            </span>
            <input name="imageAlt" className={INPUT} />
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="active" defaultChecked className="size-4 rounded accent-gold-500" />
            Slide actif
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-start-2"
          >
            Ajouter
          </button>
        </form>
      </section>

      <ul className="mt-5 space-y-3">
        {slides.map((slide) => (
          <li key={slide.id} className="rounded-2xl border border-navy-100 bg-white p-4">
            <form action={saveHeroSlide.bind(null, slide.id)} className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-navy-100">
                <Image
                  src={withMediaFallback(slide.imageUrl)}
                  alt={slide.imageAlt || slide.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Kicker</span>
                  <input name="kicker" defaultValue={slide.kicker} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Position</span>
                  <input type="number" name="position" min={0} defaultValue={slide.position} className={INPUT} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Titre</span>
                  <input name="title" defaultValue={slide.title} className={INPUT} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Texte</span>
                  <textarea name="text" rows={2} defaultValue={slide.text} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Lien</span>
                  <input name="href" defaultValue={slide.href} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Libellé CTA</span>
                  <input name="cta" defaultValue={slide.cta} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Remplacer le visuel
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="mt-1 block w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-navy-100 file:px-2 file:py-1 file:text-xs file:font-semibold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Texte alternatif
                  </span>
                  <input name="imageAlt" defaultValue={slide.imageAlt} className={INPUT} />
                </label>
                <label className="flex items-center gap-2 text-sm text-navy-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={slide.active}
                    className="size-4 rounded accent-gold-500"
                  />
                  Slide actif
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button className="rounded-lg bg-navy-800 px-4 py-2 text-xs font-bold text-white hover:bg-navy-900">
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-2">
              <ConfirmButton
                action={deleteHeroSlide.bind(null, slide.id)}
                label="Supprimer ce slide"
                title={`Supprimer « ${slide.title} » ?`}
                description="Le slide et son visuel seront supprimés. Action définitive."
                confirmLabel="Supprimer"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

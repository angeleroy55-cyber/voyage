import Image from "next/image";
import { prisma } from "@/server/prisma";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deletePost, savePost } from "@/server/actions/admin";
import { STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

export default async function PostsAdminPage({ searchParams }: PageProps<"/admin/articles">) {
  const sp = await searchParams;
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Articles</h1>
      <p className="mt-1 text-sm text-navy-600">
        Le carnet de voyage affiché en bas de la page d&apos;accueil.
      </p>

      {(sp.enregistre || sp.supprime) && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {sp.supprime ? "Article supprimé." : "Article enregistré."}
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Nouvel article</h2>
        <form action={savePost.bind(null, null)} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Titre *</span>
            <input name="title" required className={INPUT} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Chapô</span>
            <textarea name="excerpt" rows={2} className={INPUT} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Contenu</span>
            <textarea name="body" rows={5} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Rubrique</span>
            <input name="category" defaultValue="Conseils" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Temps de lecture (min)
            </span>
            <input type="number" name="readingTime" min={1} defaultValue={5} className={INPUT} />
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
              Texte alternatif du visuel
            </span>
            <input name="imageAlt" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Statut</span>
            <select name="status" defaultValue="draft" className={INPUT}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-start-2"
          >
            Créer l&apos;article
          </button>
        </form>
      </section>

      <ul className="mt-5 space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="rounded-2xl border border-navy-100 bg-white p-4">
            <form action={savePost.bind(null, post.id)} className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-navy-100">
                {post.imageUrl && (
                  <Image src={post.imageUrl} alt="" fill sizes="120px" className="object-cover" />
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Titre
                  </span>
                  <input name="title" defaultValue={post.title} className={INPUT} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Chapô
                  </span>
                  <textarea name="excerpt" rows={2} defaultValue={post.excerpt} className={INPUT} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Texte alternatif du visuel
                  </span>
                  <input name="imageAlt" defaultValue={post.imageAlt} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Rubrique
                  </span>
                  <input name="category" defaultValue={post.category} className={INPUT} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    Statut (actuellement {STATUS_LABELS[post.status] ?? post.status})
                  </span>
                  <select name="status" defaultValue={post.status} className={INPUT}>
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </label>

                <input type="hidden" name="body" value={post.body} />
                <input type="hidden" name="readingTime" value={post.readingTime} />

                <label className="block sm:col-span-2">
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

                <div className="flex gap-2 sm:col-span-2">
                  <button className="rounded-lg bg-navy-800 px-4 py-2 text-xs font-bold text-white hover:bg-navy-900">
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-2">
              <ConfirmButton
                action={deletePost.bind(null, post.id)}
                label="Supprimer cet article"
                title={`Supprimer « ${post.title} » ?`}
                description={`L'article et son visuel seront supprimés, y compris s'il est en ligne. C'est définitif.`}
                confirmLabel="Supprimer"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

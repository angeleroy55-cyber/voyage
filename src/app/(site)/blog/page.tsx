import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getPosts } from "@/server/catalogue";
import { withMediaFallback } from "@/lib/media";

export const metadata = {
  title: "Le carnet de voyage",
  description: "Conseils pratiques, idées d'itinéraires et guides de destinations.",
};
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  // Aucune limite : la page liste tout ce qui est publié au back-office.
  const posts = await getPosts(100);

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Carnet de voyage</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        Le carnet de voyage
      </h1>
      <p className="mt-1.5 text-sm text-navy-600">
        Conseils pratiques et idées d&apos;itinéraires écrits par nos équipes.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-navy-200 p-12 text-center text-sm text-navy-500">
          Aucun article publié pour le moment.
        </p>
      ) : (
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block overflow-hidden rounded-2xl">
                <div className="relative aspect-16/10">
                  <Image
                    src={withMediaFallback(post.image)}
                    alt={post.imageAlt || post.title}
                    fill
                    sizes="(max-width: 640px) 90vw, 380px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gold-700">
                {post.category}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug text-navy-900">
                <Link href={`/blog/${post.slug}`} className="hover:text-gold-700">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-1.5 line-clamp-3 text-sm text-navy-600">{post.excerpt}</p>
              <p className="mt-2 text-xs text-navy-500">{post.readingTime} min de lecture</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

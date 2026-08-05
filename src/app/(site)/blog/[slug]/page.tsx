import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { getPostBySlug, getPosts, getPublishedPostSlugs } from "@/server/catalogue";
import { photo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPublishedPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const others = (await getPosts(4)).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <Link href="/blog" className="hover:text-gold-700">
          Carnet de voyage
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">{post.category}</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gold-700">
        {post.category}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-navy-900">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-navy-500">
        {post.readingTime} min de lecture · publié le{" "}
        {post.createdAt.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="relative mt-6 aspect-16/9 overflow-hidden rounded-2xl">
        <Image
          src={post.imageUrl || photo(post.slug, 1200, 675)}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      {post.excerpt && (
        <p className="mt-6 text-lg leading-relaxed text-navy-700">{post.excerpt}</p>
      )}

      {post.body && (
        <div className="mt-5 space-y-4">
          {/* Le corps est saisi en texte simple au back-office : chaque ligne
              vide sépare un paragraphe, sans passer par un éditeur riche. */}
          {post.body
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index} className="text-[15px] leading-relaxed text-navy-700">
                {paragraph}
              </p>
            ))}
        </div>
      )}

      {others.length > 0 && (
        <section className="mt-14 border-t border-navy-100 pt-8">
          <h2 className="text-lg font-extrabold text-navy-900">À lire aussi</h2>
          <ul className="mt-4 space-y-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/blog/${other.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-navy-100 px-4 py-3 transition hover:border-navy-200 hover:bg-navy-50/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-900">
                      {other.title}
                    </span>
                    <span className="block text-xs text-navy-500">
                      {other.category} · {other.readingTime} min
                    </span>
                  </span>
                  <Icon
                    name="chevronRight"
                    className="size-4 shrink-0 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

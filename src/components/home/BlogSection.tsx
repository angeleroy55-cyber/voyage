import Image from "next/image";
import Link from "next/link";
import Section from "@/components/ui/Section";
import type { Post } from "@/lib/types";
import { photo } from "@/lib/format";

export default function BlogSection({ posts }: { posts: Post[] }) {
  return (
    <Section
      title="Le carnet de voyage"
      subtitle="Conseils pratiques et idées d'itinéraires écrits par nos équipes."
      href="/blog"
      linkLabel="Tous les articles"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <article key={p.slug} className="group">
            <Link href={`/blog/${p.slug}`} className="block overflow-hidden rounded-2xl">
              <div className="relative aspect-16/10">
                <Image
                  src={p.image ?? photo(p.imageSeed, 600, 375)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 300px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gold-700">{p.category}</p>
            <h3 className="mt-1 text-[15px] font-bold leading-snug text-navy-900">
              <Link href={`/blog/${p.slug}`} className="hover:text-gold-700">
                {p.title}
              </Link>
            </h3>
            <p className="mt-1.5 line-clamp-3 text-sm text-navy-600">{p.excerpt}</p>
            <p className="mt-2 text-xs text-navy-500">{p.readingTime} min de lecture</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

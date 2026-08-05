import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function Section({
  title,
  subtitle,
  href,
  linkLabel = "Tout voir",
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-page px-4 ${className}`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-navy-600">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-semibold text-navy-700 transition hover:text-gold-700"
          >
            {linkLabel}
            <Icon name="chevronRight" className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

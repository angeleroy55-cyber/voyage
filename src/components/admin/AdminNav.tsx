"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: "compass", exact: true },
  { href: "/admin/offres", label: "Offres", icon: "package" },
  { href: "/admin/categories", label: "Types de voyage", icon: "route" },
  { href: "/admin/destinations", label: "Destinations", icon: "pin" },
  { href: "/admin/hero", label: "Hero accueil", icon: "sparkles" },
  { href: "/admin/reservations", label: "Réservations", icon: "calendar" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
  { href: "/admin/avis", label: "Avis", icon: "star" },
  { href: "/admin/articles", label: "Articles", icon: "mail" },
  { href: "/admin/abonnes", label: "Abonnés", icon: "users" },
  { href: "/admin/equipe", label: "Équipe", icon: "headset" },
  { href: "/admin/parametres", label: "Réglages", icon: "filter" },
  { href: "/admin/profil", label: "Mon profil", icon: "shield" },
];

export default function AdminNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (compact) {
    return (
      <nav className="rail flex gap-1 overflow-x-auto">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive(l.href, l.exact)
                ? "bg-navy-900 text-white"
                : "text-navy-600 hover:bg-navy-50"
            }`}
          >
            <Icon name={l.icon} className="size-4" />
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href, l.exact) ? "page" : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            isActive(l.href, l.exact)
              ? "bg-navy-900 text-white"
              : "text-navy-600 hover:bg-navy-50 hover:text-navy-900"
          }`}
        >
          <Icon
            name={l.icon}
            className={`size-4.5 ${isActive(l.href, l.exact) ? "text-gold-400" : "text-navy-400"}`}
          />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { logoutCustomer } from "@/server/actions/account";

const LINKS = [
  { href: "/compte/tableau-de-bord", label: "Tableau de bord", icon: "compass" },
  { href: "/compte/reservations", label: "Mes réservations", icon: "package" },
  { href: "/compte/favoris", label: "Mes favoris", icon: "heart" },
  { href: "/compte/profil", label: "Mon profil", icon: "users" },
];

export default function AccountNav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Espace client">
      <ul className="rail flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {LINKS.map((link) => {
          // Le tableau de bord ne doit pas rester actif sur ses sous-pages :
          // seul un préfixe suivi d'un « / » compte comme descendance.
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const badge = counts[link.href];

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-navy-800 text-white"
                    : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                }`}
              >
                <Icon
                  name={link.icon}
                  className={`size-4.5 ${active ? "text-gold-400" : "text-navy-400"}`}
                />
                <span className="whitespace-nowrap">{link.label}</span>
                {badge ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      active ? "bg-white/15 text-white" : "bg-navy-100 text-navy-700"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={logoutCustomer} className="mt-2 hidden lg:block">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-navy-500 transition hover:bg-navy-50 hover:text-navy-900"
        >
          <Icon name="close" className="size-4.5 text-navy-400" />
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}

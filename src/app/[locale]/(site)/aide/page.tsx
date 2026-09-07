import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { BRAND } from "@/lib/data";
import { getRequestLocale, getRequestDictionary } from "@/i18n/server";
import { localizedPath } from "@/i18n/config";

export const metadata = { title: "Aide & contact" };

export default async function HelpPage() {
  const locale = await getRequestLocale();
  const dict = await getRequestDictionary();
  const t = dict.aide;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-navy-500">
        <Link href={localizedPath("/", locale)} className="hover:text-gold-700">
          {dict.common.home}
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">{t.breadcrumb}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        {t.title}
      </h1>

      <div id="contact" className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "phone", title: t.byPhone, value: BRAND.phone, hint: t.phoneHint },
          { icon: "mail", title: t.byEmail, value: BRAND.email, hint: t.emailHint },
          { icon: "headset", title: t.emergency, value: t.emergencyValue, hint: t.emergencyHint },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
            <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-700">
              <Icon name={c.icon} className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-navy-500">{c.title}</p>
            <p className="text-[15px] font-bold text-navy-900">{c.value}</p>
            <p className="text-xs text-navy-500">{c.hint}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-extrabold tracking-tight text-navy-900">{t.faqTitle}</h2>
      <div className="mt-4 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
        {t.faq.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-navy-900">
              {item.q}
              <Icon
                name="chevronDown"
                className="size-4 shrink-0 text-navy-400 transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-navy-600">{item.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-10 rounded-2xl bg-navy-50 p-5 text-sm text-navy-600">{t.demoNotice}</p>
    </div>
  );
}

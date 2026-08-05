import Icon from "@/components/ui/Icon";
import { BENEFITS } from "@/lib/data";

export default function Benefits() {
  return (
    <section className="mx-auto max-w-page px-4">
      <h2 className="text-center text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
        Pourquoi réserver chez nous
      </h2>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {BENEFITS.map((b) => (
          <div key={b.title} className="text-center sm:text-left">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-700 sm:mx-0">
              <Icon name={b.icon} className="size-6" />
            </span>
            <h3 className="mt-3 text-[15px] font-bold leading-snug text-navy-900">{b.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

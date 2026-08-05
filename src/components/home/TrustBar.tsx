import { TRUST_POINTS } from "@/lib/data";

export default function TrustBar() {
  return (
    <section className="border-y border-navy-100 bg-navy-50/50">
      <div className="mx-auto grid max-w-page grid-cols-2 gap-px px-4 py-6 lg:grid-cols-4">
        {TRUST_POINTS.map((p) => (
          <div key={p.label} className="px-2 py-2 text-center">
            <p className="text-2xl font-extrabold text-navy-800 sm:text-3xl">{p.value}</p>
            <p className="mt-0.5 text-xs text-navy-600 sm:text-sm">{p.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

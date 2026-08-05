import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function GiftCard() {
  return (
    <section className="mx-auto max-w-page px-4">
      <div className="grid items-center gap-6 rounded-2xl border border-gold-200 bg-gold-50 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto]">
        <span className="grid size-14 place-items-center rounded-2xl bg-gold-400 text-navy-900">
          <Icon name="gift" className="size-7" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Offrez un voyage, pas un objet</h2>
          <p className="mt-1 text-sm text-navy-600">
            La carte cadeau est valable deux ans sur l&apos;ensemble du catalogue, du week-end à
            Bruges au tour du Japon. Montant libre à partir de 50 €.
          </p>
        </div>
        <Link
          href="/aide"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-900"
        >
          Offrir une carte
          <Icon name="chevronRight" className="size-4" />
        </Link>
      </div>
    </section>
  );
}

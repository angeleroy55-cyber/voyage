import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { BRAND } from "@/lib/data";

export const metadata = { title: "Aide & contact" };

const FAQ = [
  {
    q: "Quand vais-je recevoir mes documents de voyage ?",
    a: "Le bon d'échange et les billets sont envoyés par e-mail dès l'encaissement, et au plus tard sept jours avant le départ pour les réservations anticipées.",
  },
  {
    q: "Puis-je modifier les noms des voyageurs après réservation ?",
    a: "Oui pour la plupart des séjours, jusqu'à 21 jours avant le départ. Sur les vols secs, cela dépend des conditions tarifaires de la compagnie.",
  },
  {
    q: "Comment fonctionne le paiement en quatre fois ?",
    a: "Un quart du montant est prélevé à la réservation, puis trois mensualités sans frais. L'option apparaît au moment du paiement pour les dossiers de plus de 200 €.",
  },
  {
    q: "Que couvre l'assurance annulation ?",
    a: "Maladie, accident, licenciement et un ensemble de motifs listés dans les conditions. Elle se souscrit uniquement au moment de la réservation.",
  },
  {
    q: "Mon vol est annulé, que faire ?",
    a: "Contactez l'assistance au numéro figurant sur votre bon d'échange, joignable 24 h/24. Un conseiller cherche une solution de report avec la compagnie.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-navy-500">
        <Link href="/" className="hover:text-gold-700">
          Accueil
        </Link>
        <Icon name="chevronRight" className="size-3" />
        <span className="font-semibold text-navy-800">Aide</span>
      </nav>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        Comment pouvons-nous vous aider&nbsp;?
      </h1>

      <div id="contact" className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "phone", title: "Par téléphone", value: BRAND.phone, hint: "7j/7, de 8 h à 22 h" },
          { icon: "mail", title: "Par e-mail", value: BRAND.email, hint: "Réponse sous 24 h" },
          { icon: "headset", title: "Urgence en voyage", value: "24 h/24", hint: "Numéro sur votre bon" },
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

      <h2 className="mt-12 text-xl font-extrabold tracking-tight text-navy-900">Questions fréquentes</h2>
      <div className="mt-4 divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
        {FAQ.map((item) => (
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

      <p className="mt-10 rounded-2xl bg-navy-50 p-5 text-sm text-navy-600">
        Ce site est une maquette de démonstration : les coordonnées, offres, prix et avis affichés
        sont fictifs et aucune réservation réelle n&apos;est possible.
      </p>
    </div>
  );
}

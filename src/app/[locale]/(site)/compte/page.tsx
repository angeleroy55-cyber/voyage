import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForms from "@/components/account/AuthForms";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { getCustomerSession } from "@/server/customer-session";

export const metadata = { title: "Espace client" };
export const dynamic = "force-dynamic";

const ARGUMENTS = [
  {
    icon: "package",
    title: "Le suivi de chaque dossier",
    text: "Statut, dates, voyageurs et documents de voyage réunis au même endroit, de la demande au retour.",
  },
  {
    icon: "calendar",
    title: "Vos échéances de paiement",
    text: "Le détail du 4× sans frais, les montants déjà réglés et la prochaine date de prélèvement.",
  },
  {
    icon: "heart",
    title: "Vos séjours mis de côté",
    text: "Retrouvez les offres enregistrées et comparez-les tranquillement avant de vous décider.",
  },
  {
    icon: "gift",
    title: "Un statut fidélité",
    text: "Un point par euro dépensé, des avantages appliqués automatiquement dès la réservation.",
  },
];

export default async function AccountPage() {
  // Une session valide n'a rien à faire sur l'écran de connexion.
  if (await getCustomerSession()) redirect("/compte/tableau-de-bord");

  // Le compte de démonstration créé par le seed est pré-rempli pour que la
  // maquette soit explorable sans inscription préalable.
  const demo =
    process.env.NODE_ENV === "production"
      ? undefined
      : { email: "camille.durand@example.fr", password: "gosejour2026" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Reveal variant="left">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-700">
              <Icon name="compass" className="size-4" />
              Espace client
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-4xl">
              Vos voyages, suivis de bout en bout
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-600">
              Un seul endroit pour savoir où en est chaque réservation, ce qu&apos;il reste à
              régler et quels documents sont disponibles, sans rappeler le service client.
            </p>

            <ul className="mt-8 space-y-5">
              {ARGUMENTS.map((item) => (
                <li key={item.title} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-navy-900">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-navy-600">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-xl border border-navy-100 bg-navy-50/60 p-4 text-sm text-navy-600">
              Vous avez réservé sans créer de compte ? Inscrivez-vous avec l&apos;adresse utilisée
              lors de la commande : vos dossiers y seront rattachés automatiquement. Sinon,{" "}
              <Link href="/aide#contact" className="font-semibold text-gold-700 hover:underline">
                contactez un conseiller
              </Link>
              .
            </p>
          </div>
        </Reveal>

        <Reveal variant="right">
          <AuthForms demo={demo} />
        </Reveal>
      </div>
    </div>
  );
}

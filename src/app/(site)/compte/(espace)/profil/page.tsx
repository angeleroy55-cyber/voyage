import { notFound } from "next/navigation";
import { PasswordForm, ProfileForm } from "@/components/account/ProfileForms";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { LOYALTY_TIERS, loyaltyTier } from "@/lib/constants";
import { dateLabel } from "@/lib/format";
import { getCustomer } from "@/server/account";
import { requireCustomer } from "@/server/customer-session";

export const metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const session = await requireCustomer();
  const customer = await getCustomer(session.sub);
  // La session est signée mais le compte a pu être supprimé entre-temps.
  if (!customer) notFound();

  const tier = loyaltyTier(customer.loyaltyPoints);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Mon profil</h1>
        <p className="mt-1 text-sm text-navy-600">
          Ces informations sont reprises automatiquement lors de vos prochaines réservations.
        </p>
      </header>

      <Reveal>
        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
            Coordonnées
          </h2>
          <div className="mt-4">
            <ProfileForm
              profile={{
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                city: customer.city,
                newsletter: customer.newsletter,
              }}
            />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
            Sécurité
          </h2>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-900">
            Compte et fidélité
          </h2>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { label: "Membre depuis", value: dateLabel(customer.createdAt) },
              {
                label: "Dernière connexion",
                value: customer.lastLoginAt ? dateLabel(customer.lastLoginAt) : "—",
              },
              { label: "Statut", value: tier.label },
              {
                label: "Points cumulés",
                value: `${customer.loyaltyPoints.toLocaleString("fr-FR")} pts`,
              },
            ].map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wide text-navy-500">{row.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-navy-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {LOYALTY_TIERS.map((level) => {
              const reached = customer.loyaltyPoints >= level.from;
              return (
                <li
                  key={level.id}
                  className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                    level.id === tier.id
                      ? "border-gold-300 bg-gold-50"
                      : "border-navy-100 bg-white"
                  }`}
                >
                  <Icon
                    name={reached ? "check" : "clock"}
                    className={`mt-0.5 size-4 shrink-0 ${
                      reached ? "text-teal-500" : "text-navy-300"
                    }`}
                  />
                  <span>
                    <span className="block font-bold text-navy-900">
                      {level.label}
                      <span className="ml-1.5 text-xs font-medium text-navy-500">
                        dès {level.from.toLocaleString("fr-FR")} pts
                      </span>
                    </span>
                    <span className="block text-xs text-navy-600">{level.perk}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}

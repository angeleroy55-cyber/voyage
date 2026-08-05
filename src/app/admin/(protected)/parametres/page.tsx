import { prisma } from "@/server/prisma";
import { saveSettings } from "@/server/actions/admin";
import { cloudinaryConfigured } from "@/server/media";

export const metadata = { title: "Réglages" };
export const dynamic = "force-dynamic";

const FIELDS = [
  { key: "site.name", label: "Nom du site", hint: "Affiché dans les métadonnées" },
  { key: "site.tagline", label: "Signature", hint: "Voyages • Séjours • Expériences" },
  { key: "site.phone", label: "Téléphone", hint: "Barre supérieure et pied de page" },
  { key: "site.email", label: "E-mail de contact", hint: "" },
  { key: "hero.title", label: "Titre de la page d'accueil", hint: "" },
  { key: "hero.subtitle", label: "Sous-titre de la page d'accueil", hint: "" },
];

export default async function SettingsPage({ searchParams }: PageProps<"/admin/parametres">) {
  const sp = await searchParams;
  const rows = await prisma.setting.findMany();
  const values = new Map(rows.map((r) => [r.key, r.value]));

  const [offers, destinations, reviews, bookings, admins] = await Promise.all([
    prisma.offer.count(),
    prisma.destination.count(),
    prisma.review.count(),
    prisma.booking.count(),
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Réglages</h1>
      <p className="mt-1 text-sm text-navy-600">
        Ces valeurs sont lues par le site public à chaque rendu.
      </p>

      {sp.enregistre && (
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700">
          Réglages enregistrés.
        </p>
      )}

      <form action={saveSettings} className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
                {field.label}
              </span>
              <input
                name={field.key}
                defaultValue={values.get(field.key) ?? ""}
                className="mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400"
              />
              {field.hint && (
                <span className="mt-1 block text-xs text-navy-400">{field.hint}</span>
              )}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="mt-5 rounded-xl bg-gold-400 px-6 py-3 text-sm font-bold text-navy-900 hover:bg-gold-500"
        >
          Enregistrer
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">État du système</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["Base de données", "PostgreSQL"],
            ["Stockage des visuels", cloudinaryConfigured() ? "Cloudinary" : "public/uploads (local)"],
            ["Offres", String(offers)],
            ["Destinations", String(destinations)],
            ["Avis", String(reviews)],
            ["Réservations", String(bookings)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-navy-50 py-1.5">
              <dt className="text-navy-600">{label}</dt>
              <dd className="font-semibold text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>
        {!cloudinaryConfigured() && (
          <p className="mt-3 rounded-xl bg-gold-50 px-3.5 py-2.5 text-xs text-navy-700">
            Renseigner CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans
            .env.local bascule automatiquement les prochains téléversements vers Cloudinary.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Comptes du back-office</h2>
        <ul className="mt-3 divide-y divide-navy-100">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-navy-900">
                  {admin.name || admin.email}
                </span>
                <span className="block truncate text-xs text-navy-500">{admin.email}</span>
              </span>
              <span className="shrink-0 text-right text-xs text-navy-500">
                <span className="block font-semibold text-navy-700">{admin.role}</span>
                {admin.lastLoginAt
                  ? `vu le ${admin.lastLoginAt.toLocaleDateString("fr-FR")}`
                  : "jamais connecté"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

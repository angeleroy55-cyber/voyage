import AdminNotice from "@/components/admin/AdminNotice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { prisma } from "@/server/prisma";
import { recomputeCounters, saveSettings } from "@/server/actions/admin";
import { counterDrift } from "@/server/counters";
import { cloudinaryConfigured } from "@/server/media";
import { getMailerSummary } from "@/server/mail";

export const metadata = { title: "Réglages" };
export const dynamic = "force-dynamic";

const FIELDS = [
  { key: "site.name", label: "Nom du site", hint: "Affiché dans les métadonnées" },
  { key: "site.tagline", label: "Signature", hint: "Voyages • Séjours • Expériences" },
  { key: "site.phone", label: "Téléphone", hint: "Barre supérieure et pied de page" },
  {
    key: "site.whatsapp",
    label: "Numéro WhatsApp",
    hint: "Au format international, ex. +33 7 59 82 38 73. Vide, le bouton disparaît.",
  },
  { key: "site.email", label: "E-mail de contact", hint: "" },
  // Coordonnées bancaires du virement.
  //
  // Elles vivent en base, jamais dans le code : le dépôt est versionné et
  // partagé, un IBAN écrit en dur y resterait dans l'historique même après
  // effacement. Elles ne sont montrées qu'au client qui a choisi le virement,
  // sur sa confirmation, et non sur une page publique où n'importe qui les
  // relèverait.
  {
    key: "payment.holder",
    label: "Titulaire du compte",
    hint: "Affiché au client qui règle par virement",
  },
  { key: "payment.iban", label: "IBAN", hint: "Vide, le virement n'est pas proposé" },
  { key: "payment.bic", label: "BIC", hint: "" },
  { key: "hero.title", label: "Titre de la page d'accueil", hint: "" },
  { key: "hero.subtitle", label: "Sous-titre de la page d'accueil", hint: "" },
];

export default async function SettingsPage({ searchParams }: PageProps<"/admin/parametres">) {
  const sp = await searchParams;
  const rows = await prisma.setting.findMany();
  const values = new Map(rows.map((r) => [r.key, r.value]));
  const mailer = getMailerSummary();

  const [offers, destinations, reviews, bookings, admins, drift] = await Promise.all([
    prisma.offer.count(),
    prisma.destination.count(),
    prisma.review.count(),
    prisma.booking.count(),
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    }),
    counterDrift(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Réglages</h1>
      <p className="mt-1 text-sm text-navy-600">
        Ces valeurs sont lues par le site public à chaque rendu.
      </p>

      {sp.enregistre && <AdminNotice>Réglages enregistrés.</AdminNotice>}
      {typeof sp.compteurs === "string" && (
        <AdminNotice>
          Compteurs recalculés : {sp.compteurs.split("-")[0]} offre(s) et{" "}
          {sp.compteurs.split("-")[1]} destination(s) remises à jour.
        </AdminNotice>
      )}

      <section className="mt-4 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Maintenance des compteurs</h2>
        <p className="mt-1 text-sm text-navy-600">
          La note des offres et le nombre d&apos;offres par destination sont stockés plutôt que
          recalculés à chaque affichage. Ils se remettent à jour tout seuls à chaque modération et à
          chaque publication ; cette reprise sert à rattraper des données importées.
        </p>

        {drift.offers + drift.destinations === 0 ? (
          <p className="mt-3 text-sm text-teal-700">
            Tous les compteurs correspondent déjà aux données réelles.
          </p>
        ) : (
          <>
            <p className="mt-3 rounded-xl bg-gold-50 px-4 py-3 text-sm text-navy-700">
              <strong className="font-bold">{drift.offers} offre(s)</strong> et{" "}
              <strong className="font-bold">{drift.destinations} destination(s)</strong> affichent
              aujourd&apos;hui un chiffre qui ne vient pas des données. Sur le jeu de démonstration
              ce sont des valeurs éditoriales : la reprise les remplacerait par les valeurs réelles,
              souvent nulles.
            </p>
            <div className="mt-3">
              <ConfirmButton
                action={recomputeCounters}
                label="Recalculer les compteurs"
                title="Recalculer tous les compteurs ?"
                description={`${drift.offers} note(s) d'offre et ${drift.destinations} compteur(s) de destination seront réécrits à partir des avis publiés et des offres en ligne. Les chiffres saisis à la main, y compris ceux du jeu de démonstration, seront perdus.`}
                confirmLabel="Recalculer"
                tone="neutral"
                className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
              />
            </div>
          </>
        )}
      </section>

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
            ["Messagerie transactionnelle", mailer.enabled ? `${mailer.host}:${mailer.port}` : "Désactivée"],
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
        {!mailer.enabled && (
          <p className="mt-3 rounded-xl bg-gold-50 px-3.5 py-2.5 text-xs text-navy-700">
            Renseigner SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER et SMTP_PASSWORD dans
            .env.local active les e-mails transactionnels.
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

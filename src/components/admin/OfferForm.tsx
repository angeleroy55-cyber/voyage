import { BOARDS } from "@/lib/constants";

type Category = { id: string; label: string };
type Destination = { id: string; name: string };

export type OfferFormValues = {
  slug?: string;
  title?: string;
  destination?: string;
  country?: string;
  region?: string;
  departureCity?: string;
  categoryId?: string;
  destinationId?: string | null;
  nights?: number;
  stars?: number;
  board?: string;
  price?: number;
  oldPrice?: number | null;
  rating?: number;
  reviewsCount?: number;
  dates?: string;
  description?: string;
  tags?: string[];
  amenities?: string[];
  highlights?: string[];
  included?: string[];
  status?: string;
  featured?: boolean;
  position?: number;
};

/**
 * Formulaire partagé entre la création et la modification d'une offre.
 * Il est volontairement non contrôlé : les valeurs par défaut viennent du
 * serveur et l'envoi passe par une action, sans état React à synchroniser.
 */
export default function OfferForm({
  action,
  values = {},
  categories,
  destinations,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: OfferFormValues;
  categories: Category[];
  destinations: Destination[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <Card title="Identité de l'offre">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre" required className="sm:col-span-2">
            <input
              name="title"
              required
              defaultValue={values.title}
              placeholder="Riad & spa dans la Palmeraie"
              className={INPUT}
            />
          </Field>

          <Field label="Type de voyage" required>
            <select name="categoryId" required defaultValue={values.categoryId} className={INPUT}>
              <option value="">— Choisir —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination rattachée" hint="Pour les pages destination">
            <select name="destinationId" defaultValue={values.destinationId ?? ""} className={INPUT}>
              <option value="">— Aucune —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ville / station" required>
            <input name="destination" required defaultValue={values.destination} className={INPUT} />
          </Field>
          <Field label="Pays">
            <input name="country" defaultValue={values.country} className={INPUT} />
          </Field>
          <Field label="Région">
            <input name="region" defaultValue={values.region} className={INPUT} />
          </Field>
          <Field label="Ville de départ">
            <input name="departureCity" defaultValue={values.departureCity ?? "Paris"} className={INPUT} />
          </Field>

          <Field
            label="Identifiant d'URL"
            hint="Laisser vide pour le générer depuis le titre"
            className="sm:col-span-2"
          >
            <input name="slug" defaultValue={values.slug} placeholder="marrakech-palmeraie" className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="Séjour et tarif">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nuits / jours">
            <input type="number" name="nights" min={0} defaultValue={values.nights ?? 7} className={INPUT} />
          </Field>
          <Field label="Étoiles" hint="0 pour un vol ou une voiture">
            <input type="number" name="stars" min={0} max={5} defaultValue={values.stars ?? 4} className={INPUT} />
          </Field>
          <Field label="Restauration">
            <select name="board" defaultValue={values.board} className={INPUT}>
              {BOARDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>

          <Field label="Prix par personne (€)" required>
            <input type="number" name="price" min={0} required defaultValue={values.price} className={INPUT} />
          </Field>
          <Field label="Prix barré (€)" hint="Doit dépasser le prix courant">
            <input type="number" name="oldPrice" min={0} defaultValue={values.oldPrice ?? ""} className={INPUT} />
          </Field>
          <Field label="Disponibilité">
            <input
              name="dates"
              defaultValue={values.dates}
              placeholder="Départs de mars à octobre"
              className={INPUT}
            />
          </Field>

          <Field label="Note /10">
            <input
              type="number"
              name="rating"
              min={0}
              max={10}
              step={0.1}
              defaultValue={values.rating ?? 8.5}
              className={INPUT}
            />
          </Field>
          <Field label="Nombre d'avis">
            <input type="number" name="reviewsCount" min={0} defaultValue={values.reviewsCount ?? 0} className={INPUT} />
          </Field>
          <Field label="Ordre d'affichage">
            <input type="number" name="position" defaultValue={values.position ?? 0} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="Contenu de la fiche">
        <Field label="Description">
          <textarea name="description" rows={4} defaultValue={values.description} className={INPUT} />
        </Field>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Points forts" hint="Une ligne par élément">
            <textarea name="highlights" rows={5} defaultValue={values.highlights?.join("\n")} className={INPUT} />
          </Field>
          <Field label="Compris dans le prix" hint="Une ligne par élément">
            <textarea name="included" rows={5} defaultValue={values.included?.join("\n")} className={INPUT} />
          </Field>
          <Field label="Équipements et services" hint="Une ligne par élément">
            <textarea name="amenities" rows={4} defaultValue={values.amenities?.join("\n")} className={INPUT} />
          </Field>
          <Field label="Étiquettes" hint="Une ligne par étiquette (Vente flash, Famille…)">
            <textarea name="tags" rows={4} defaultValue={values.tags?.join("\n")} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="Publication">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Statut">
            <select name="status" defaultValue={values.status ?? "draft"} className={INPUT}>
              <option value="draft">Brouillon</option>
              <option value="published">En ligne</option>
              <option value="archived">Archivée</option>
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 pb-2.5 text-sm text-navy-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={values.featured}
              className="size-4 rounded border-navy-300 accent-gold-500"
            />
            Mettre en avant sur la page d&apos;accueil
          </label>
        </div>
      </Card>

      <button
        type="submit"
        className="rounded-xl bg-gold-400 px-6 py-3 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500"
      >
        {submitLabel}
      </button>
    </form>
  );
}

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-5">
      <h2 className="mb-4 text-base font-extrabold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
        {label}
        {required && <span className="text-gold-700"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-navy-400">{hint}</span>}
    </label>
  );
}

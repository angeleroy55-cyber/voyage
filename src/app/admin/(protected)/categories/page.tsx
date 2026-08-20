import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminNotice from "@/components/admin/AdminNotice";
import { prisma } from "@/server/prisma";
import {
  deleteCategory,
  moveCategory,
  saveCategory,
  setCategoryActive,
} from "@/server/actions/categories";
import { CATEGORY_ICONS, FORM_FIELDS } from "@/lib/constants";

export const metadata = { title: "Types de voyage" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

const MESSAGES: Record<string, string> = {
  libelle: "Le libellé est obligatoire.",
  slug: "Le libellé ne produit aucun identifiant d'URL exploitable.",
  doublon: "Un autre type de voyage utilise déjà cet identifiant d'URL.",
  offres: "Ce type de voyage porte encore des offres : il ne peut pas être supprimé.",
};

export default async function CategoriesAdminPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const sp = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { label: "asc" }],
    include: { _count: { select: { offers: true } } },
  });

  const erreur = typeof sp.erreur === "string" ? sp.erreur : null;
  const nombre = typeof sp.nombre === "string" ? sp.nombre : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Types de voyage</h1>
      <p className="mt-1 text-sm text-navy-600">
        Chaque type devient un onglet du moteur de recherche. Les champs cochés décident de ce que
        le visiteur peut saisir avant de lancer sa recherche.
      </p>

      {erreur && (
        <AdminNotice tone="error">
          {MESSAGES[erreur] ?? "L'enregistrement a échoué."}
          {erreur === "offres" && nombre && (
            <>
              {" "}
              <Link href="/admin/offres" className="font-semibold underline">
                Voir les {nombre} offre(s) concernée(s)
              </Link>
            </>
          )}
        </AdminNotice>
      )}
      {sp.enregistre && <AdminNotice>Type de voyage enregistré.</AdminNotice>}
      {sp.supprime && <AdminNotice>Type de voyage supprimé.</AdminNotice>}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Ajouter un type de voyage</h2>
        <CategoryFields action={saveCategory.bind(null, null)} submitLabel="Ajouter" />
      </section>

      {categories.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          Aucun type de voyage pour l&apos;instant. Le moteur de recherche reste vide tant qu&apos;il
          n&apos;y en a pas au moins un.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {categories.map((category, index) => (
            <li key={category.id} className="rounded-2xl border border-navy-100 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-navy-50 text-navy-700">
                    <Icon name={category.icon} className="size-5" />
                  </span>
                  <div>
                    <p className="font-extrabold text-navy-900">{category.label}</p>
                    <p className="text-xs text-navy-500">
                      /recherche/{category.slug} · {category._count.offers} offre(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <form action={moveCategory.bind(null, category.id, "up")}>
                    <button
                      disabled={index === 0}
                      aria-label={`Monter ${category.label}`}
                      className="rounded-lg border border-navy-200 p-1.5 text-navy-700 hover:bg-navy-50 disabled:opacity-30"
                    >
                      <Icon name="chevronDown" className="size-4 rotate-180" />
                    </button>
                  </form>
                  <form action={moveCategory.bind(null, category.id, "down")}>
                    <button
                      disabled={index === categories.length - 1}
                      aria-label={`Descendre ${category.label}`}
                      className="rounded-lg border border-navy-200 p-1.5 text-navy-700 hover:bg-navy-50 disabled:opacity-30"
                    >
                      <Icon name="chevronDown" className="size-4" />
                    </button>
                  </form>
                  <form action={setCategoryActive.bind(null, category.id, !category.active)}>
                    <button
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        category.active
                          ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                          : "bg-navy-100 text-navy-700 hover:bg-navy-200"
                      }`}
                    >
                      {category.active ? "En ligne" : "Masqué"}
                    </button>
                  </form>
                </div>
              </div>

              <CategoryFields
                action={saveCategory.bind(null, category.id)}
                submitLabel="Enregistrer"
                category={category}
              />

              <div className="mt-3 border-t border-navy-100 pt-3">
                <ConfirmButton
                  action={deleteCategory.bind(null, category.id)}
                  label="Supprimer ce type de voyage"
                  title={`Supprimer « ${category.label} » ?`}
                  description={
                    category._count.offers > 0
                      ? `« ${category.label} » porte ${category._count.offers} offre(s). La suppression sera refusée tant qu'elles n'auront pas changé de type.`
                      : `« ${category.label} » disparaîtra du moteur de recherche. Cette action est définitive.`
                  }
                  confirmLabel="Supprimer"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type CategoryRow = {
  slug: string;
  label: string;
  icon: string;
  blurb: string;
  formFields: string;
  active: boolean;
};

/** Formulaire partagé par la création et l'édition : mêmes champs, mêmes règles. */
function CategoryFields({
  action,
  submitLabel,
  category,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  category?: CategoryRow;
}) {
  const picked = new Set((category?.formFields ?? "destination,dates,travellers").split(","));

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">Libellé *</span>
        <input
          name="label"
          required
          defaultValue={category?.label}
          placeholder="Croisières"
          className={INPUT}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Identifiant d&apos;URL
        </span>
        <input
          name="slug"
          defaultValue={category?.slug}
          placeholder="Déduit du libellé si vide"
          className={INPUT}
        />
      </label>

      <label className="block sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Accroche affichée sous l&apos;onglet
        </span>
        <input
          name="blurb"
          defaultValue={category?.blurb}
          placeholder="Méditerranée, Caraïbes et fjords, pension complète incluse"
          className={INPUT}
        />
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Pictogramme
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_ICONS.map((name) => (
            <label
              key={name}
              className="cursor-pointer rounded-xl border border-navy-200 p-2 text-navy-700 transition has-checked:border-gold-400 has-checked:bg-gold-50 has-checked:text-navy-900 hover:bg-navy-50"
            >
              <input
                type="radio"
                name="icon"
                value={name}
                defaultChecked={(category?.icon ?? "pin") === name}
                className="sr-only"
              />
              <Icon name={name} className="size-5" />
              <span className="sr-only">{name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Champs du moteur de recherche
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {FORM_FIELDS.map((field) => (
            <label
              key={field.id}
              className="flex items-start gap-2 rounded-xl border border-navy-100 px-3 py-2 text-sm text-navy-700"
            >
              <input
                type="checkbox"
                name="formFields"
                value={field.id}
                defaultChecked={picked.has(field.id)}
                className="mt-0.5 size-4 rounded accent-gold-500"
              />
              <span>
                {field.label}
                <span className="block text-xs text-navy-500">{field.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
          className="size-4 rounded accent-gold-500"
        />
        Visible sur le site
      </label>

      <button className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:justify-self-end">
        {submitLabel}
      </button>
    </form>
  );
}

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
import {
  CATEGORY_ACCENTS,
  CATEGORY_ICONS,
  CATEGORY_KINDS,
  FORM_FIELDS,
  OFFER_RULES,
} from "@/lib/constants";

export const metadata = { title: "Catégories" };
export const dynamic = "force-dynamic";

const INPUT =
  "mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-400";

const MESSAGES: Record<string, string> = {
  libelle: "Le libellé est obligatoire.",
  slug: "Le libellé ne produit aucun identifiant d'URL exploitable.",
  doublon: "Une autre catégorie utilise déjà cet identifiant d'URL.",
  offres: "Cette catégorie porte encore des offres : elle ne peut pas être supprimée.",
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
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Catégories</h1>
      <p className="mt-1 text-sm text-navy-600">
        Chaque catégorie devient une page à la racine du site, et les dix premières forment le menu
        principal. Au-delà, cocher « Sous Voir plus » pour la ranger dans le menu déroulant sans lui
        faire perdre sa page.
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
      {sp.enregistre && <AdminNotice>Catégorie enregistrée.</AdminNotice>}
      {sp.supprime && <AdminNotice>Catégorie supprimée.</AdminNotice>}

      <section className="mt-5 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Ajouter une catégorie</h2>
        <CategoryFields action={saveCategory.bind(null, null)} submitLabel="Ajouter" />
      </section>

      {categories.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-navy-200 p-10 text-center text-sm text-navy-500">
          Aucune catégorie pour l&apos;instant. La navigation reste vide tant qu&apos;il
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
                    <p className="flex flex-wrap items-center gap-2 font-extrabold text-navy-900">
                      {category.label}
                      {category.isOverflow && (
                        <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-navy-600">
                          Voir plus
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-navy-500">
                      /{category.slug} ·{" "}
                      {CATEGORY_KINDS.find((k) => k.id === category.kind)?.label ?? category.kind}
                      {/* Un listing calculé n'a pas d'offre en propre : afficher
                          « 0 offre » laisserait croire à une page vide. */}
                      {category.kind === "catalogue" && ` · ${category._count.offers} offre(s)`}
                      {category.kind === "dynamique" &&
                        category.rule &&
                        ` · ${OFFER_RULES.find((r) => r.id === category.rule)?.label ?? category.rule}`}
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
                  label="Supprimer cette catégorie"
                  title={`Supprimer « ${category.label} » ?`}
                  description={
                    category._count.offers > 0
                      ? `« ${category.label} » porte ${category._count.offers} offre(s). La suppression sera refusée tant qu'elles n'auront pas changé de catégorie.`
                      : `« ${category.label} » disparaîtra de la navigation et sa page ne répondra plus. Cette action est définitive.`
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
  title: string;
  icon: string;
  blurb: string;
  kind: string;
  rule: string;
  accent: string;
  isOverflow: boolean;
  showDiscountPercent: boolean;
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
        <span className="mt-1 block text-xs text-navy-500">
          Devient l&apos;adresse de la page : /{category?.slug || "sejours"}
        </span>
      </label>

      <label className="block sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Titre long de la page
        </span>
        <input
          name="title"
          defaultValue={category?.title}
          placeholder="Repris du libellé si vide, ex. « Séjours & Vol + Hôtel »"
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-navy-500">
          Le libellé sert au menu, ce titre au H1 et à la balise title.
        </span>
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

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Ce que contient la catégorie
        </span>
        <select name="kind" defaultValue={category?.kind ?? "catalogue"} className={INPUT}>
          {CATEGORY_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label} : {k.hint}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Règle du listing calculé
        </span>
        <select name="rule" defaultValue={category?.rule ?? ""} className={INPUT}>
          <option value="">Aucune</option>
          {OFFER_RULES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} : {r.hint}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-navy-500">
          Ignorée si la catégorie n&apos;est pas un listing calculé.
        </span>
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Couleur du badge sur les cartes
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_ACCENTS.map((a) => (
            <label key={a.id} className="cursor-pointer">
              <input
                type="radio"
                name="accent"
                value={a.id}
                defaultChecked={(category?.accent ?? "navy") === a.id}
                className="peer sr-only"
              />
              <span
                className={`block rounded-lg px-3 py-1.5 text-xs font-bold opacity-45 transition peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-navy-400 peer-checked:ring-offset-1 ${a.badge}`}
              >
                {a.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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

      <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={category?.active ?? true}
            className="size-4 rounded accent-gold-500"
          />
          Visible sur le site
        </label>

        <label className="flex items-start gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            name="isOverflow"
            defaultChecked={category?.isOverflow ?? false}
            className="mt-0.5 size-4 rounded accent-gold-500"
          />
          <span>
            Sous « Voir plus »
            <span className="block text-xs text-navy-500">
              Hors du menu principal, limité à dix entrées.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            name="showDiscountPercent"
            defaultChecked={category?.showDiscountPercent ?? false}
            className="mt-0.5 size-4 rounded accent-gold-500"
          />
          <span>
            Afficher la remise en %
            <span className="block text-xs text-navy-500">
              Le montant économisé en euros, lui, s&apos;affiche partout.
            </span>
          </span>
        </label>
      </div>

      <button className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-gold-500 sm:col-span-2 sm:justify-self-end">
        {submitLabel}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/account/ProfileForms";
import Icon from "@/components/ui/Icon";
import { loginCustomer, registerCustomer, type FormState } from "@/server/actions/account";

const INITIAL: FormState = { ok: false, message: "" };

/**
 * Connexion et création de compte, dans un même bloc à deux onglets.
 *
 * Les deux formulaires sont montés séparément pour que chacun garde son propre
 * état d'action : basculer d'un onglet à l'autre n'affiche pas l'erreur laissée
 * par le précédent.
 */
export default function AuthForms({ demo }: { demo?: { email: string; password: string } }) {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
      <div role="tablist" className="mb-5 flex gap-1 rounded-xl bg-navy-50 p-1">
        {(
          [
            { id: "login", label: "J'ai un compte" },
            { id: "register", label: "Créer un compte" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
              tab === item.id
                ? "bg-white text-navy-900 shadow-card"
                : "text-navy-600 hover:text-navy-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "login" ? <LoginForm demo={demo} /> : <RegisterForm />}
    </div>
  );
}

function LoginForm({ demo }: { demo?: { email: string; password: string } }) {
  const [state, formAction] = useActionState(loginCustomer, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={demo?.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        defaultValue={demo?.password}
      />

      {state.message && !state.ok && (
        <p
          role="alert"
          className="animate-fade-up flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          <Icon name="close" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Submit idle="Se connecter" busy="Connexion…" />

      {demo && (
        <p className="rounded-xl bg-navy-50 p-3 text-xs leading-relaxed text-navy-600">
          <strong className="text-navy-800">Compte de démonstration</strong> : les identifiants
          sont pré-remplis : {demo.email}. Il donne accès à un historique de réservations fictif.
        </p>
      )}
    </form>
  );
}

function RegisterForm() {
  const [state, formAction] = useActionState(registerCustomer, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Prénom"
          name="firstName"
          autoComplete="given-name"
          required
          error={state.field === "firstName" ? state.message : undefined}
        />
        <Field label="Nom" name="lastName" autoComplete="family-name" />
      </div>
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.field === "email" ? state.message : undefined}
      />
      <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="8 caractères minimum"
        error={state.field === "password" ? state.message : undefined}
      />

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-700">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked
          className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
        />
        Je souhaite recevoir les alertes prix (désinscription en un clic).
      </label>

      {state.message && !state.ok && !state.field && (
        <p
          role="alert"
          className="animate-fade-up flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          <Icon name="close" className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Submit idle="Créer mon compte" busy="Création…" />

      <p className="text-xs leading-relaxed text-navy-500">
        En créant un compte, vous acceptez les conditions générales et la politique de
        confidentialité de GoSéjour.
      </p>
    </form>
  );
}

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-gold-400 py-3 text-[15px] font-bold text-navy-900 transition hover:bg-gold-500 disabled:opacity-60"
    >
      {pending ? busy : idle}
    </button>
  );
}

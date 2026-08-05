"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Icon from "@/components/ui/Icon";
import { changePassword, updateProfile, type FormState } from "@/server/actions/account";

const INITIAL: FormState = { ok: false, message: "" };

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  newsletter: boolean;
};

/** Coordonnées du voyageur, reprises lors de chaque réservation. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Prénom"
          name="firstName"
          defaultValue={profile.firstName}
          required
          error={state.field === "firstName" ? state.message : undefined}
        />
        <Field label="Nom" name="lastName" defaultValue={profile.lastName} />
      </div>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
          Adresse e-mail
        </span>
        <input
          type="email"
          value={profile.email}
          readOnly
          // L'adresse identifie le compte et sert de clé de rattachement des
          // réservations : elle se change auprès du service client, après
          // vérification, pas depuis ce formulaire.
          className="mt-1 w-full cursor-not-allowed rounded-xl border border-navy-200 bg-navy-50 px-3.5 py-2.5 text-[15px] text-navy-600"
        />
        <span className="mt-1 block text-xs text-navy-500">
          Pour modifier votre adresse, contactez le service client.
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Téléphone" name="phone" type="tel" defaultValue={profile.phone} />
        <Field label="Ville" name="city" defaultValue={profile.city} />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-navy-50 p-3.5 text-sm text-navy-700">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={profile.newsletter}
          className="mt-0.5 size-4 rounded border-navy-300 accent-gold-500"
        />
        <span>
          <span className="font-semibold text-navy-900">Recevoir les alertes prix</span> — un e-mail
          par semaine sur les destinations que vous suivez.
        </span>
      </label>

      <Feedback state={state} />
      <Submit idle="Enregistrer mes informations" busy="Enregistrement…" />
    </form>
  );
}

/** Changement de mot de passe, indépendant du reste du profil. */
export function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={state.field === "currentPassword" ? state.message : undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nouveau mot de passe"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          hint="8 caractères minimum"
          error={state.field === "newPassword" ? state.message : undefined}
        />
        <Field
          label="Confirmation"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={state.field === "confirmPassword" ? state.message : undefined}
        />
      </div>

      <Feedback state={state} />
      <Submit idle="Changer le mot de passe" busy="Mise à jour…" />
    </form>
  );
}

// ---- Éléments partagés -----------------------------------------------------

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  autoComplete,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[15px] outline-none transition focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-navy-200 focus:border-navy-400 focus:ring-navy-200"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-navy-500">{hint}</span>
      )}
    </label>
  );
}

/** Message global : les erreurs rattachées à un champ sont affichées sous lui. */
function Feedback({ state }: { state: FormState }) {
  if (!state.message || state.field) return null;
  return (
    <p
      role="status"
      className={`animate-fade-up flex items-start gap-2 rounded-xl p-3 text-sm ${
        state.ok ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-700"
      }`}
    >
      <Icon name={state.ok ? "check" : "close"} className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </p>
  );
}

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-navy-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-900 disabled:opacity-60"
    >
      {pending ? busy : idle}
    </button>
  );
}

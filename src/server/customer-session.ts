import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Session de l'espace client.
 *
 * Elle reprend le mécanisme du back-office (jeton signé HMAC-SHA256, aucune
 * table de sessions) mais reste strictement séparée : cookie différent, secret
 * différent, durée différente. Un jeton d'administration ne peut donc pas ouvrir
 * un espace client, ni l'inverse, même si l'un des deux secrets fuitait.
 *
 * Le cookie n'est pas chiffré : il porte l'identité, jamais de secret. Toute
 * donnée sensible est relue en base à partir de `sub`.
 */

export const CUSTOMER_COOKIE = "gosejour_client";
/** 30 jours : le suivi d'un voyage s'étale sur plusieurs semaines. */
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30;

export type CustomerSession = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

function secret(): string {
  // Le secret du back-office sert de repli en développement, mais il est dérivé
  // pour ne jamais produire la même signature qu'une session d'administration.
  const base = process.env.CUSTOMER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!base) {
    throw new Error("CUSTOMER_SESSION_SECRET est absente : sessions client impossibles.");
  }
  return `client:${base}`;
}

const b64 = (input: string) => Buffer.from(input, "utf8").toString("base64url");
const unb64 = (input: string) => Buffer.from(input, "base64url").toString("utf8");

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCustomerToken(session: Omit<CustomerSession, "exp">): string {
  const payload = b64(
    JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + CUSTOMER_MAX_AGE }),
  );
  return `${payload}.${sign(payload)}`;
}

export function readCustomerToken(token: string | undefined): CustomerSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const session = JSON.parse(unb64(payload)) as CustomerSession;
    if (typeof session.exp !== "number" || session.exp * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  return readCustomerToken(jar.get(CUSTOMER_COOKIE)?.value);
}

/** À utiliser dans toute page ou action de l'espace client. */
export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect("/compte");
  return session;
}

export async function openCustomerSession(customer: {
  id: string;
  email: string;
  name: string;
}): Promise<void> {
  const jar = await cookies();
  jar.set(
    CUSTOMER_COOKIE,
    createCustomerToken({ sub: customer.id, email: customer.email, name: customer.name }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CUSTOMER_MAX_AGE,
    },
  );
}

export async function closeCustomerSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  readSessionToken,
  type AdminSession,
} from "./auth";

export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** À utiliser dans toute page ou action du back-office. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/connexion");
  return session;
}

export async function openSession(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function closeSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

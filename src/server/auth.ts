import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Authentification du back-office, sans dépendance externe :
 * - mots de passe dérivés avec scrypt (fourni par Node) ;
 * - session portée par un cookie signé HMAC-SHA256, sans table de sessions.
 *
 * Le cookie n'est pas chiffré : il contient l'identité, jamais de secret. La
 * signature garantit qu'il n'a pas été fabriqué côté client.
 */

const SCRYPT_KEYLEN = 64;
export const SESSION_COOKIE = "gosejour_admin";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 h

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;

  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expectedBuffer = Buffer.from(expected, "hex");
  // Comparaison à durée constante : une comparaison naïve laisserait fuir la
  // position du premier octet divergent.
  if (derived.length !== expectedBuffer.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
};

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error("ADMIN_SESSION_SECRET est absente : sessions impossibles.");
  }
  return value;
}

const b64 = (input: string) => Buffer.from(input, "utf8").toString("base64url");
const unb64 = (input: string) => Buffer.from(input, "base64url").toString("utf8");

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(
  session: Omit<AdminSession, "exp">,
  maxAge = SESSION_MAX_AGE,
): string {
  const full: AdminSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const payload = b64(JSON.stringify(full));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(unb64(payload)) as AdminSession;
    if (typeof session.exp !== "number" || session.exp * 1000 < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Vérifie la chaîne d'authentification du back-office contre la vraie base :
// empreinte du mot de passe, puis aller-retour du jeton de session.
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createSessionToken, readSessionToken, verifyPassword } from "../src/server/auth";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }),
});

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

const user = await prisma.adminUser.findUnique({ where: { email } });
console.log("compte trouvé          :", Boolean(user));
console.log("bon mot de passe       :", user ? verifyPassword(password, user.passwordHash) : false);
console.log("mauvais mot de passe   :", user ? verifyPassword("mauvais", user.passwordHash) : "n/a");

const token = createSessionToken({
  sub: user!.id,
  email: user!.email,
  name: user!.name,
  role: user!.role,
});
const session = readSessionToken(token);
console.log("session relue          :", session?.email === email);

const tampered = `${token.slice(0, -3)}aaa`;
console.log("jeton falsifié rejeté  :", readSessionToken(tampered) === null);

const expired = createSessionToken(
  { sub: "x", email, name: "", role: "owner" },
  -10,
);
console.log("jeton expiré rejeté    :", readSessionToken(expired) === null);

await prisma.$disconnect();

import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Même ordre de priorité que Next.js : .env.local (secrets, non versionné)
// l'emporte sur .env, pour que la CLI Prisma et l'application visent toujours
// la même base. `quiet` évite que la bannière dotenv se mélange au SQL produit
// par `prisma migrate diff`.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

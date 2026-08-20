import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL absente.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});

const slides = await prisma.heroSlide.findMany({
  orderBy: { position: "asc" },
  select: { title: true },
});

console.log(slides.map((slide) => slide.title));
await prisma.$disconnect();

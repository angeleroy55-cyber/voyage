# Cloudinary Media Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire de Cloudinary et PostgreSQL la source unique des visuels métier du site, avec édition complète depuis le back-office.

**Architecture:** On enrichit les modèles existants pour destinations et articles, on ajoute un modèle `HeroSlide`, puis on remplace les visuels codés en dur et les fallbacks `picsum` par des lectures base. Une migration idempotente envoie les visuels déjà utilisés vers Cloudinary avant de nettoyer le front et le seed.

**Tech Stack:** Next.js 16 App Router, Prisma 7, PostgreSQL, Cloudinary, TypeScript, Server Actions

**Spec:** `docs/superpowers/specs/2026-08-20-cloudinary-media-migration-design.md`

## Global Constraints

- Les visuels des destinations, des galeries d'offres, des articles et du hero d'accueil sont stockés sur Cloudinary.
- La base stocke pour chaque visuel au minimum l'URL publique et le `public_id` Cloudinary.
- Le site public lit les visuels depuis la base, sans fallback `picsum` pour les contenus gérés.
- Le back-office permet d'éditer ces contenus sans intervention dans le code.
- La migration est idempotente et peut être relancée sans dupliquer inutilement les uploads.
- Les logos système, favicon, Open Graph générale, logos de paiement et icônes sociales restent hors base.

---

### Task 1: Étendre le schéma média et la lecture catalogue

**Files:**
- Create: `scripts/probe-hero-slides.mts`
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/server/catalogue.ts`
- Modify: `src/generated/prisma/*` via `npm run db:generate`

**Interfaces:**
- Consumes: `prisma`, `BRAND`, `photo()`
- Produces: `getHeroSlides(): Promise<HeroSlide[]>`
- Produces: `type HeroSlide = { id: string; kicker: string; title: string; text: string; href: string; cta: string; image: string; imageAlt: string; position: number }`

- [ ] **Step 1: Write the failing probe**

```ts
// scripts/probe-hero-slides.mts
import { getHeroSlides } from "../src/server/catalogue";

const slides = await getHeroSlides();
console.log(slides.map((slide) => slide.title));
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `npx tsx scripts/probe-hero-slides.mts`
Expected: FAIL because `getHeroSlides` and `HeroSlide` n'existent pas encore.

- [ ] **Step 3: Implement the minimal schema and catalogue changes**

```prisma
model Destination {
  imageAlt String @default("")
}

model Post {
  imageAlt String @default("")
}

model HeroSlide {
  id       String  @id @default(cuid())
  kicker   String  @default("")
  title    String
  text     String  @default("")
  href     String  @default("/")
  cta      String  @default("")
  imageUrl String  @default("")
  imageId  String  @default("")
  imageAlt String  @default("")
  position Int     @default(0)
  active   Boolean @default(true)

  @@index([active, position])
}
```

```ts
// src/server/catalogue.ts
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const rows = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    kicker: row.kicker,
    title: row.title,
    text: row.text,
    href: row.href,
    cta: row.cta,
    image: row.imageUrl,
    imageAlt: row.imageAlt,
    position: row.position,
  }));
}
```

- [ ] **Step 4: Run generation and probe**

Run: `npm run db:generate && npx tsx scripts/probe-hero-slides.mts`
Expected: PASS, script exits 0 and prints an array, possibly empty.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/types.ts src/server/catalogue.ts scripts/probe-hero-slides.mts src/generated/prisma
git commit -m "Add database-backed hero media model"
```

### Task 2: Ajouter la migration Cloudinary et les helpers média distants

**Files:**
- Create: `scripts/migrate-media-to-cloudinary.mts`
- Create: `scripts/probe-media-migration.mts`
- Modify: `src/server/media.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `cloudinaryConfigured()`, `uploadImage(file)`
- Produces: `uploadRemoteImage(input: { sourceUrl: string; folder: string; publicId: string }): Promise<StoredImage>`
- Produces: script CLI `scripts/migrate-media-to-cloudinary.mts`

- [ ] **Step 1: Write the failing probe**

```ts
// scripts/probe-media-migration.mts
import { uploadRemoteImage } from "../src/server/media";

await uploadRemoteImage({
  sourceUrl: "https://picsum.photos/seed/demo/800/600",
  folder: "gosejour/probe",
  publicId: "probe-image",
});

console.log("ok");
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `npx tsx scripts/probe-media-migration.mts`
Expected: FAIL because `uploadRemoteImage` n'existe pas encore.

- [ ] **Step 3: Implement remote upload and migration script**

```ts
// src/server/media.ts
export async function uploadRemoteImage(input: {
  sourceUrl: string;
  folder: string;
  publicId: string;
}): Promise<StoredImage> {
  if (!cloudinaryConfigured()) {
    throw new Error("Cloudinary n'est pas configuré.");
  }

  configure();
  const uploaded = await cloudinary.uploader.upload(input.sourceUrl, {
    folder: input.folder,
    public_id: input.publicId,
    overwrite: true,
    resource_type: "image",
  });

  return { url: uploaded.secure_url, publicId: uploaded.public_id };
}
```

```ts
// scripts/migrate-media-to-cloudinary.mts
for (const destination of await prisma.destination.findMany()) {
  if (destination.imageUrl.includes("res.cloudinary.com")) continue;
  if (!destination.imageUrl) continue;
  const stored = await uploadRemoteImage({
    sourceUrl: destination.imageUrl,
    folder: "gosejour/destinations",
    publicId: destination.slug,
  });
  await prisma.destination.update({
    where: { id: destination.id },
    data: { imageUrl: stored.url, imageId: stored.publicId },
  });
}
```

- [ ] **Step 4: Run probe and dry migration**

Run: `npx tsx scripts/probe-media-migration.mts`
Expected: PASS if Cloudinary is configured, otherwise explicit configuration error.

Run: `npx tsx scripts/migrate-media-to-cloudinary.mts`
Expected: logs migrated / skipped / failed counts without crashing the full run.

- [ ] **Step 5: Commit**

```bash
git add src/server/media.ts prisma/seed.ts scripts/migrate-media-to-cloudinary.mts scripts/probe-media-migration.mts
git commit -m "Add Cloudinary migration tooling"
```

### Task 3: Rendre destinations et articles entièrement éditables côté média

**Files:**
- Modify: `src/server/actions/admin.ts`
- Modify: `src/app/admin/(protected)/destinations/page.tsx`
- Modify: `src/app/admin/(protected)/articles/page.tsx`
- Create: `scripts/probe-admin-media-fields.mts`

**Interfaces:**
- Consumes: `saveDestination(id, formData)`, `savePost(id, formData)`
- Produces: persistance de `imageAlt` sur `Destination` et `Post`

- [ ] **Step 1: Write the failing probe**

```ts
// scripts/probe-admin-media-fields.mts
import { prisma } from "../src/server/prisma";

const destination = await prisma.destination.findFirstOrThrow();
console.log(destination.imageAlt);
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `npx tsx scripts/probe-admin-media-fields.mts`
Expected: FAIL because `imageAlt` n'existe pas encore côté client Prisma sans Task 1 complète.

- [ ] **Step 3: Implement admin form and action changes**

```ts
// src/server/actions/admin.ts
const data = {
  name,
  country: String(formData.get("country") ?? "").trim(),
  region: String(formData.get("region") ?? "").trim(),
  imageAlt: String(formData.get("imageAlt") ?? "").trim(),
  // ...
};
```

```tsx
// admin destinations/articles
<label className="block">
  <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
    Texte alternatif
  </span>
  <input name="imageAlt" defaultValue={destination.imageAlt} className={INPUT} />
</label>
```

- [ ] **Step 4: Run probe and lint on touched pages**

Run: `npx tsx scripts/probe-admin-media-fields.mts`
Expected: PASS, script prints a string, possibly empty.

Run: `npx eslint 'src/app/admin/(protected)/destinations/page.tsx' 'src/app/admin/(protected)/articles/page.tsx' src/server/actions/admin.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/admin.ts 'src/app/admin/(protected)/destinations/page.tsx' 'src/app/admin/(protected)/articles/page.tsx' scripts/probe-admin-media-fields.mts
git commit -m "Add editable media alt text in admin"
```

### Task 4: Brancher le hero sur la base et l'exposer dans l'admin

**Files:**
- Create: `src/server/actions/hero.ts`
- Create: `src/app/admin/(protected)/hero/page.tsx`
- Modify: `src/components/home/HeroCarousel.tsx`
- Modify: `src/app/(site)/page.tsx`
- Create: `scripts/probe-hero-admin.mts`

**Interfaces:**
- Consumes: `getHeroSlides()`
- Produces: `saveHeroSlide(id, formData)`, `deleteHeroSlide(id)`
- Produces: `HeroCarousel({ slides }: { slides: HeroSlide[] })`

- [ ] **Step 1: Write the failing probe**

```ts
// scripts/probe-hero-admin.mts
import { prisma } from "../src/server/prisma";

const slide = await prisma.heroSlide.findFirst();
console.log(slide?.title ?? "empty");
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `npx tsx scripts/probe-hero-admin.mts`
Expected: FAIL before `HeroSlide` is available in the generated client.

- [ ] **Step 3: Implement homepage and admin hero**

```tsx
// src/app/(site)/page.tsx
const [deals, all, destinations, reviews, posts, settings, categories, heroSlides] =
  await Promise.all([
    getBestDeals(8),
    getOffers(),
    getDestinations(),
    getReviews(6),
    getPosts(4),
    getSettings(),
    getSearchCategories(),
    getHeroSlides(),
  ]);

<HeroCarousel slides={heroSlides} />
```

```tsx
// src/components/home/HeroCarousel.tsx
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  // utiliser slides au lieu du tableau statique
}
```

- [ ] **Step 4: Run probe and page lint**

Run: `npx tsx scripts/probe-hero-admin.mts`
Expected: PASS, script prints either `empty` or a slide title.

Run: `npx eslint src/components/home/HeroCarousel.tsx 'src/app/(site)/page.tsx' 'src/app/admin/(protected)/hero/page.tsx' src/server/actions/hero.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/hero.ts 'src/app/admin/(protected)/hero/page.tsx' src/components/home/HeroCarousel.tsx 'src/app/(site)/page.tsx' scripts/probe-hero-admin.mts
git commit -m "Drive homepage hero from the database"
```

### Task 5: Nettoyer les fallbacks picsum et valider le rendu global

**Files:**
- Modify: `src/components/home/DestinationGrid.tsx`
- Modify: `src/components/home/BlogSection.tsx`
- Modify: `src/components/ui/OfferCard.tsx`
- Modify: `src/components/offer/QuickView.tsx`
- Modify: `src/app/(site)/offre/[slug]/page.tsx`
- Modify: `src/app/(site)/blog/page.tsx`
- Modify: `src/app/(site)/blog/[slug]/page.tsx`
- Modify: `src/app/(site)/destinations/page.tsx`
- Modify: `src/app/(site)/reservation/[slug]/page.tsx`
- Modify: `src/server/account.ts`
- Modify: any remaining public component importing `photo()` only as a media fallback

**Interfaces:**
- Consumes: `Offer.image`, `Offer.images`, `Destination.image`, `Post.image`, `HeroSlide.image`
- Produces: rendu sans dépendance `picsum` pour les contenus gérés

- [ ] **Step 1: Write the failing check**

```bash
rg -n "photo\\(" src/components src/app src/server
```

- [ ] **Step 2: Run check to verify the old fallback is still present**

Run: `rg -n "photo\\(" src/components src/app src/server`
Expected: FINDS the components that still depend on `picsum`.

- [ ] **Step 3: Replace managed-content fallbacks with DB-first rendering**

```tsx
// exemple de carte offre
const cover = offer.image ?? "/images/placeholders/offer-missing.jpg";

<Image src={cover} alt={offer.title} fill className="object-cover" />
```

```tsx
// exemple blog
{post.image ? (
  <Image src={post.image} alt={post.title} fill className="object-cover" />
) : (
  <div className="bg-navy-100" aria-hidden="true" />
)}
```

- [ ] **Step 4: Run final verification**

Run: `rg -n "photo\\(" src/components src/app src/server`
Expected: only non-managed or explicitly accepted usages remain.

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components src/app src/server
git commit -m "Remove external media fallbacks from managed content"
```

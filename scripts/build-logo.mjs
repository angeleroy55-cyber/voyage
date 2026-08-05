/**
 * Découpe les déclinaisons du logo GoSéjour à partir du fichier source.
 *
 *   node scripts/build-logo.mjs [chemin/source.jpeg]
 *
 * Les zones (emblème, mot-symbole) sont détectées en analysant les pixels
 * plutôt qu'en codant en dur des coordonnées, pour que le script reste valable
 * si le fichier source est remplacé par une nouvelle version du logo.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC =
  process.argv[2] ?? "assets/logo-source.jpeg";
const OUT = "public/brand";
await mkdir(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log(`source : ${path.basename(SRC)} — ${meta.width}x${meta.height}`);

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const at = (x, y) => {
  const i = (y * W + x) * C;
  return [data[i], data[i + 1], data[i + 2]];
};

// Le fond est un aplati : le pixel du coin en donne la couleur de référence.
const bg = at(2, 2);
const isInk = (x, y) => {
  const [r, g, b] = at(x, y);
  return Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) > 60;
};

// Profil vertical : sépare l'emblème du mot-symbole par le blanc qui les sépare.
const bands = [];
let start = null;
for (let y = 0; y < H; y++) {
  let ink = 0;
  for (let x = 0; x < W && ink <= 2; x++) if (isInk(x, y)) ink++;
  const on = ink > 2;
  if (on && start === null) start = y;
  if (!on && start !== null) {
    if (y - start > 8) bands.push([start, y - 1]);
    start = null;
  }
}
if (start !== null) bands.push([start, H - 1]);

// Les étoiles et le « G » sont séparés de quelques pixels seulement : on fusionne
// les bandes proches pour ne garder que les vrais blocs (emblème / mot-symbole).
const GAP = Math.round(H * 0.08);
const blocks = [];
for (const [a, b] of bands) {
  const last = blocks[blocks.length - 1];
  if (last && a - last[1] < GAP) last[1] = b;
  else blocks.push([a, b]);
}
console.log(
  "bandes :", bands.map(([a, b]) => `${a}-${b}`).join(", "),
  "→ blocs :", blocks.map(([a, b]) => `${a}-${b}`).join(", "),
);

const colRange = (y0, y1) => {
  let x0 = W;
  let x1 = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < W; x++) {
      if (isInk(x, y)) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
  }
  return [x0, x1];
};

async function cut(name, x0, y0, x1, y1, pad, size) {
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const width = Math.min(W - left, x1 - x0 + 1 + pad * 2);
  const height = Math.min(H - top, y1 - y0 + 1 + pad * 2);
  let pipe = sharp(SRC).extract({ left, top, width, height });
  if (size) {
    pipe = pipe.resize(size, size, {
      fit: "contain",
      background: { r: bg[0], g: bg[1], b: bg[2] },
    });
  }
  await pipe.png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
  console.log(`  ${name}.png — ${size ?? width}x${size ?? height}`);
}

const [my0, my1] = blocks[0];
const [mx0, mx1] = colRange(my0, my1);
const half = Math.round(Math.max(mx1 - mx0, my1 - my0) / 2);
const cx = Math.round((mx0 + mx1) / 2);
const cy = Math.round((my0 + my1) / 2);

// Emblème carré : badge de l'en-tête et favicon.
await cut("logo-mark", cx - half, cy - half, cx + half, cy + half, 26, 512);

// Verrouillage complet emblème + mot-symbole : page de connexion, pied de page.
const lastY = blocks[blocks.length - 1][1];
const [fx0, fx1] = colRange(my0, lastY);
await cut("logo-full", fx0, my0, fx1, lastY, 30, null);

// Mot-symbole seul.
if (blocks.length > 1) {
  const [wy0] = blocks[1];
  const [wx0, wx1] = colRange(wy0, lastY);
  await cut("logo-wordmark", wx0, wy0, wx1, lastY, 20, null);
}

console.log(
  `fond : #${bg.map((v) => v.toString(16).padStart(2, "0")).join("")}`,
);

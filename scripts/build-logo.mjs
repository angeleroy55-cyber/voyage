/**
 * Découpe les déclinaisons du logo GoSéjour à partir des fichiers source.
 *
 *   npm run logo
 *   node scripts/build-logo.mjs [source-verticale] [source-horizontale]
 *
 * Les zones (emblème, mot-symbole) sont détectées en analysant les pixels
 * plutôt qu'en codant en dur des coordonnées, pour que le script reste valable
 * si les fichiers source sont remplacés par une nouvelle version du logo.
 *
 * Sorties : public/brand/ pour le site, plus le favicon et l'image de partage,
 * qui sont des routes de fichier Next et vivent donc dans src/app/.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2] ?? "assets/logo-vertical.png";
const SRC_WIDE = process.argv[3] ?? "assets/logo-horizontal.png";
const OUT = "public/brand";
const APP = "src/app";

/** Teinte exacte de `--color-navy-900` (globals.css). */
const BRAND_BG = [0x0a, 0x19, 0x30];

await mkdir(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log(`source : ${path.basename(SRC)}, ${meta.width}x${meta.height}`);

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

/**
 * Aplatit le fond à la teinte de la marque. Les visuels générés portent un
 * léger vignettage : invisible sur l'image seule, il ferait diverger la
 * pastille du logo du `navy-900` du site, alors que globals.css garantit
 * l'inverse. Seuls les pixels franchement de fond sont réécrits, l'anticrénelage
 * des bords reste intact.
 */
function flatten(buffer) {
  const out = Buffer.from(buffer);
  for (let i = 0; i < out.length; i += C) {
    const [r, g, b] = [out[i], out[i + 1], out[i + 2]];
    if (Math.max(r, g, b) < 90 && b >= r) {
      out[i] = BRAND_BG[0];
      out[i + 1] = BRAND_BG[1];
      out[i + 2] = BRAND_BG[2];
    }
  }
  return out;
}

/**
 * Détoure l'encre du fond : le navy devient transparent.
 *
 * Les bords ne sont pas binarisés mais reconstruits. Un pixel anticrénelé vaut
 * `p = a·encre + (1 - a)·fond` ; comme l'or et le blanc ont tous deux 255 dans
 * le rouge, ce canal livre directement l'opacité `a`, et l'encre pure se
 * retrouve en retranchant la part de fond. Un simple seuil laisserait à la
 * place un liseré bleu, très visible dès que le logo est posé sur du clair.
 */
function cutout(rgb, channels) {
  const out = Buffer.alloc((rgb.length / channels) * 4);
  for (let i = 0, o = 0; o < out.length; i += channels, o += 4) {
    const alpha = Math.min(1, Math.max(0, (rgb[i] - BRAND_BG[0]) / (255 - BRAND_BG[0])));
    if (alpha < 0.004) continue;
    for (let k = 0; k < 3; k++) {
      const ink = (rgb[i + k] - (1 - alpha) * BRAND_BG[k]) / alpha;
      out[o + k] = Math.min(255, Math.max(0, Math.round(ink)));
    }
    out[o + 3] = Math.round(alpha * 255);
  }
  return out;
}

/**
 * Repeint l'encre blanche du mot-symbole en navy.
 *
 * Le verrouillage est dessiné pour un fond sombre : « Sejour.fr » y est blanc.
 * Détouré tel quel, il disparaîtrait sur l'en-tête et le pied de page, qui sont
 * clairs. L'or, lui, n'est jamais touché : il est saturé, là où le blanc et ses
 * bords anticrénelés restent des gris neutres.
 */
function inkToNavy(rgba) {
  for (let o = 0; o < rgba.length; o += 4) {
    if (rgba[o + 3] === 0) continue;
    const [r, g, b] = [rgba[o], rgba[o + 1], rgba[o + 2]];
    if (Math.max(r, g, b) - Math.min(r, g, b) < 40) {
      rgba[o] = BRAND_BG[0];
      rgba[o + 1] = BRAND_BG[1];
      rgba[o + 2] = BRAND_BG[2];
    }
  }
  return rgba;
}

const flat = flatten(data);
const base = () => sharp(flat, { raw: { width: W, height: H, channels: C } });

const at = (x, y) => {
  const i = (y * W + x) * C;
  return [flat[i], flat[i + 1], flat[i + 2]];
};

const isInk = (x, y) => {
  const [r, g, b] = at(x, y);
  return (
    Math.abs(r - BRAND_BG[0]) + Math.abs(g - BRAND_BG[1]) + Math.abs(b - BRAND_BG[2]) > 60
  );
};

// Profil vertical : liste les bandes de pixels encrés.
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

/**
 * L'emblème et le mot-symbole sont séparés par le plus grand vide de l'image ;
 * tous les autres blancs (entre le G et ses rayons, sous la jambe d'un « j »)
 * lui sont très inférieurs. Chercher ce maximum plutôt qu'un seuil fixe évite
 * de réaccorder le script à chaque nouvelle version du logo : un seuil calé sur
 * une source se retrouve du mauvais côté de l'écart sur la suivante.
 * En deçà du plancher, l'image ne porte qu'un emblème et n'est pas découpée.
 */
const MIN_SPLIT = Math.round(H * 0.04);
let splitAt = -1;
let widest = MIN_SPLIT;
for (let i = 1; i < bands.length; i++) {
  const gap = bands[i][0] - bands[i - 1][1];
  if (gap > widest) {
    widest = gap;
    splitAt = i;
  }
}
const last = bands[bands.length - 1][1];
const blocks =
  splitAt === -1
    ? [[bands[0][0], last]]
    : [
        [bands[0][0], bands[splitAt - 1][1]],
        [bands[splitAt][0], last],
      ];

console.log(
  "bandes :", bands.map(([a, b]) => `${a}-${b}`).join(", "),
  "→ blocs :", blocks.map(([a, b]) => `${a}-${b}`).join(", "),
  splitAt === -1 ? "(emblème seul)" : `(vide de ${widest} px)`,
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

/** Fond de l'image de partage, seule sortie qui n'est pas détourée. */
const background = { r: BRAND_BG[0], g: BRAND_BG[1], b: BRAND_BG[2] };

const [my0, my1] = blocks[0];
const [mx0, mx1] = colRange(my0, my1);
const half = Math.round(Math.max(mx1 - mx0, my1 - my0) / 2);
const cx = Math.round((mx0 + mx1) / 2);
const cy = Math.round((my0 + my1) / 2);

/**
 * Emblème carré et détouré : favicon, et partout où le nom est déjà écrit à
 * côté. Toutes les déclinaisons du logo sont détourées ; seule l'image de
 * partage garde un fond, un réseau social ne sachant pas quoi faire d'un PNG
 * transparent.
 */
{
  const pad = 26;
  const left = Math.max(0, cx - half - pad);
  const top = Math.max(0, cy - half - pad);
  const box = {
    left,
    top,
    width: Math.min(W - left, (half + pad) * 2),
    height: Math.min(H - top, (half + pad) * 2),
  };
  const raw = await base().extract(box).raw().toBuffer({ resolveWithObject: true });
  await sharp(cutout(raw.data, raw.info.channels), {
    raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
  })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/logo-mark.png`);
  console.log(`  ${OUT}/logo-mark.png : 512x512 (détouré)`);
}

/**
 * Découpe détourée, en deux versions : `-inverse` garde le mot-symbole blanc du
 * dessin d'origine, pour les fonds sombres ; la version sans suffixe le repeint
 * en navy, pour l'en-tête et le pied de page, qui sont clairs.
 */
async function cutTransparent(name, x0, y0, x1, y1, pad) {
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const box = {
    left,
    top,
    width: Math.min(W - left, x1 - x0 + 1 + pad * 2),
    height: Math.min(H - top, y1 - y0 + 1 + pad * 2),
  };
  const raw = await base().extract(box).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = raw.info;
  const rgba = cutout(raw.data, raw.info.channels);

  await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}-inverse.png`);
  await sharp(inkToNavy(rgba), { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}.png`);
  console.log(`  ${OUT}/${name}{,-inverse}.png : ${width}x${height} (détourés)`);
}

// Verrouillage vertical complet.
const [fx0, fx1] = colRange(my0, last);
await cutTransparent("logo-full", fx0, my0, fx1, last, 30);

// Mot-symbole seul.
if (blocks.length > 1) {
  const [wy0] = blocks[1];
  const [wx0, wx1] = colRange(wy0, last);
  await cutTransparent("logo-wordmark", wx0, wy0, wx1, last, 20);
}

/**
 * Verrouillage horizontal, découpé dans sa propre source : le profil par
 * bandes ci-dessus ne sait pas le séparer, emblème et texte partageant les
 * mêmes lignes. Un simple détourage suffit, il n'y a rien à découper.
 */
async function wide() {
  const raw = await sharp(SRC_WIDE).raw().toBuffer({ resolveWithObject: true });
  const w = raw.info.width;
  const h = raw.info.height;
  const c = raw.info.channels;
  const pixels = Buffer.from(raw.data);
  for (let i = 0; i < pixels.length; i += c) {
    if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 90 && pixels[i + 2] >= pixels[i]) {
      pixels[i] = BRAND_BG[0];
      pixels[i + 1] = BRAND_BG[1];
      pixels[i + 2] = BRAND_BG[2];
    }
  }

  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * c;
      const d =
        Math.abs(pixels[i] - BRAND_BG[0]) +
        Math.abs(pixels[i + 1] - BRAND_BG[1]) +
        Math.abs(pixels[i + 2] - BRAND_BG[2]);
      if (d > 60) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  const pad = Math.round((y1 - y0) * 0.35);
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const box = {
    left,
    top,
    width: Math.min(w - left, x1 - x0 + 1 + pad * 2),
    height: Math.min(h - top, y1 - y0 + 1 + pad * 2),
  };

  const crop = await sharp(pixels, { raw: { width: w, height: h, channels: c } })
    .extract(box)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cw = crop.info.width;
  const ch = crop.info.height;
  const rgba = cutout(crop.data, crop.info.channels);

  // Version fonds sombres : le mot-symbole reste blanc, comme dessiné.
  await sharp(Buffer.from(rgba), { raw: { width: cw, height: ch, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/logo-lockup-inverse.png`);
  // Version fonds clairs : mot-symbole repeint en navy.
  await sharp(inkToNavy(rgba), { raw: { width: cw, height: ch, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/logo-lockup.png`);
  console.log(`  ${OUT}/logo-lockup{,-inverse}.png : ${cw}x${ch} (détourés)`);

  // L'image de partage a besoin d'un fond : elle repart du verrouillage clair.
  const cropped = await sharp(pixels, { raw: { width: w, height: h, channels: c } })
    .extract(box)
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Image de partage : Next sert `opengraph-image.png` pour toutes les pages.
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background },
  })
    .composite([{ input: await sharp(cropped).resize({ width: 940 }).toBuffer(), gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(`${APP}/opengraph-image.png`);
  console.log(`  ${APP}/opengraph-image.png : 1200x630`);
}

await wide();

// Favicon : route de fichier Next, dérivée de l'emblème déjà détouré.
await sharp(`${OUT}/logo-mark.png`).resize(256, 256).png({ compressionLevel: 9 }).toFile(`${APP}/icon.png`);
console.log(`  ${APP}/icon.png : 256x256`);

console.log(`fond aplati à #${BRAND_BG.map((v) => v.toString(16).padStart(2, "0")).join("")}`);

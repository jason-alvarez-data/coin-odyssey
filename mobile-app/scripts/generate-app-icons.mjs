// mobile-app/scripts/generate-app-icons.mjs
//
// Generates the Coin Odyssey mobile icon set from the brand logo.
// Run from the REPO ROOT (sharp is hoisted there):
//   node mobile-app/scripts/generate-app-icons.mjs
//
// Source: app-icon.png (1935² brand mark — the high-res original behind icon.ico).
//
// Outputs into mobile-app/assets/:
//   icon.png           1024² full-bleed, opaque (iOS requires no alpha)
//   adaptive-icon.png  1024² transparent foreground, scaled into the Android safe zone
//   splash-icon.png    1024² transparent mark (splash config paints the bg behind it)
//   favicon.png        256²  full-bleed, opaque (web)

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ASSETS = resolve(__dirname, '..', 'assets');
const SRC = resolve(ROOT, 'app-icon.png');

// Brand yellow sampled from the logo disc.
const YELLOW = { r: 255, g: 201, b: 60 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function iosIcon() {
  // Flatten the (transparent-cornered) disc onto brand yellow → seamless full-bleed
  // square. iOS masks the squircle itself and rejects alpha, so we drop it.
  await sharp(SRC)
    .resize(1024, 1024, { fit: 'contain', background: YELLOW })
    .flatten({ background: YELLOW })
    .removeAlpha()
    .png()
    .toFile(resolve(ASSETS, 'icon.png'));
  console.log('  ✓ icon.png (1024², opaque)');
}

async function androidAdaptive() {
  // Foreground = logo at 72% on a transparent canvas so the motif stays inside the
  // ~66% adaptive safe zone. app.json paints the same yellow behind it.
  const inner = await sharp(SRC).resize(Math.round(1024 * 0.72)).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: TRANSPARENT } })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(resolve(ASSETS, 'adaptive-icon.png'));
  console.log('  ✓ adaptive-icon.png (1024², transparent foreground)');
}

async function splash() {
  // Keep the yellow disc on transparent; the splash bg (editorial warm-dark) shows
  // around it, making the brand mark pop on launch.
  await sharp(SRC)
    .resize(1024, 1024, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toFile(resolve(ASSETS, 'splash-icon.png'));
  console.log('  ✓ splash-icon.png (1024², transparent)');
}

async function favicon() {
  await sharp(SRC)
    .resize(256, 256, { fit: 'contain', background: YELLOW })
    .flatten({ background: YELLOW })
    .removeAlpha()
    .png()
    .toFile(resolve(ASSETS, 'favicon.png'));
  console.log('  ✓ favicon.png (256², opaque)');
}

async function main() {
  console.log('Generating Coin Odyssey icons from', SRC);
  await iosIcon();
  await androidAdaptive();
  await splash();
  await favicon();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// SVG → PNG icon/splash generator for Nar.
// Run: node scripts/generate-icons.js
// Generates: assets/icon.png, splash-icon.png, adaptive-icon.png, favicon.png

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS = path.join(__dirname, "..", "assets");

async function main() {
  const iconSvg = fs.readFileSync(path.join(ASSETS, "icon.svg"));
  const splashSvg = fs.readFileSync(path.join(ASSETS, "splash-icon.svg"));

  // Main app icon — 1024×1024, cream bg (SVG already has bg)
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, "icon.png"));
  console.log("✓ icon.png (1024)");

  // Android adaptive icon — 1024×1024, JUST pomegranate on transparent/cream (let adaptive mask work)
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, "adaptive-icon.png"));
  console.log("✓ adaptive-icon.png (1024)");

  // Splash — 1284×1284 (Expo SDK 54 recommendation), transparent-ish to let bg color show
  await sharp(splashSvg)
    .resize(1284, 1284, { fit: "contain", background: { r: 255, g: 253, b: 251, alpha: 1 } })
    .png()
    .toFile(path.join(ASSETS, "splash-icon.png"));
  console.log("✓ splash-icon.png (1284)");

  // Web favicon
  await sharp(iconSvg)
    .resize(48, 48)
    .png()
    .toFile(path.join(ASSETS, "favicon.png"));
  console.log("✓ favicon.png (48)");

  console.log("\nAll icons regenerated. Restart Expo with `npx expo start --clear`.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

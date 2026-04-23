// Icon/splash generator for Nar Aura.
// Öncelik: assets/icon-source.png (gerçek fotoğraf) varsa onu kullan.
// Yoksa SVG fallback.
// Run: node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS = path.join(__dirname, "..", "assets");

async function main() {
  const sourcePng = path.join(ASSETS, "icon-source.png");
  const usePhoto = fs.existsSync(sourcePng);

  const iconInput = usePhoto ? sourcePng : fs.readFileSync(path.join(ASSETS, "icon.svg"));
  const splashInput = usePhoto ? sourcePng : fs.readFileSync(path.join(ASSETS, "splash-icon.svg"));

  if (usePhoto) {
    console.log("→ Kaynak: icon-source.png (gerçek fotoğraf)");
  } else {
    console.log("→ Kaynak: SVG fallback");
  }

  // Ana ikon — 1024×1024 kare crop (center)
  await sharp(iconInput)
    .resize(1024, 1024, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(ASSETS, "icon.png"));
  console.log("✓ icon.png (1024)");

  // Android adaptive icon
  await sharp(iconInput)
    .resize(1024, 1024, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(ASSETS, "adaptive-icon.png"));
  console.log("✓ adaptive-icon.png (1024)");

  // Splash — 1284×1284, fotoğraf kırpılmadan sığsın (contain + krem arka plan)
  await sharp(splashInput)
    .resize(1284, 1284, {
      fit: usePhoto ? "contain" : "contain",
      background: { r: 255, g: 253, b: 251, alpha: 1 },
    })
    .png()
    .toFile(path.join(ASSETS, "splash-icon.png"));
  console.log("✓ splash-icon.png (1284)");

  // Web favicon
  await sharp(iconInput)
    .resize(48, 48, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(ASSETS, "favicon.png"));
  console.log("✓ favicon.png (48)");

  console.log("\nAll icons regenerated. Restart Expo with `npx expo start --clear`.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

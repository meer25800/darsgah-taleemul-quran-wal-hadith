import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "public", "institute-logo-official.png");
const size = 1024;
const inset = 76;
const circle = Buffer.from(
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="#ffffff" stroke="#d6aa2f" stroke-width="12"/>
  </svg>`
);
const mask = Buffer.from(
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/>
  </svg>`
);
const sourceMetadata = await sharp(source).metadata();
const cropBottom = Math.min(4, Math.max(0, (sourceMetadata.height || 0) - 1));
const logo = await sharp(source)
  .extract({
    left: 0,
    top: 0,
    width: sourceMetadata.width,
    height: sourceMetadata.height - cropBottom
  })
  .resize(size - inset * 2, size - inset * 2, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  })
  .png()
  .toBuffer();
const badge = await sharp({
  create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([
    { input: circle },
    { input: logo, left: inset, top: inset },
    { input: mask, blend: "dest-in" }
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

const targets = [
  path.join(root, "public", "institute-logo-badge.png"),
  path.resolve(root, "..", "backend", "src", "assets", "institute-logo-badge.png"),
  path.resolve(root, "..", "mobile", "www", "institute-logo-badge.png")
];
await Promise.all(targets.map(async (target) => {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, badge);
}));
console.log(`Generated circular logo badge: ${targets.join(", ")}`);

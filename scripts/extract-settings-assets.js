const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const settingsPath = path.join(root, "data", "settings.json");
const outputDir = path.join(root, "public", "assets", "game");
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
fs.mkdirSync(outputDir, { recursive: true });

function extract(value) {
  const match = String(value || "").match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/i);
  if (!match) return value;
  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase() === "svg+xml" ? "svg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileName = `${hash}.${extension}`;
  fs.writeFileSync(path.join(outputDir, fileName), buffer);
  return `/assets/game/${fileName}`;
}

for (const collection of [settings.assets?.machineryItems, settings.assets?.elevatorItems]) {
  for (const item of collection || []) {
    item.icon = extract(item.icon);
    item.photos = (item.photos || []).map(extract);
  }
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
console.log(`Settings assets extracted to ${outputDir}`);

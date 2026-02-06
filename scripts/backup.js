// scripts/backup.js
import fs from "node:fs";
import path from "node:path";

// Location of your exported .json from the app:
const src = "C:/Users/monah/Downloads/My_Manuscript.writer.json"; // update if needed

// Build timestamped filename (date + time)
const now = new Date();
const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
const time = now.toTimeString().slice(0, 8).replace(/:/g, "-"); // HH-MM-SS

const backupDir = "./backups";
const filename = `backup-${date}-${time}.json`;
const dst = path.join(backupDir, filename);

// Ensure folder exists
fs.mkdirSync(backupDir, { recursive: true });

// Copy file if found
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log(`✅ Backup created: ${dst}`);
} else {
  console.log(`⚠️ No source file found at ${src}. Export first.`);
}

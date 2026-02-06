// scripts/export-md.js
// Usage:
//   node scripts/export-md.js                -> uses newest file in ./exports
//   node scripts/export-md.js ./exports/foo.json
//
// Output goes to ./markdown-exports/<ProjectName YYYY-MM-DD>/...

import fs from "node:fs";
import path from "node:path";

const EXPORTS_DIR = "./exports";
const OUT_BASE = "./markdown-exports";

// ---------- helpers ----------
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const pad = (n, w = 3) => String(n).padStart(w, "0");
const today = () => new Date().toISOString().slice(0, 10);
const safe = (s) =>
  (s || "untitled")
    .replace(/[\\/:*?"<>|]/g, " ") // illegal on Windows
    .replace(/\s+/g, " ")
    .trim();

const slug = (s) =>
  safe(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

// count words (same spirit as app)
const countWords = (txt = "") =>
  txt.trim().split(/\s+/).filter(Boolean).length;

// walk tree and collect chapters in document order
function collectChapters(root, folderPath = [], bucket = []) {
  if (!root) return bucket;
  if (root.type === "chapter") {
    bucket.push({ node: root, folderPath });
  } else if (root.type === "folder" && Array.isArray(root.children)) {
    for (const child of root.children) {
      collectChapters(child, root.title ? [...folderPath, root.title] : folderPath, bucket);
    }
  }
  return bucket;
}

// newest file selector from ./exports
function newestExportIn(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const jsons = files.filter((f) => f.toLowerCase().endsWith(".json"));
  if (!jsons.length) return null;
  const withTime = jsons.map((f) => {
    const p = path.join(dir, f);
    return { p, mtime: fs.statSync(p).mtimeMs };
    });
  withTime.sort((a, b) => b.mtime - a.mtime);
  return withTime[0].p;
}

// ---------- main ----------
async function main() {
  // resolve input file
  let input = process.argv[2];
  if (!input) {
    input = newestExportIn(EXPORTS_DIR);
    if (!input) {
      console.error(`❌ No JSON provided and no files found in ${EXPORTS_DIR}\\`);
      console.error("   Export your project to ./exports first, or pass a path:");
      console.error("   node scripts/export-md.js ./exports/your-file.json");
      process.exit(1);
    }
  }
  if (!fs.existsSync(input)) {
    console.error(`❌ File not found: ${input}`);
    process.exit(1);
  }

  const project = readJSON(input);
  const projectName = safe(project?.name || "Manuscript");
  const dateStamp = today();
  const outDir = path.join(OUT_BASE, `${projectName} ${dateStamp}`);

  // ensure directory
  fs.mkdirSync(outDir, { recursive: true });

  // collect chapters
  const chapters = collectChapters(project.root);

  // write one file per chapter
  let idx = 1;
  const links = [];
  for (const { node, folderPath } of chapters) {
    const title = safe(node.title || `Chapter ${idx}`);
    const folderSlug = folderPath.map(slug).filter(Boolean).join("/");
    const fileBase = `${pad(idx)}-${slug(title) || "chapter"}.md`;
    const filePath = folderSlug
      ? path.join(outDir, folderSlug, fileBase)
      : path.join(outDir, fileBase);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const meta = {
      title,
      status: node.status || "Draft",
      pov: node.pov || "",
      tags: node.tags || [],
      synopsis: node.synopsis || "",
      createdAt: node.createdAt || "",
      updatedAt: node.updatedAt || "",
      words: countWords(node.content || ""),
      sectionPath: folderPath,
    };

    const fm =
      "---\n" +
      Object.entries(meta)
        .map(([k, v]) => {
          if (Array.isArray(v)) return `${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}]`;
          if (typeof v === "string") return `${k}: ${JSON.stringify(v)}`;
          return `${k}: ${v}`;
        })
        .join("\n") +
      "\n---\n\n";

    const md = `# ${title}\n\n${node.content || ""}\n`;

    fs.writeFileSync(filePath, fm + md, "utf8");

    const rel = path.relative(outDir, filePath).replace(/\\/g, "/");
    links.push({ idx, title, rel });
    idx++;
  }

  // write compiled manuscript too (optional convenience)
  const compiled = chapters
    .map(({ node }) => `# ${safe(node.title || "")}\n\n${node.content || ""}`)
    .join("\n\n\n");
  fs.writeFileSync(path.join(outDir, "manuscript.md"), compiled, "utf8");

  // write an index with links
  const toc =
    `# ${projectName} — ${dateStamp}\n\n` +
    links.map((l) => `- ${pad(l.idx)}. [${l.title}](${l.rel})`).join("\n") +
    `\n\n_Exported from Writer Workbench_\n`;
  fs.writeFileSync(path.join(outDir, "index.md"), toc, "utf8");

  console.log(`✅ Exported ${links.length} chapter${links.length === 1 ? "" : "s"} to:`);
  console.log(`   ${path.resolve(outDir)}`);
  console.log(`   • index.md (table of contents)`);
  console.log(`   • manuscript.md (compiled)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

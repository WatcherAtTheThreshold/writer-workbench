// Utility helpers for Writer Workbench

export const uid = () => Math.random().toString(36).slice(2, 9);
export const nowISO = () => new Date().toISOString();

export const STORAGE_KEY = "writer-workbench-v1";

export const DEFAULT_PROJECT = () => ({
  id: uid(),
  name: "Writer Workbench",
  createdAt: nowISO(),
  updatedAt: nowISO(),
  settings: { dailyGoal: 500, dailyStartWords: 0 },
  root: {
    id: uid(),
    type: "folder",
    title: "My Books",
    children: [
      {
        id: uid(),
        type: "folder",
        title: "Book 1",
        children: [
          { id: uid(), type: "chapter", title: "Chapter 1", content: "# Chapter 1\n\nWrite here…", synopsis: "Opening scene.", tags: ["intro"], status: "Draft", pov: "Omniscient", createdAt: nowISO(), updatedAt: nowISO() },
          { id: uid(), type: "chapter", title: "Chapter 2", content: "# Chapter 2\n\n…", synopsis: "Conflict rises.", tags: [], status: "Draft", pov: "1st", createdAt: nowISO(), updatedAt: nowISO() },
        ],
      },
    ],
  },
});

export function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECT();
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROJECT();
  }
}

export function saveProject(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// Walk tree utilities
export function walk(node, fn, parent = null, indexPath = []) {
  fn(node, parent, indexPath);
  if (node.type === "folder" && Array.isArray(node.children)) {
    node.children.forEach((child, i) => walk(child, fn, node, [...indexPath, i]));
  }
}

export function findById(root, id) {
  let found = null;
  walk(root, (n) => { if (n.id === id) found = n; });
  return found;
}

export function mutateAtPath(root, indexPath, mutate) {
  const clone = structuredClone(root);
  let cur = clone;
  for (let i = 0; i < indexPath.length - 1; i++) cur = cur.children[indexPath[i]];
  const idx = indexPath[indexPath.length - 1];
  cur.children[idx] = mutate(cur.children[idx]);
  return clone;
}

export function findPath(root, id) {
  let out = null;
  walk(root, (n, p, ip) => { if (n.id === id) out = ip; });
  return out;
}

export function collectChaptersInOrder(node, filterFn = () => true, bucket = []) {
  if (node.type === "chapter" && filterFn(node)) bucket.push(node);
  if (node.type === "folder") node.children.forEach(c => collectChaptersInOrder(c, filterFn, bucket));
  return bucket;
}

export function findParentBook(root, targetId) {
  let parentBook = null;
  const search = (node, currentBook) => {
    const bookToPass = (node.type === 'folder' && node !== root) ? node : currentBook;
    if (node.id === targetId) {
      parentBook = bookToPass;
      return true;
    }
    if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        if (search(child, bookToPass)) return true;
      }
    }
    return false;
  };
  search(root, null);
  return parentBook;
}

// Word count utilities
export const countWords = (txt) => (txt || "").trim().split(/\s+/).filter(Boolean).length;

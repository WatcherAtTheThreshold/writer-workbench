import React, { useState } from 'react';
import { uid, nowISO, findById, findPath, collectChaptersInOrder } from '../utils/helpers';
import { exportAsMarkdown, exportAsJSON, exportAsDocx, exportAsPdf } from '../utils/exporters';
import { PromptModal, AlertModal } from './Modal';

// Reusable 3D button styles
const btn3D = `relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
  border border-neutral-200 dark:border-neutral-600
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-neutral-100 active:to-neutral-200 dark:active:from-neutral-800 dark:active:to-neutral-900`;

const btn3DBlue = `relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950
  border border-blue-200 dark:border-blue-700
  text-blue-700 dark:text-blue-200
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-blue-100 active:to-blue-200 dark:active:from-blue-950 dark:active:to-blue-900`;

const btn3DGreen = `relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-950
  border border-green-200 dark:border-green-700
  text-green-700 dark:text-green-200
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-green-100 active:to-green-200 dark:active:from-green-950 dark:active:to-green-900`;

const btn3DActive = `relative px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-neutral-800 to-neutral-900 dark:from-white dark:to-neutral-100
  border border-neutral-700 dark:border-neutral-300
  text-white dark:text-black
  shadow-md`;

const TopHighlight = () => (
  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-lg pointer-events-none" />
);

export default function Toolbar({
  project, setProject, selectedId, setSelectedId,
  view, setView, query, setQuery,
  dark, setDark, searchRef, onShowShortcuts
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const selectedNode = selectedId ? findById(project.root, selectedId) : null;

  // Modal states
  const [bookModal, setBookModal] = useState(false);
  const [chapterModal, setChapterModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });

  const importJSON = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const next = JSON.parse(fr.result);
          setProject(next);
        } catch {
          setAlertModal({ open: true, title: 'Import Error', message: 'Invalid JSON file.' });
        }
      };
      fr.readAsText(file);
    };
    input.click();
  };

  const addBook = () => {
    setBookModal(true);
  };

  const confirmAddBook = (title) => {
    setBookModal(false);
    if (!title) return;
    const next = structuredClone(project);
    next.root.children.push({ id: uid(), type: "folder", title, children: [] });
    next.updatedAt = nowISO();
    setProject(next);
  };

  const addChapter = () => {
    const parent = selectedId ? findById(project.root, selectedId) : null;

    let targetFolder = null;
    if (parent?.type === "folder" && parent.id !== project.root.id) {
      targetFolder = parent;
    } else if (parent?.type === "chapter") {
      const path = findPath(project.root, selectedId);
      if (path && path.length > 0) {
        let folder = project.root;
        for (let i = 0; i < path.length - 1; i++) folder = folder.children[path[i]];
        targetFolder = folder;
      }
    }

    if (!targetFolder || targetFolder.id === project.root.id) {
      setAlertModal({ open: true, title: 'No Book Selected', message: 'Please select a book first, then add chapters to it.' });
      return;
    }

    setChapterModal(true);
  };

  const confirmAddChapter = (title) => {
    setChapterModal(false);
    if (!title) return;

    const next = structuredClone(project);
    const parent = selectedId ? findById(next.root, selectedId) : null;

    let targetFolder = null;
    if (parent?.type === "folder" && parent.id !== next.root.id) {
      targetFolder = parent;
    } else if (parent?.type === "chapter") {
      const path = findPath(next.root, selectedId);
      if (path && path.length > 0) {
        let folder = next.root;
        for (let i = 0; i < path.length - 1; i++) folder = folder.children[path[i]];
        targetFolder = folder;
      }
    }

    if (!targetFolder) return;

    targetFolder.children.push({
      id: uid(), type: "chapter", title, content: "",
      synopsis: "", tags: [], status: "Draft", pov: "",
      createdAt: nowISO(), updatedAt: nowISO()
    });
    next.updatedAt = nowISO();
    setProject(next);
  };

  const getExportLabel = () => {
    if (!selectedNode) return "Export";
    if (selectedNode.type === "chapter") return `Export "${selectedNode.title}"`;
    if (selectedNode.type === "folder" && selectedNode.id !== project.root.id) return `Export "${selectedNode.title}"`;
    return "Export";
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    if (!selectedNode || selectedNode.id === project.root.id) {
      setAlertModal({ open: true, title: 'Nothing Selected', message: 'Please select a book or chapter to export.' });
      return;
    }

    const filename = selectedNode.title.replace(/\s+/g, "_");

    switch (format) {
      case 'md':
        exportAsMarkdown(selectedNode, `${filename}.md`);
        break;
      case 'docx':
        exportAsDocx(selectedNode, `${filename}.docx`);
        break;
      case 'pdf':
        exportAsPdf(selectedNode, `${filename}.pdf`);
        break;
      case 'json':
        exportAsJSON(project);
        break;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800">
      {/* Search input with 3D style */}
      <div className="relative">
        <input
          ref={searchRef}
          className="px-3 py-1.5 rounded-lg w-64
            bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
            border border-neutral-200 dark:border-neutral-700
            shadow-inner
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          placeholder="Search (Ctrl+/)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* View switcher */}
      <div className="ml-2 flex gap-1">
        {['Editor','Outline','Corkboard','Manuscript','Split'].map((v, i) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={view === v ? btn3DActive : btn3D}
            title={`Ctrl+${i+1}`}
          >
            <TopHighlight />
            {v}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="ml-auto flex gap-2">
        <button onClick={addBook} className={btn3DBlue} title="Ctrl+Shift+B">
          <TopHighlight />
          + Book
        </button>
        <button onClick={addChapter} className={btn3DGreen} title="Ctrl+Shift+N">
          <TopHighlight />
          + Chapter
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`${btn3D} flex items-center gap-1`}
            title="Export options"
          >
            <TopHighlight />
            {getExportLabel()} <span className="text-xs">▼</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 min-w-[180px] z-50
              bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
              rounded-xl border border-neutral-200 dark:border-neutral-700
              shadow-xl overflow-hidden">
              {/* Top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

              <div className="py-1">
                <button onClick={() => handleExport('md')} className="w-full px-3 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3 transition-colors">
                  <span>📝</span> <span className="font-medium">Markdown</span> <span className="text-xs opacity-50">.md</span>
                </button>
                <button onClick={() => handleExport('docx')} className="w-full px-3 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3 transition-colors">
                  <span>📄</span> <span className="font-medium">Word</span> <span className="text-xs opacity-50">.docx</span>
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full px-3 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3 transition-colors">
                  <span>📕</span> <span className="font-medium">PDF</span> <span className="text-xs opacity-50">.pdf</span>
                </button>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700" />
              <div className="py-1">
                <button onClick={() => handleExport('json')} className="w-full px-3 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center gap-3 transition-colors">
                  <span>💾</span> <span className="font-medium">Full Backup</span> <span className="text-xs opacity-50">.json</span>
                </button>
              </div>

              {/* Bottom shadow */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent" />
            </div>
          )}
        </div>

        <button onClick={importJSON} className={btn3D}>
          <TopHighlight />
          Import
        </button>
        <button onClick={() => setDark(d => !d)} className={btn3D} title="Ctrl+Shift+D">
          <TopHighlight />
          {dark ? 'Light' : 'Dark'}
        </button>
        <button onClick={onShowShortcuts} className={btn3D} title="Keyboard shortcuts">
          <TopHighlight />
          ?
        </button>
      </div>

      {/* Modals */}
      <PromptModal
        isOpen={bookModal}
        title="New Book"
        message="Enter a title for the new book:"
        defaultValue="New Book"
        placeholder="Book title"
        onConfirm={confirmAddBook}
        onCancel={() => setBookModal(false)}
      />

      <PromptModal
        isOpen={chapterModal}
        title="New Chapter"
        message="Enter a title for the new chapter:"
        defaultValue="Untitled Chapter"
        placeholder="Chapter title"
        onConfirm={confirmAddChapter}
        onCancel={() => setChapterModal(false)}
      />

      <AlertModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ open: false, title: '', message: '' })}
      />
    </div>
  );
}

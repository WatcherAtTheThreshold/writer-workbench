import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  uid, nowISO, loadProject, saveProject,
  walk, findById, mutateAtPath, findPath,
  collectChaptersInOrder, findParentBook, countWords
} from './utils/helpers';
import { exportAsMarkdown, exportAsJSON } from './utils/exporters';
import {
  Toolbar, Sidebar, MetaPanel,
  EditorView, OutlineView, Corkboard,
  ManuscriptView, ShortcutsHelp,
  PromptModal, ConfirmModal
} from './components';

const MAX_HISTORY = 50;

export default function WriterWorkbench() {
  const [project, setProjectState] = useState(loadProject);
  const [selectedId, setSelectedId] = useState(project.root.children[0]?.id || project.root.id);
  const [view, setView] = useState('Editor');
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef(null);

  // Modal states for daily goal
  const [goalModal, setGoalModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  // Undo/Redo history
  const historyRef = useRef([structuredClone(project)]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);

  // Wrapper to update project with undo history
  const setProject = useCallback((updater) => {
    setProjectState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      // Skip adding to history if this is an undo/redo operation
      if (skipHistoryRef.current) {
        skipHistoryRef.current = false;
        return next;
      }

      // Trim any future states if we're not at the end
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }

      // Add new state to history
      historyRef.current.push(structuredClone(next));

      // Limit history size
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      } else {
        historyIndexRef.current++;
      }

      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      skipHistoryRef.current = true;
      setProjectState(structuredClone(historyRef.current[historyIndexRef.current]));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      skipHistoryRef.current = true;
      setProjectState(structuredClone(historyRef.current[historyIndexRef.current]));
    }
  }, []);

  // Autosave
  useEffect(() => { saveProject(project); }, [project]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  // Collect all chapters for navigation
  const allChapters = useMemo(() => collectChaptersInOrder(project.root), [project]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Escape - close shortcuts modal
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
      }

      // ? - show shortcuts help (only when not in input)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }

      // Ctrl shortcuts
      if (e.ctrlKey) {
        // Ctrl+Z - undo (but not in text inputs where browser handles it)
        if (e.key === 'z' && !e.shiftKey && !isInput) {
          e.preventDefault();
          undo();
          return;
        }

        // Ctrl+Y or Ctrl+Shift+Z - redo (but not in text inputs)
        if ((e.key === 'y' || (e.key === 'Z' && e.shiftKey)) && !isInput) {
          e.preventDefault();
          redo();
          return;
        }

        // Ctrl+/ - focus search
        if (e.key === '/') {
          e.preventDefault();
          searchRef.current?.focus();
          return;
        }

        // Ctrl+1-5 - switch views
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          e.preventDefault();
          const views = ['Editor', 'Outline', 'Corkboard', 'Manuscript', 'Split'];
          setView(views[parseInt(e.key) - 1]);
          return;
        }

        // Ctrl+Up/Down - navigate chapters
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIdx = allChapters.findIndex(ch => ch.id === selectedId);
          if (e.key === 'ArrowUp' && currentIdx > 0) {
            setSelectedId(allChapters[currentIdx - 1].id);
          } else if (e.key === 'ArrowDown' && currentIdx < allChapters.length - 1) {
            setSelectedId(allChapters[currentIdx + 1].id);
          }
          return;
        }

        // Ctrl+Shift shortcuts
        if (e.shiftKey) {
          // Ctrl+Shift+D - dark mode
          if (e.key === 'D') {
            e.preventDefault();
            setDark(d => !d);
            return;
          }

          // Ctrl+Shift+B - add book
          if (e.key === 'B' && !isInput) {
            e.preventDefault();
            const title = prompt("Book title?", "New Book");
            if (title) {
              const next = structuredClone(project);
              next.root.children.push({ id: uid(), type: "folder", title, children: [] });
              next.updatedAt = nowISO();
              setProject(next);
            }
            return;
          }

          // Ctrl+Shift+N - add chapter
          if (e.key === 'N' && !isInput) {
            e.preventDefault();
            const title = prompt("Chapter title?", "Untitled Chapter");
            if (title) {
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
              if (targetFolder && targetFolder.id !== next.root.id) {
                targetFolder.children.push({
                  id: uid(), type: "chapter", title, content: "",
                  synopsis: "", tags: [], status: "Draft", pov: "",
                  createdAt: nowISO(), updatedAt: nowISO()
                });
                next.updatedAt = nowISO();
                setProject(next);
              } else {
                alert("Please select a book first, then add chapters to it.");
              }
            }
            return;
          }

          // Ctrl+Shift+E - export selected
          if (e.key === 'E' && !isInput) {
            e.preventDefault();
            const selectedNode = findById(project.root, selectedId);
            if (selectedNode && selectedNode.id !== project.root.id) {
              exportAsMarkdown(selectedNode, `${selectedNode.title.replace(/\s+/g, "_")}.md`);
            } else {
              alert("Please select a book or chapter to export.");
            }
            return;
          }

          // Ctrl+Shift+S - export all JSON
          if (e.key === 'S') {
            e.preventDefault();
            exportAsJSON(project);
            return;
          }
        }
      }

      // F2 - rename
      if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        const next = structuredClone(project);
        const node = findById(next.root, selectedId);
        if (node && node.id !== next.root.id) {
          const itemType = node.type === 'folder' ? 'book' : 'chapter';
          const title = prompt(`Rename ${itemType} to:`, node.title);
          if (title) {
            node.title = title;
            next.updatedAt = nowISO();
            setProject(next);
          }
        }
        return;
      }

      // Delete key - delete selected
      if (e.key === 'Delete' && !isInput) {
        e.preventDefault();
        const selectedNode = findById(project.root, selectedId);
        if (!selectedNode || selectedNode.id === project.root.id) return;
        const itemType = selectedNode.type === 'folder' ? 'book and all its chapters' : 'chapter';
        if (confirm(`Delete this ${itemType}?`)) {
          const next = structuredClone(project);
          const path = findPath(next.root, selectedId);
          if (path) {
            let parent = next.root;
            for (let i = 0; i < path.length - 1; i++) parent = parent.children[path[i]];
            parent.children.splice(path[path.length - 1], 1);
            next.updatedAt = nowISO();
            setProject(next);
            setSelectedId(next.root.id);
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, selectedId, showShortcuts, allChapters, undo, redo]);

  // Derived state
  const selectedNode = useMemo(() => findById(project.root, selectedId) || project.root, [project, selectedId]);

  const currentBook = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.type === 'folder' && selectedNode.id !== project.root.id) {
      return selectedNode;
    }
    if (selectedNode.type === 'chapter') {
      return findParentBook(project.root, selectedId);
    }
    return null;
  }, [project.root, selectedNode, selectedId]);

  const updateSelected = (updated) => {
    const ip = findPath(project.root, updated.id);
    const nextRoot = mutateAtPath(project.root, ip, () => updated);
    setProject({ ...project, root: nextRoot, updatedAt: nowISO() });
  };

  const reorderInFolder = (folder, newOrderIds) => {
    const next = structuredClone(project);
    const path = findPath(next.root, folder.id);
    let parent = next.root;
    for (let i = 0; i < path.length - 1; i++) parent = parent.children[path[i]];
    const f = parent.children[path[path.length - 1]];
    const chapters = f.children.filter(n => n.type === 'chapter');
    const others = f.children.filter(n => n.type !== 'chapter');
    const map = Object.fromEntries(chapters.map(c => [c.id, c]));
    const reordered = newOrderIds.map(id => map[id]).filter(Boolean);
    f.children = [...reordered, ...others];
    next.updatedAt = nowISO();
    setProject(next);
  };

  // Word count
  const totalWords = useMemo(() => {
    let sum = 0;
    walk(project.root, n => {
      if (n.type === 'chapter') sum += countWords(n.content || '');
    });
    return sum;
  }, [project]);

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Toolbar
        project={project}
        setProject={setProject}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        view={view}
        setView={setView}
        query={query}
        setQuery={setQuery}
        dark={dark}
        setDark={setDark}
        searchRef={searchRef}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex-1 flex min-h-0">
        <Sidebar
          project={project}
          setProject={setProject}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          query={query}
        />
        <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0 overflow-auto">
            {view === 'Editor' && (
              <EditorView
                node={selectedNode}
                onChange={updateSelected}
                bookTitle={currentBook?.title}
              />
            )}
            {view === 'Outline' && (
              <OutlineView folder={currentBook || project.root} bookTitle={currentBook?.title} />
            )}
            {view === 'Corkboard' && (
              <Corkboard
                folder={currentBook || project.root}
                onReorder={(ids) => reorderInFolder(currentBook || project.root, ids)}
                bookTitle={currentBook?.title}
              />
            )}
            {view === 'Manuscript' && (
              <ManuscriptView folder={currentBook || project.root} bookTitle={currentBook?.title} />
            )}
            {view === 'Split' && (
              <div className="grid grid-cols-2 h-full">
                <EditorView
                  node={selectedNode}
                  onChange={updateSelected}
                  bookTitle={currentBook?.title}
                />
                <OutlineView folder={currentBook || project.root} bookTitle={currentBook?.title} />
              </div>
            )}
          </div>
          <div className="border-l border-neutral-200 dark:border-neutral-800 min-h-0 overflow-auto">
            <MetaPanel
              node={selectedNode?.type === 'chapter' ? selectedNode : null}
              onChange={updateSelected}
            />
          </div>
        </div>
      </div>
      <div className="p-2 text-sm border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
        <div><span className="opacity-60">Total words:</span> {totalWords}</div>
        <div className="flex items-center gap-2">
          <span className="opacity-60">Daily goal:</span>
          <span>{project.settings.dailyGoal}/{Math.max(0, totalWords - (project.settings.dailyStartWords || 0))}</span>
          <button
            className="relative px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ease-out
              bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
              border border-neutral-200 dark:border-neutral-600
              shadow-sm hover:shadow-md hover:-translate-y-0.5
              active:shadow-inner active:translate-y-0"
            onClick={() => setGoalModal(true)}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-md" />
            Set
          </button>
          <button
            className="relative px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ease-out
              bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-950
              border border-amber-200 dark:border-amber-700
              text-amber-700 dark:text-amber-200
              shadow-sm hover:shadow-md hover:-translate-y-0.5
              active:shadow-inner active:translate-y-0"
            onClick={() => setResetModal(true)}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent rounded-t-md" />
            Reset
          </button>
          <div className="ml-2 w-48 h-2.5 rounded-md bg-gradient-to-b from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 shadow-inner overflow-hidden border border-neutral-300 dark:border-neutral-700">
            <div
              className="h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-sm"
              style={{ width: `${Math.min(100, Math.max(0, totalWords - (project.settings.dailyStartWords || 0)) / project.settings.dailyGoal * 100)}%` }}
            />
          </div>
        </div>
        <div className="ml-auto opacity-60">
          Press <kbd className="px-1.5 py-0.5 rounded-md text-xs bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 border border-neutral-300 dark:border-neutral-600 shadow-sm">?</kbd> for shortcuts
        </div>
      </div>

      {/* Modals */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      <PromptModal
        isOpen={goalModal}
        title="Set Daily Goal"
        message="How many words would you like to write each day?"
        defaultValue={String(project.settings.dailyGoal || 500)}
        placeholder="500"
        onConfirm={(value) => {
          setGoalModal(false);
          const v = parseInt(value);
          if (!isNaN(v) && v > 0) {
            setProject(p => ({ ...p, settings: { ...p.settings, dailyGoal: v }, updatedAt: nowISO() }));
          }
        }}
        onCancel={() => setGoalModal(false)}
      />

      <ConfirmModal
        isOpen={resetModal}
        title="Reset Daily Progress"
        message="This will set your current word count as the new starting point. Your daily progress will reset to 0. Continue?"
        confirmText="Reset"
        onConfirm={() => {
          setResetModal(false);
          setProject(p => ({ ...p, settings: { ...p.settings, dailyStartWords: totalWords }, updatedAt: nowISO() }));
        }}
        onCancel={() => setResetModal(false)}
      />
    </div>
  );
}

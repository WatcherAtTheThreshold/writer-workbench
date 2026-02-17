# Writer Workbench — Claude Code Guide

## What This Is

A browser-based manuscript and creative writing management tool. Hierarchical project organization (books → chapters), markdown editor, multiple views, word counting, TTS read-aloud, and full export suite. All data stored in browser localStorage — no backend.

---

## Tech Stack

- **React 19** with hooks (useState, useRef, useMemo, useCallback)
- **Vite** — dev server and build tool
- **Tailwind CSS** — utility-first styling with dark mode via class toggle
- **Marked** — markdown parsing
- **@dnd-kit** — drag-and-drop for sidebar tree
- **docx / jsPDF / html2canvas / file-saver** — export pipeline
- **Web Speech API** — text-to-speech

This is NOT a vanilla HTML/CSS/JS project. It has a build step (`npm run dev` / `npm run build`).

---

## File Structure

```
writer-workbench/
  src/
    App.jsx              — main component, all top-level state, keyboard shortcuts
    main.jsx             — React entry point
    index.css            — global Tailwind config, CSS custom properties
    App.css              — app-specific styles
    components/
      index.js           — barrel export
      Toolbar.jsx        — nav, view switcher, search, import/export
      Sidebar.jsx        — project tree with @dnd-kit drag-and-drop
      MetaPanel.jsx      — chapter metadata (status, POV, tags, synopsis)
      EditorView.jsx     — markdown editor with formatting shortcuts + TTS
      OutlineView.jsx    — hierarchical chapter list
      Corkboard.jsx      — visual draggable card view (HTML5 drag)
      ManuscriptView.jsx — compiled reading/render view
      Modal.jsx          — prompt, confirm, alert modals
      ShortcutsHelp.jsx  — keyboard shortcuts reference
      TTSControls.jsx    — TTS play/pause/speed/voice controls
    utils/
      helpers.js         — tree traversal (walk, findById, findPath, mutateAtPath), storage, word count
      exporters.js       — MD, JSON, DOCX, PDF export
      markdown.js        — marked config
      tts.js             — Web Speech API singleton wrapper
  scripts/
    backup.js            — CLI backup to JSON
    export-md.js         — CLI batch markdown export
  docs/
    FEATURES.md          — detailed feature documentation
```

---

## Architecture & Patterns

### State Management
- Single source of truth: `project` state in `App.jsx`
- Immutable updates via `structuredClone()`
- 50-level undo/redo history stack using `historyRef` + `skipHistoryRef`
- Autosave to localStorage on state change (key: `"writer-workbench-v1"`)

### Data Model
```
Project { id, name, settings { dailyGoal, dailyStartWords }, root: Folder }
  Folder { id, type: "folder", title, children: [Folder | Chapter] }
  Chapter { id, type: "chapter", title, content, synopsis, tags, status, pov }
```

### Tree Utilities (helpers.js)
- `walk(node, fn)` — traverse entire tree
- `findById(root, id)` — search by ID
- `findPath(root, id)` — get index path to node
- `mutateAtPath(root, path, fn)` — immutable nested update

### Component Responsibilities
- **Toolbar** — search, view switching, import/export, settings
- **Sidebar** — tree navigation with drag reordering
- **EditorView** — raw markdown editing with Ctrl+B/I/H formatting
- **OutlineView** — list view with metadata summary
- **Corkboard** — visual card grid for chapter planning
- **ManuscriptView** — compiled rendered reading view
- **MetaPanel** — metadata editing (read-only on folders, editable on chapters)

### Views
`view` state determines which component renders: Editor, Outline, Corkboard, Manuscript, or Split (side-by-side).

---

## Coding Conventions

- Components: PascalCase `.jsx` files
- Utilities: camelCase `.js` files
- IDs: 7-char random strings via `Math.random().toString(36).slice(2, 9)`
- CSS custom properties in `:root` for theming (dark mode toggles `.dark` class on `<html>`)
- All state mutations go through `App.jsx` — components receive update functions as props

---

## Key Constraints

- No backend — everything lives in localStorage
- Storage key is versioned (`writer-workbench-v1`) for future migration support
- Sidebar uses `@dnd-kit`; Corkboard uses native HTML5 drag events — don't mix them
- TTS uses a singleton pattern (`getTTS()`) — don't create multiple instances
- Export filenames follow `${projectName}_${format}` pattern

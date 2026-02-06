# Writer Workbench - Technical Patterns & Decisions

> **Instructions:** Use this template when reviewing an app repo. Fill in each section as you analyze the codebase. Delete placeholder text and examples once filled.

---

## App Overview
- **Type/Category:** [e.g., Writing tool, Productivity app, Dashboard, etc.]
- **Core Features:**
  - [Primary feature]
  - [Secondary feature]
  - [Key user workflows]
- **Tech Stack:**
  - [Language/Framework]
  - [Build tools]
  - [Notable libraries]

## Architecture Patterns

### Module/File Structure
```
[List main files and their responsibilities]
file.js (X lines) - Description
```

### Separation of Concerns
| Module | Responsibility |
|--------|----------------|
| [file] | [what it handles] |

### State Management Pattern
- **Pattern used:** [Centralized, Redux, Context, Component-local, etc.]
- **How state flows:** [Description]
- **Key state variables:** [List them]

### Data Model
```javascript
// Core data structures used in the app
// e.g., User object, Document structure, Settings schema
```

## Design

### Core Application System
```javascript
// Show the main pattern used for app logic
// e.g., CRUD operations, data transformations, business logic
```

**Key Design Decisions:**
- [Decision and rationale]

### Data Persistence
- **Storage method:** [LocalStorage, IndexedDB, API, etc.]
- **Data format:** [JSON structure, schema]
- **Sync strategy:** [Auto-save, manual save, real-time]

### UI/View Management
- **Routing:** [React Router, custom, single-page, etc.]
- **View switching:** [How different screens/modes are managed]
- **Responsive approach:** [Media queries, breakpoints, mobile considerations]

---

## What Works Well
- [Pattern/decision that proved effective]
- [Why it works for this type of app]

## What We'd Do Differently
- [Honest reflection on improvements]
- [Technical debt identified]

---

## Key Implementation Details

### [System Name 1 - e.g., "Editor System"]
- **Approach:** [How it's implemented]
- **Why this way:** [Rationale]
- **Gotchas/Lessons:** [What to watch out for]

### [System Name 2 - e.g., "Export System"]
- **Approach:**
- **Why this way:**
- **Gotchas/Lessons:**

### [System Name 3 - e.g., "Data Sync"]
- **Approach:**
- **Why this way:**
- **Gotchas/Lessons:**

---

## Reusable Code Patterns

### [Pattern Name 1]
```javascript
// Code snippet that could transfer to other projects
```

### [Pattern Name 2]
```javascript
// Another reusable pattern
```

### [Utility Functions]
```javascript
// Helper functions worth keeping
```

### [CSS Patterns]
```css
/* Reusable styling approaches */
```

---

## Performance Considerations

### What Mattered
- [Performance concern that required attention]
- [How it was addressed]

### What Didn't Matter
- [Premature optimization avoided]
- [Why it wasn't needed for this scale]

---

## Development Workflow Notes

### Build Process
- [Steps to run/build the project]
- [Dev server setup]
- [Deployment notes]

### File Organization
```
project/
├── [folder structure]
```

### Debugging Tips
- [How to inspect app state]
- [Useful console commands]
- [Common issues and fixes]

---

## Quick Reference: Extending the App

### Adding [Feature Type 1 - e.g., "New Views"]
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Adding [Feature Type 2 - e.g., "New Export Formats"]
1. [Step 1]
2. [Step 2]

### Adding [Feature Type 3 - e.g., "New Data Fields"]
1. [Step 1]
2. [Step 2]

---

## Reference: Previous Reviews

| App | Type | Key Patterns | Link |
|-----|------|--------------|------|
| [App Name] | [Type] | [Patterns] | [link] |

---

# Writer Workbench - Completed Review

## App Overview
- **Type/Category:** Writing/Authoring Tool (Scrivener-like)
- **Core Features:**
  - Hierarchical book/chapter organization
  - Rich text editor with markdown support
  - Multiple views (Editor, Outline, Corkboard, Manuscript, Split)
  - Export to Markdown, JSON, DOCX, PDF
  - Daily word count goals with progress tracking
  - Text-to-speech for proofreading
  - Undo/redo with 50-state history
- **Tech Stack:**
  - React 19 + Vite 7
  - TailwindCSS 4
  - ES Modules
  - Notable libraries: docx, jsPDF, file-saver, marked, @dnd-kit

## Architecture Patterns

### Module/File Structure
```
src/
├── App.jsx (~450 lines) - Main app state, keyboard shortcuts, view routing
├── main.jsx - React entry point
├── index.css - Global styles, CSS variables
├── components/
│   ├── index.js - Barrel exports
│   ├── Toolbar.jsx - Top navigation, view switcher, export actions
│   ├── Sidebar.jsx - Book/chapter tree navigation
│   ├── EditorView.jsx - Main text editor
│   ├── MetaPanel.jsx - Chapter metadata (synopsis, tags, status, POV)
│   ├── OutlineView.jsx - Hierarchical outline display
│   ├── Corkboard.jsx - Drag-and-drop card view
│   ├── ManuscriptView.jsx - Read-only compiled view
│   ├── Modal.jsx - Reusable modal components
│   ├── ShortcutsHelp.jsx - Keyboard shortcuts reference
│   └── TTSControls.jsx - Text-to-speech controls
└── utils/
    ├── helpers.js - Tree utilities, storage, word count
    ├── exporters.js - MD/JSON/DOCX/PDF export
    ├── markdown.js - Markdown parsing utilities
    └── tts.js - Text-to-speech utilities
```

### Separation of Concerns
| Module | Responsibility |
|--------|----------------|
| App.jsx | Global state, routing, keyboard shortcuts |
| helpers.js | Data manipulation, tree traversal, persistence |
| exporters.js | All export format logic |
| Components | Presentation only, receive state via props |

### State Management Pattern
- **Pattern used:** Centralized useState in App.jsx with prop drilling
- **How state flows:** App owns `project` state, passes down with callbacks
- **Key state variables:**
  - `project` - Full document tree (books, chapters, content)
  - `selectedId` - Currently selected node
  - `view` - Current view mode
  - `historyRef` - Undo/redo stack (50 states max)

### Data Model
```javascript
// Project structure
{
  id: "abc123",
  name: "Writer Workbench",
  settings: { dailyGoal: 500, dailyStartWords: 0 },
  root: {
    id: "root",
    type: "folder",
    title: "My Books",
    children: [
      {
        id: "book1",
        type: "folder",
        title: "Book 1",
        children: [
          {
            id: "ch1",
            type: "chapter",
            title: "Chapter 1",
            content: "# Chapter 1\n\nText...",
            synopsis: "Opening scene",
            tags: ["intro"],
            status: "Draft",
            pov: "1st",
            createdAt: "ISO string",
            updatedAt: "ISO string"
          }
        ]
      }
    ]
  }
}
```

## Design

### Core Application System
```javascript
// Tree traversal pattern used throughout
function walk(node, fn, parent = null, indexPath = []) {
  fn(node, parent, indexPath);
  if (node.type === "folder" && Array.isArray(node.children)) {
    node.children.forEach((child, i) => walk(child, fn, node, [...indexPath, i]));
  }
}

// Immutable updates with path-based mutation
function mutateAtPath(root, indexPath, mutate) {
  const clone = structuredClone(root);
  let cur = clone;
  for (let i = 0; i < indexPath.length - 1; i++) cur = cur.children[indexPath[i]];
  const idx = indexPath[indexPath.length - 1];
  cur.children[idx] = mutate(cur.children[idx]);
  return clone;
}
```

**Key Design Decisions:**
- Hierarchical tree structure mirrors mental model of books/chapters
- `structuredClone` for immutable updates (clean but not optimal for large docs)
- View-agnostic data model - same data works in all views

### Data Persistence
- **Storage method:** LocalStorage with key `writer-workbench-v1`
- **Data format:** Full JSON project object
- **Sync strategy:** Auto-save on every state change via useEffect

### UI/View Management
- **Routing:** No router - single-page with view state
- **View switching:** `view` state controls which component renders
- **Responsive approach:** TailwindCSS breakpoints, grid layouts adapt

---

## What Works Well
- **Tree utilities** - `walk`, `findById`, `findPath` are reusable for any hierarchical data
- **Export abstraction** - Clean separation makes adding formats easy
- **Keyboard-first UX** - Comprehensive shortcuts improve power user experience
- **Undo/redo** - History stack pattern works well for document apps

## What We'd Do Differently
- **State management** - For scaling, consider Zustand or useReducer to avoid prop drilling
- **Large document performance** - `structuredClone` on every keystroke could lag; consider Immer or selective updates
- **TypeScript** - Would catch bugs in the tree traversal code
- **IndexedDB** - LocalStorage has 5MB limit; large manuscripts could exceed this

---

## Reusable Code Patterns

### Tree Traversal
```javascript
export function walk(node, fn, parent = null, indexPath = []) {
  fn(node, parent, indexPath);
  if (node.type === "folder" && Array.isArray(node.children)) {
    node.children.forEach((child, i) => walk(child, fn, node, [...indexPath, i]));
  }
}
```

### Undo/Redo History
```javascript
const MAX_HISTORY = 50;
const historyRef = useRef([structuredClone(initialState)]);
const historyIndexRef = useRef(0);

const undo = () => {
  if (historyIndexRef.current > 0) {
    historyIndexRef.current--;
    setState(structuredClone(historyRef.current[historyIndexRef.current]));
  }
};
```

### Export Pattern
```javascript
// Blob + file-saver pattern for client-side downloads
const blob = new Blob([content], { type: "text/markdown" });
saveAs(blob, filename);
```

---

## Development Workflow Notes

### Build Process
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build to /dist
npm run preview    # Preview production build
```

### Debugging Tips
- Open DevTools > Application > Local Storage to inspect saved project
- `localStorage.getItem('writer-workbench-v1')` in console to view raw data
- Clear localStorage to reset to default project

---

## Quick Reference: Extending the App

### Adding New Views
1. Create component in `src/components/NewView.jsx`
2. Export from `src/components/index.js`
3. Add to view array in App.jsx keyboard handler
4. Add render case in App.jsx JSX

### Adding New Export Formats
1. Add function in `src/utils/exporters.js`
2. Import in Toolbar.jsx
3. Add button/menu item to trigger export

### Adding New Chapter Metadata Fields
1. Update `DEFAULT_PROJECT` in helpers.js
2. Add field to MetaPanel.jsx
3. Update chapter creation in App.jsx keyboard handlers

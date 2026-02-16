# Writer Workbench - Features Overview

A browser-based manuscript and creative writing management application built with React and Tailwind CSS. Designed for writers who want a lightweight, local-first tool for manuscript organization and drafting.

---

## Core Features

### Project Management
- **Hierarchical organization** - Folders and chapters in a nested tree structure
- **Auto-save** - All changes persist to browser localStorage automatically
- **Timestamps** - Creation and update times tracked for all items
- **Default project** - Starts with a sample manuscript structure

### Writing & Editing
- **Markdown editor** - Write chapters in Markdown format
- **Word counting** - Per-chapter and total project word counts
- **Daily writing goals** - Configurable target with visual progress bar
- **Text-to-Speech** - Listen to your writing read aloud (see TTS section below)

### Chapter Metadata
- **Status tracking** - Idea → Draft → Revised → Final
- **Point of View (POV)** - Track narrative perspective per chapter
- **Tags** - Comma-separated tags for categorization
- **Synopsis** - Summary field for each chapter

---

## View Modes

| Mode | Purpose |
|------|---------|
| **Editor** | Write and edit individual chapters |
| **Outline** | Hierarchical view of all chapters with synopses and tags |
| **Corkboard** | Visual grid of draggable chapter cards |
| **Manuscript** | Compiled reading view with rendered Markdown |
| **Split** | Side-by-side editor and outline view |

---

## Navigation & Organization

- **Project tree sidebar** - Expandable folder/chapter hierarchy
- **Drag-and-drop** - Reorder items in tree and corkboard views
- **Search** - Filter by title, tags, synopsis, and folder names
- **Rename/Delete** - Manage all items inline

---

## Import & Export

- **JSON export** - Full project backup with all metadata
- **JSON import** - Restore projects from backup files
- **Markdown export** - Export chapters as .md files
- **Word export** - Export as .docx (compatible with Google Docs)
- **PDF export** - Export as formatted PDF document
- **CLI tools** - `npm run backup` and `npm run export:md` scripts

### Export Formats
| Format | Best For |
|--------|----------|
| Markdown (.md) | Plain text editing, version control |
| Word (.docx) | Google Docs, Microsoft Word, sharing |
| PDF (.pdf) | Final reading, printing, sharing |
| JSON (.json) | Full backup with metadata |

---

## Text-to-Speech (TTS)

Built-in read-aloud functionality using the Web Speech API. No external services or API keys required.

### Features
- **Read Aloud** - Listen to chapters or entire books
- **Play/Pause/Stop** - Full playback controls
- **Voice Selection** - Choose from available system voices
- **Speed Control** - Adjust reading speed (0.5x to 2x)
- **Live Indicator** - Shows the current sentence being read

### Usage
- **Editor View** - Compact TTS button in the chapter toolbar (reads current chapter)
- **Manuscript View** - Full TTS controls below book title (reads entire book)

### Tips
- Use TTS to proofread - hearing your writing helps catch awkward phrasing
- Different voices may pronounce words differently
- Works offline - uses your browser's built-in speech synthesis

---

## Theme & Display

- **Dark mode** - Toggle between light and dark themes
- **Responsive layout** - Three-panel design with flexible sizing
- **Typography** - Tailwind typography plugin for clean rendering

---

## Keyboard Shortcuts

Press `?` at any time to see the full shortcuts help panel.

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl + 1` | Switch to Editor view |
| `Ctrl + 2` | Switch to Outline view |
| `Ctrl + 3` | Switch to Corkboard view |
| `Ctrl + 4` | Switch to Manuscript view |
| `Ctrl + 5` | Switch to Split view |
| `Ctrl + ↑` | Navigate to previous chapter |
| `Ctrl + ↓` | Navigate to next chapter |
| `Ctrl + /` | Focus search bar |

### Editor
| Shortcut | Action |
|----------|--------|
| `Ctrl + B` | Bold selected text (**text**) |
| `Ctrl + I` | Italic selected text (*text*) |
| `Escape` | Close help panel |

### Project Management
| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + B` | Add new Book |
| `Ctrl + Shift + N` | Add new Chapter |
| `Ctrl + Shift + E` | Export selected as Markdown |
| `Ctrl + Shift + S` | Export all as JSON |
| `F2` | Rename selected item |
| `Delete` | Delete selected item (with confirmation) |

### Display
| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + D` | Toggle dark mode |
| `?` | Show/hide keyboard shortcuts help |

---

## Technical Details

### Tech Stack
- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 4.1.14
- Pure client-side (no backend)

### Data Storage
- localStorage key: `writer-workbench-v1`
- Immutable state updates with `structuredClone`

### Project Structure
```
src/
├── App.jsx           # Main application entry
├── main.jsx          # React entry point
├── index.css         # Global styles
├── components/       # UI components
│   ├── index.js      # Component exports
│   ├── Toolbar.jsx   # Top navigation bar
│   ├── Sidebar.jsx   # Project tree sidebar
│   ├── MetaPanel.jsx # Chapter metadata editor
│   ├── EditorView.jsx    # Markdown editor
│   ├── OutlineView.jsx   # Chapter outline
│   ├── Corkboard.jsx     # Draggable cards view
│   ├── ManuscriptView.jsx # Reading view
│   └── ShortcutsHelp.jsx  # Keyboard shortcuts modal
└── utils/            # Utility functions
    ├── helpers.js    # Tree utilities, storage
    ├── markdown.js   # Markdown parsing (marked)
    └── exporters.js  # PDF, DOCX, MD, JSON export

scripts/
├── backup.js         # Backup utility
└── export-md.js      # Markdown export CLI
```

---

## Known Limitations / Areas for Improvement

### Functionality
- [ ] **No undo/redo** - Accidental deletions are permanent
- [ ] **No cloud sync** - Data lives only in browser localStorage
- [ ] **No collaboration** - Single-user only
- [ ] **No rich text** - Markdown only, no WYSIWYG
- [ ] **No spell check integration** - Relies on browser spell check
- [ ] **No chapter versioning** - No way to compare drafts

### Performance
- [x] ~~**Single-file architecture**~~ - Now split into modular components
- [ ] **No lazy loading** - All views load at once
- [ ] **Simple Markdown parser** - Custom parser may miss edge cases

### UX
- [x] **~~No keyboard shortcuts~~** - Comprehensive shortcuts added (press `?` to view)
- [ ] **Limited drag-and-drop feedback** - Minimal visual cues
- [ ] **No onboarding** - New users see sample project without guidance
- [ ] **Sidebar always visible** - Cannot collapse to maximize editor space

### Data Safety
- [ ] **No auto-backup** - Manual export required
- [ ] **localStorage limits** - Browser storage has size constraints
- [ ] **No offline detection** - No warning if localStorage fails

---

## Potential Enhancements

### Quick Wins
- [x] ~~Add keyboard shortcuts (Ctrl+S to force save, Ctrl+B for bold, etc.)~~ ✓ Done
- [ ] Add undo/redo with history stack
- [ ] Add collapsible sidebar
- [x] ~~Add confirmation dialogs for deletions~~ ✓ Done

### Medium Effort
- [x] ~~Split App.jsx into modular components~~ ✓ Done
- [x] ~~Add full-featured Markdown library (marked)~~ ✓ Done
- [ ] Add chapter comparison/diff view
- [x] ~~Add export to DOCX/PDF~~ ✓ Done

### Larger Projects
- Add optional cloud sync (Firebase, Supabase)
- Add collaborative editing
- Add mobile-responsive layout
- Add plugin system for extensibility

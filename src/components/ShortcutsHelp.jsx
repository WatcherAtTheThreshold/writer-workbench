import React from 'react';

export default function ShortcutsHelp({ onClose }) {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: 'Ctrl + 1-5', action: 'Switch views (Editor, Outline, Corkboard, Manuscript, Split)' },
        { keys: 'Ctrl + ↑/↓', action: 'Navigate to previous/next chapter' },
        { keys: 'Ctrl + /', action: 'Focus search bar' },
      ]
    },
    {
      category: 'Editor',
      items: [
        { keys: 'Ctrl + B', action: 'Bold selected text' },
        { keys: 'Ctrl + I', action: 'Italic selected text' },
        { keys: 'Ctrl + H', action: 'Insert horizontal rule (scene break)' },
      ]
    },
    {
      category: 'Project',
      items: [
        { keys: 'Ctrl + Z', action: 'Undo last action' },
        { keys: 'Ctrl + Y', action: 'Redo last action' },
        { keys: 'Ctrl + Shift + B', action: 'Add new Book' },
        { keys: 'Ctrl + Shift + N', action: 'Add new Chapter' },
        { keys: 'Ctrl + Shift + E', action: 'Export selected as Markdown' },
        { keys: 'Ctrl + Shift + S', action: 'Export all as JSON' },
        { keys: 'F2', action: 'Rename selected item' },
        { keys: 'Delete', action: 'Delete selected item' },
      ]
    },
    {
      category: 'Display',
      items: [
        { keys: 'Ctrl + Shift + D', action: 'Toggle dark mode' },
        { keys: '?', action: 'Show/hide this help' },
      ]
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="relative max-w-2xl w-full max-h-[80vh] overflow-hidden m-4 rounded-xl
          bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
          border border-neutral-200 dark:border-neutral-700
          shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent rounded-t-xl" />

        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between
          bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-850">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center
              bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
              border border-neutral-200 dark:border-neutral-600
              shadow-sm hover:shadow-md hover:-translate-y-0.5
              active:shadow-inner active:translate-y-0
              transition-all duration-150 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-lg" />
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-auto max-h-[60vh]">
          {shortcuts.map(cat => (
            <div key={cat.category}>
              <h3 className="font-semibold text-sm uppercase tracking-wide opacity-60 mb-3">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map(item => (
                  <div key={item.keys} className="flex items-center gap-4">
                    <kbd className="relative px-2.5 py-1.5 rounded-lg font-mono text-sm min-w-[140px]
                      bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
                      border border-neutral-200 dark:border-neutral-600
                      shadow-sm">
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-lg" />
                      {item.keys}
                    </kbd>
                    <span className="text-sm">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-sm opacity-60
          bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-850 dark:to-neutral-900">
          Press{' '}
          <kbd className="relative px-1.5 py-0.5 rounded-md text-xs
            bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
            border border-neutral-200 dark:border-neutral-600 shadow-sm">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="relative px-1.5 py-0.5 rounded-md text-xs
            bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
            border border-neutral-200 dark:border-neutral-600 shadow-sm">
            Escape
          </kbd>{' '}
          to close
        </div>

        {/* Bottom shadow for 3D effect */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent rounded-b-xl" />
      </div>
    </div>
  );
}

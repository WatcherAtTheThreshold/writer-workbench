import React, { useState, useMemo } from 'react';
import { countWords } from '../utils/helpers';

export default function Corkboard({ folder, onReorder, bookTitle }) {
  const [dragId, setDragId] = useState(null);
  const items = folder.type === 'folder' ? folder.children.filter(n => n.type === 'chapter') : [];
  const totalWords = useMemo(() => items.reduce((sum, ch) => sum + countWords(ch.content || ''), 0), [items]);

  const onDrop = (e, targetId) => {
    e.preventDefault();
    const src = e.dataTransfer.getData('text/plain') || dragId;
    if (!src || src === targetId) return;
    const order = items.map(i => i.id);
    const from = order.indexOf(src);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    onReorder(order);
    setDragId(null);
  };

  const onDragOver = (e) => e.preventDefault();

  return (
    <div className="p-4">
      {/* Book header */}
      {bookTitle && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-xl font-bold">{bookTitle}</h2>
          </div>
          <div className="mt-2 text-sm opacity-70">
            {items.length} chapter{items.length !== 1 ? 's' : ''} • {totalWords.toLocaleString()} words • Drag cards to reorder
          </div>
        </div>
      )}

      {!items.length ? (
        <div className="p-6 opacity-60">No chapters in this book yet. Click "+ Chapter" to add one.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {items.map((ch, idx) => (
            <div
              key={ch.id}
              draggable
              onDragStart={(e) => {
                setDragId(ch.id);
                e.dataTransfer.setData('text/plain', ch.id);
              }}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, ch.id)}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-40">{idx + 1}.</span>
                <span className="font-semibold">{ch.title}</span>
              </div>
              <div className="text-xs opacity-60 mt-1">
                {ch.status} {ch.tags?.length ? '• ' + ch.tags.join(', ') : ''}
              </div>
              {ch.synopsis && <div className="text-sm mt-2 line-clamp-4 opacity-80">{ch.synopsis}</div>}
              <div className="text-xs opacity-40 mt-2">{countWords(ch.content || '')} words</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

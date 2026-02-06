import React, { useMemo } from 'react';
import { collectChaptersInOrder, countWords } from '../utils/helpers';

export default function OutlineView({ folder, bookTitle }) {
  const chapters = useMemo(() => collectChaptersInOrder(folder), [folder]);
  const totalWords = useMemo(() => chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0), [chapters]);

  return (
    <div className="p-4 space-y-3">
      {/* Book header */}
      {bookTitle && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-xl font-bold">{bookTitle}</h2>
          </div>
          <div className="mt-2 text-sm opacity-70">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} • {totalWords.toLocaleString()} words
          </div>
        </div>
      )}

      {!chapters.length ? (
        <div className="p-6 opacity-60">No chapters in this book yet. Click "+ Chapter" to add one.</div>
      ) : (
        chapters.map((ch, idx) => (
          <div key={ch.id} className="p-3 rounded border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-40 w-6">{idx + 1}.</span>
              <span className="font-semibold">{ch.title}</span>
              <span className="ml-2 text-xs opacity-60">{ch.status}</span>
              <span className="ml-auto text-xs opacity-40">{countWords(ch.content || '')} words</span>
            </div>
            {ch.synopsis && <div className="text-sm opacity-80 mt-1 ml-8">{ch.synopsis}</div>}
            {!!(ch.tags?.length) && <div className="text-xs mt-1 ml-8 opacity-60">Tags: {ch.tags.join(', ')}</div>}
          </div>
        ))
      )}
    </div>
  );
}

import React, { useMemo, useState, useCallback } from 'react';
import { collectChaptersInOrder, countWords } from '../utils/helpers';
import { mdToHtml } from '../utils/markdown';
import TTSControls from './TTSControls';
import { getTTS } from '../utils/tts';

export default function ManuscriptView({ folder, bookTitle }) {
  const [highlightedSentence, setHighlightedSentence] = useState(null);
  const chapters = useMemo(() => collectChaptersInOrder(folder), [folder]);
  const totalWords = useMemo(() => chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0), [chapters]);

  // Combine all chapter content for TTS
  const fullText = useMemo(() => {
    if (!chapters.length) return '';
    const tts = getTTS();
    return chapters.map((ch, idx) => {
      const chapterHeader = `Chapter ${idx + 1}. ${ch.title}. `;
      const content = tts.stripMarkdown(ch.content || '');
      return chapterHeader + content;
    }).join('\n\n');
  }, [chapters]);

  // Handle TTS highlighting
  const handleHighlight = useCallback((sentenceInfo) => {
    setHighlightedSentence(sentenceInfo);
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto overflow-x-hidden">
      {/* Book title page */}
      {bookTitle && (
        <div className="text-center py-12 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-4xl font-bold mb-4 break-words">{bookTitle}</h1>
          <div className="text-sm opacity-60">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} • {totalWords.toLocaleString()} words
          </div>
          {/* TTS Controls for full book */}
          {chapters.length > 0 && (
            <div className="mt-6 flex justify-center">
              <TTSControls text={fullText} onHighlight={handleHighlight} />
            </div>
          )}
        </div>
      )}

      {/* TTS Now Reading indicator - sticky */}
      {highlightedSentence && (
        <div className="sticky top-0 z-10 mx-auto max-w-2xl px-4 py-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg text-sm">
          <span className="opacity-60">🔊 Reading:</span>
          <span className="ml-2 italic">"{highlightedSentence.sentence.trim().substring(0, 150)}{highlightedSentence.sentence.length > 150 ? '...' : ''}"</span>
        </div>
      )}

      {!chapters.length ? (
        <div className="p-6 opacity-60 text-center">No chapters in this book yet.</div>
      ) : (
        chapters.map((ch, idx) => (
          <div key={ch.id} className="pt-8 overflow-hidden">
            <div className="text-sm opacity-40 mb-2">Chapter {idx + 1}</div>
            <h2 className="text-2xl font-bold mb-4 break-words">{ch.title}</h2>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none overflow-x-hidden break-words [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_img]:max-w-full [&_p]:indent-8 [&_p:first-of-type]:indent-0"
              dangerouslySetInnerHTML={{ __html: mdToHtml(ch.content || "") }}
            />
          </div>
        ))
      )}
    </div>
  );
}

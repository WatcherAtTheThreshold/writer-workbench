import React, { useRef, useState, useMemo, useCallback } from 'react';
import { nowISO, countWords, collectChaptersInOrder } from '../utils/helpers';
import TTSControls from './TTSControls';
import { getTTS } from '../utils/tts';

export default function EditorView({ node, onChange, bookTitle }) {
  const textareaRef = useRef(null);
  const [highlightedSentence, setHighlightedSentence] = useState(null);
  const wc = countWords(node?.content || "");
  const update = (patch) => onChange({ ...node, ...patch, updatedAt: nowISO() });

  // Calculate book word count if node is a folder
  const bookWordCount = useMemo(() => {
    if (!node || node.type !== 'folder') return 0;
    const chapters = collectChaptersInOrder(node);
    return chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
  }, [node]);

  // Get clean text for TTS
  const ttsText = useMemo(() => {
    if (!node?.content) return '';
    const tts = getTTS();
    return tts.stripMarkdown(node.content);
  }, [node?.content]);

  // Handle TTS highlighting
  const handleHighlight = useCallback((sentenceInfo) => {
    setHighlightedSentence(sentenceInfo);
  }, []);

  const handleKeyDown = (e) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);

    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const newText = value.substring(0, selectionStart) + `**${selectedText}**` + value.substring(selectionEnd);
      update({ content: newText });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2 + selectedText.length;
        textarea.focus();
      }, 0);
    }

    // Ctrl+I for italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      const newText = value.substring(0, selectionStart) + `*${selectedText}*` + value.substring(selectionEnd);
      update({ content: newText });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + selectedText.length;
        textarea.focus();
      }, 0);
    }

    // Ctrl+H for horizontal rule (scene break)
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      // Insert *** with newlines before and after
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const needsNewlineBefore = before.length > 0 && !before.endsWith('\n\n');
      const needsNewlineAfter = after.length > 0 && !after.startsWith('\n\n');
      const hr = (needsNewlineBefore ? '\n\n' : '') + '***' + (needsNewlineAfter ? '\n\n' : '');
      const newText = before + hr + after;
      update({ content: newText });
      setTimeout(() => {
        const newPos = selectionStart + hr.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }
  };

  if (!node) {
    return <div className="p-6 opacity-60">Select a chapter to edit.</div>;
  }

  // Display for books (folders)
  if (node.type === 'folder') {
    const chapters = collectChaptersInOrder(node);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-lg opacity-60">📚</span>
          <span className="text-lg font-semibold flex-1">{node.title}</span>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <div className="text-center py-12 opacity-60">
            <p className="text-lg mb-2">This is a book folder.</p>
            <p className="text-sm">Select a chapter from the sidebar to edit, or use the Outline/Corkboard views to manage chapters.</p>
            {chapters.length > 0 && (
              <p className="text-sm mt-4">{chapters.length} chapter{chapters.length !== 1 ? 's' : ''} in this book</p>
            )}
          </div>
        </div>
        <div className="p-2 text-sm opacity-70 border-t border-neutral-200 dark:border-neutral-800">
          Word count: {bookWordCount}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Book title header */}
      {bookTitle && (
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-sm opacity-60">📚</span>
          <span className="ml-2 text-sm font-medium opacity-70">{bookTitle}</span>
        </div>
      )}
      <div className="flex items-center gap-2 p-2 border-b border-neutral-200 dark:border-neutral-800">
        <input
          className="text-lg font-semibold bg-transparent outline-none flex-1"
          value={node.title}
          onChange={e => update({ title: e.target.value })}
        />
        <TTSControls text={ttsText} onHighlight={handleHighlight} compact />
      </div>

      {/* TTS Now Reading indicator */}
      {highlightedSentence && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-sm">
          <span className="opacity-60">🔊 Reading:</span>
          <span className="ml-2 italic">"{highlightedSentence.sentence.trim().substring(0, 100)}{highlightedSentence.sentence.length > 100 ? '...' : ''}"</span>
        </div>
      )}

      <div className="flex-1 p-4 overflow-auto">
        <textarea
          ref={textareaRef}
          className="w-full h-[70vh] leading-7 rounded bg-neutral-50 dark:bg-neutral-950 p-3"
          value={node.content || ''}
          onChange={e => update({ content: e.target.value })}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="p-2 text-sm opacity-70 border-t border-neutral-200 dark:border-neutral-800">
        Word count: {wc}
        <span className="ml-4 opacity-50">• Ctrl+B bold • Ctrl+I italic • Ctrl+H horizontal rule</span>
      </div>
    </div>
  );
}

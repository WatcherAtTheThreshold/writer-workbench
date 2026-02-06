import React, { useState, useEffect, useRef } from 'react';

// Reusable 3D button styles
const btn3D = `relative px-4 py-2 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-700 dark:to-neutral-800
  border border-neutral-200 dark:border-neutral-600
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-neutral-100 active:to-neutral-200 dark:active:from-neutral-800 dark:active:to-neutral-900`;

const btn3DBlue = `relative px-4 py-2 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700
  border border-blue-600 dark:border-blue-500
  text-white
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-blue-600 active:to-blue-700`;

const btn3DRed = `relative px-4 py-2 rounded-lg font-medium transition-all duration-150 ease-out
  bg-gradient-to-b from-red-500 to-red-600 dark:from-red-600 dark:to-red-700
  border border-red-600 dark:border-red-500
  text-white
  shadow-sm hover:shadow-md hover:-translate-y-0.5
  active:shadow-inner active:translate-y-0 active:from-red-600 active:to-red-700`;

const TopHighlight = ({ light }) => (
  <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${light ? 'via-white/40' : 'via-white/60 dark:via-white/20'} to-transparent rounded-t-lg pointer-events-none`} />
);

// Prompt Modal - for text input
export function PromptModal({ isOpen, title, message, defaultValue = '', placeholder = '', onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="relative max-w-md w-full m-4 rounded-xl
          bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
          border border-neutral-200 dark:border-neutral-700
          shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent rounded-t-xl" />

        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          {message && <p className="text-sm opacity-70 mt-1">{message}</p>}
        </div>

        {/* Content */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg
              bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950
              border border-neutral-300 dark:border-neutral-600
              shadow-inner
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400
              text-base"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <button onClick={onCancel} className={btn3D}>
            <TopHighlight />
            Cancel
          </button>
          <button onClick={() => onConfirm(value)} className={btn3DBlue}>
            <TopHighlight light />
            OK
          </button>
        </div>

        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent rounded-b-xl" />
      </div>
    </div>
  );
}

// Confirm Modal - for yes/no questions
export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="relative max-w-md w-full m-4 rounded-xl
          bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
          border border-neutral-200 dark:border-neutral-700
          shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent rounded-t-xl" />

        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-base">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <button onClick={onCancel} className={btn3D}>
            <TopHighlight />
            {cancelText}
          </button>
          <button onClick={onConfirm} className={danger ? btn3DRed : btn3DBlue}>
            <TopHighlight light />
            {confirmText}
          </button>
        </div>

        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent rounded-b-xl" />
      </div>
    </div>
  );
}

// Alert Modal - for messages
export function AlertModal({ isOpen, title, message, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="relative max-w-md w-full m-4 rounded-xl
          bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900
          border border-neutral-200 dark:border-neutral-700
          shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent rounded-t-xl" />

        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-base">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <button onClick={onClose} className={btn3DBlue}>
            <TopHighlight light />
            OK
          </button>
        </div>

        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-black/30 to-transparent rounded-b-xl" />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { getTTS, isTTSSupported } from '../utils/tts';

export default function TTSControls({ text, onHighlight, compact = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const tts = isTTSSupported() ? getTTS() : null;

  // Load voices
  useEffect(() => {
    if (!tts) return;

    const loadVoices = () => {
      const availableVoices = tts.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Prefer English voices
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
        tts.setVoice(defaultVoice.name);
      }
    };

    loadVoices();
    // Voices may load asynchronously
    const interval = setInterval(() => {
      if (tts.getVoices().length > voices.length) {
        loadVoices();
      }
    }, 100);

    setTimeout(() => clearInterval(interval), 2000);
    return () => clearInterval(interval);
  }, [tts]);

  // Set up TTS callbacks
  useEffect(() => {
    if (!tts) return;

    tts.onStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    tts.onEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (onHighlight) onHighlight(null);
    };

    tts.onBoundary = (charIndex, charLength, cleanText) => {
      if (onHighlight) {
        const sentenceInfo = tts.findCurrentSentence(cleanText, charIndex);
        if (sentenceInfo) {
          onHighlight(sentenceInfo);
        }
      }
    };

    return () => {
      tts.onStart = null;
      tts.onEnd = null;
      tts.onBoundary = null;
    };
  }, [tts, onHighlight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tts) tts.stop();
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (!tts || !text) return;

    if (isPaused) {
      tts.resume();
      setIsPaused(false);
    } else if (!isPlaying) {
      tts.speak(text);
    }
  }, [tts, text, isPaused, isPlaying]);

  const handlePause = useCallback(() => {
    if (!tts) return;
    tts.pause();
    setIsPaused(true);
  }, [tts]);

  const handleStop = useCallback(() => {
    if (!tts) return;
    tts.stop();
    setIsPlaying(false);
    setIsPaused(false);
    if (onHighlight) onHighlight(null);
  }, [tts, onHighlight]);

  const handleVoiceChange = useCallback((e) => {
    const voiceName = e.target.value;
    setSelectedVoice(voiceName);
    if (tts) tts.setVoice(voiceName);
  }, [tts]);

  const handleRateChange = useCallback((e) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
    if (tts) tts.setRate(newRate);
  }, [tts]);

  if (!isTTSSupported()) {
    return (
      <div className="text-xs text-red-500 opacity-70">
        TTS not supported in this browser
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title="Read aloud"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={isPaused ? handlePlay : handlePause}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
      {/* Play/Pause button */}
      {!isPlaying ? (
        <button
          onClick={handlePlay}
          disabled={!text}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Read aloud"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          <span className="text-sm">Read Aloud</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={isPaused ? handlePlay : handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                <span className="text-sm">Resume</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
                <span className="text-sm">Pause</span>
              </>
            )}
          </button>
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" />
            </svg>
            <span className="text-sm">Stop</span>
          </button>
        </div>
      )}

      {/* Settings toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-1.5 rounded ${showSettings ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-neutral-100 dark:bg-neutral-800'} hover:bg-neutral-200 dark:hover:bg-neutral-700`}
        title="Voice settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-neutral-200 dark:border-neutral-700">
          {/* Voice selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs opacity-60">Voice:</label>
            <select
              value={selectedVoice}
              onChange={handleVoiceChange}
              className="text-sm rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 px-2 py-1"
            >
              {voices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs opacity-60">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={handleRateChange}
              className="w-20 h-1.5 rounded-lg appearance-none bg-neutral-300 dark:bg-neutral-600"
            />
            <span className="text-xs w-8">{rate.toFixed(1)}x</span>
          </div>
        </div>
      )}
    </div>
  );
}

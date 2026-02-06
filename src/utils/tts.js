// Text-to-Speech utilities using Web Speech API

class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.voices = [];
    this.currentVoice = null;
    this.rate = 1.0;
    this.isPaused = false;
    this.isPlaying = false;
    this.onBoundary = null; // Callback for word/sentence boundaries
    this.onEnd = null;
    this.onStart = null;
    this.currentCharIndex = 0;

    // Load voices (they load asynchronously in some browsers)
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
    // Try to set a default English voice
    if (!this.currentVoice && this.voices.length > 0) {
      // Prefer English voices
      const englishVoice = this.voices.find(v =>
        v.lang.startsWith('en') && v.localService
      ) || this.voices.find(v =>
        v.lang.startsWith('en')
      ) || this.voices[0];
      this.currentVoice = englishVoice;
    }
  }

  getVoices() {
    return this.voices;
  }

  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.currentVoice = voice;
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  speak(text, options = {}) {
    // Cancel any ongoing speech
    this.stop();

    if (!text || !text.trim()) return;

    // Strip markdown formatting for cleaner speech
    const cleanText = this.stripMarkdown(text);

    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance.voice = this.currentVoice;
    this.utterance.rate = this.rate;
    this.utterance.pitch = options.pitch || 1.0;

    // Event handlers
    this.utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (this.onStart) this.onStart();
    };

    this.utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentCharIndex = 0;
      if (this.onEnd) this.onEnd();
    };

    this.utterance.onerror = (event) => {
      console.error('TTS Error:', event.error);
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onEnd) this.onEnd();
    };

    this.utterance.onboundary = (event) => {
      this.currentCharIndex = event.charIndex;
      if (this.onBoundary) {
        this.onBoundary(event.charIndex, event.charLength, cleanText);
      }
    };

    this.synth.speak(this.utterance);
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentCharIndex = 0;
    this.utterance = null;
  }

  toggle() {
    if (this.isPaused) {
      this.resume();
    } else if (this.isPlaying) {
      this.pause();
    }
  }

  stripMarkdown(text) {
    return text
      // Remove headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove links but keep text
      .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[.*?\]\([^)]+\)/g, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // Find the sentence containing a character index
  findCurrentSentence(text, charIndex) {
    const sentences = this.splitIntoSentences(text);
    let currentPos = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentenceEnd = currentPos + sentences[i].length;
      if (charIndex >= currentPos && charIndex < sentenceEnd) {
        return {
          index: i,
          sentence: sentences[i],
          start: currentPos,
          end: sentenceEnd
        };
      }
      currentPos = sentenceEnd;
    }
    return null;
  }

  splitIntoSentences(text) {
    // Split on sentence-ending punctuation, keeping the punctuation
    return text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  }
}

// Singleton instance
let ttsInstance = null;

export function getTTS() {
  if (!ttsInstance) {
    ttsInstance = new TTSEngine();
  }
  return ttsInstance;
}

export function isTTSSupported() {
  return 'speechSynthesis' in window;
}

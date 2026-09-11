/**
 * Persian Text-to-Speech Service
 * Optimized for fa-IR with fallback support
 */

const STORAGE_KEY = 'mora-tts-enabled';

export interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: VoiceConfig = {
  rate: 1.08,
  pitch: 1.07,
  volume: 1.0,
  enabled: true,
};

// Persian punctuation patterns for splitting long text
const PERSIAN_SPLIT_PATTERN = /[.،؛!؟\n]+/;

class PersianTTS {
  private config: VoiceConfig;
  private speaking: boolean = false;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.initVoices();
  }

  private loadConfig(): VoiceConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, enabled: parsed.enabled ?? true };
      }
    } catch {
      // Ignore parse errors
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: this.config.enabled }));
    } catch {
      // Ignore storage errors
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;

      this.voicesLoaded = true;
      
      // Priority: fa-IR > fa > any Persian-like > default
      const persianVoices = voices.filter(v => 
        v.lang === 'fa-IR' || 
        v.lang === 'fa' || 
        v.lang.startsWith('fa-')
      );

      if (persianVoices.length > 0) {
        // Prefer neural/enhanced voices
        const neural = persianVoices.find(v => 
          v.name.toLowerCase().includes('neural') ||
          v.name.toLowerCase().includes('enhanced') ||
          v.name.toLowerCase().includes('premium')
        );
        this.selectedVoice = neural || persianVoices[0];
        console.log('[PersianTTS] Selected voice:', this.selectedVoice.name);
      } else {
        // Log warning - no Persian voice found
        console.warn('[PersianTTS] No Persian voice available. TTS will be limited.');
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voiceschanged event
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  /**
   * Check if TTS is supported in the browser
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Check if a Persian voice is available
   */
  hasPersianVoice(): boolean {
    return this.selectedVoice !== null;
  }

  /**
   * Get enabled state
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
    
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speaking;
  }

  /**
   * Subscribe to speaking state changes
   */
  onSpeakingChange(callback: (speaking: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.speaking));
  }

  private setSpeaking(value: boolean): void {
    if (this.speaking !== value) {
      this.speaking = value;
      this.notifyListeners();
    }
  }

  /**
   * Split long text into chunks for natural pauses
   */
  private splitText(text: string): string[] {
    if (text.length <= 180) return [text.trim()];

    const chunks: string[] = [];
    const parts = text.split(PERSIAN_SPLIT_PATTERN);
    let currentChunk = '';

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).length > 180) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk = currentChunk ? `${currentChunk}. ${trimmed}` : trimmed;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  /**
   * Speak text with Persian optimization
   */
  async speak(text: string): Promise<void> {
    if (!this.isSupported()) {
      console.warn('[PersianTTS] SpeechSynthesis not supported');
      return;
    }

    if (!this.config.enabled) {
      console.log('[PersianTTS] TTS is disabled');
      return;
    }

    if (!text.trim()) return;

    // Stop any current speech
    this.stop();

    const chunks = this.splitText(text);
    this.utteranceQueue = [];

    return new Promise((resolve) => {
      let completedCount = 0;

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        // Apply voice settings
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.lang = 'fa-IR';
        utterance.rate = this.config.rate;
        utterance.pitch = this.config.pitch;
        utterance.volume = this.config.volume;

        utterance.onstart = () => {
          this.setSpeaking(true);
        };

        utterance.onend = () => {
          completedCount++;
          if (completedCount === chunks.length) {
            this.setSpeaking(false);
            this.currentUtterance = null;
            resolve();
          }
        };

        utterance.onerror = (event) => {
          console.error('[PersianTTS] Speech error:', event.error);
          completedCount++;
          if (completedCount === chunks.length) {
            this.setSpeaking(false);
            this.currentUtterance = null;
            resolve();
          }
        };

        this.utteranceQueue.push(utterance);
      });

      // Start speaking the queue
      if (this.utteranceQueue.length > 0) {
        this.speakNext();
      } else {
        resolve();
      }
    });
  }

  private speakNext(): void {
    if (this.utteranceQueue.length === 0) return;

    const utterance = this.utteranceQueue.shift()!;
    this.currentUtterance = utterance;

    // Add small delay between chunks for natural pauses
    const originalOnEnd = utterance.onend;
    utterance.onend = (event) => {
      if (originalOnEnd) {
        (originalOnEnd as Function)(event);
      }
      
      if (this.utteranceQueue.length > 0) {
        setTimeout(() => this.speakNext(), 150);
      }
    };

    try {
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('[PersianTTS] Failed to speak:', error);
      this.setSpeaking(false);
    }
  }

  /**
   * Stop all speech
   */
  stop(): void {
    if (!this.isSupported()) return;

    try {
      speechSynthesis.cancel();
    } catch {
      // Ignore errors
    }

    this.utteranceQueue = [];
    this.currentUtterance = null;
    this.setSpeaking(false);
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (!this.isSupported()) return;
    try {
      speechSynthesis.pause();
    } catch {
      // Ignore errors
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (!this.isSupported()) return;
    try {
      speechSynthesis.resume();
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get current config
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
    if ('enabled' in updates) {
      this.saveConfig();
    }
  }
}

// Singleton instance
export const persianTTS = new PersianTTS();

// React hook for TTS
export function usePersianTTS() {
  return persianTTS;
}

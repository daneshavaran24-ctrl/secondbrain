/**
 * Porcupine Wake Word Models
 * 
 * IMPORTANT: These are placeholder values.
 * To use custom wake word:
 * 1. Go to https://console.picovoice.ai/ppn
 * 2. Create a custom wake word "hey mora" or "hi mora"
 * 3. Download the .ppn file for Web platform
 * 4. Convert to base64 and replace the placeholder below
 * 
 * For now, we'll use the built-in "Hey Google" or "Alexa" as fallback
 * until the custom model is created.
 */

// Placeholder - replace with actual base64 encoded .ppn file
export const HEY_MORA_MODEL_BASE64 = '';

// Built-in wake words available in Porcupine (as fallback)
export const BUILTIN_KEYWORDS = [
  'alexa',
  'americano', 
  'blueberry',
  'bumblebee',
  'computer',
  'grapefruit',
  'grasshopper',
  'hey google',
  'hey siri',
  'jarvis',
  'ok google',
  'picovoice',
  'porcupine',
  'terminator',
] as const;

export type BuiltinKeyword = typeof BUILTIN_KEYWORDS[number];

// Default fallback keyword (no longer needed - using custom "hey mora")
export const DEFAULT_BUILTIN_KEYWORD: BuiltinKeyword = 'computer';

// Custom wake word model path
export const HEY_MORA_MODEL_PATH = '/models/Hey-mora_en_wasm_v4_0_0.ppn';

/**
 * Check if custom model is available
 */
export function hasCustomModel(): boolean {
  return HEY_MORA_MODEL_BASE64.length > 0;
}

/**
 * Get model to use - custom or builtin
 */
export function getModelConfig(): {
  type: 'custom' | 'builtin';
  keyword?: BuiltinKeyword;
  customModel?: string;
} {
  if (hasCustomModel()) {
    return {
      type: 'custom',
      customModel: HEY_MORA_MODEL_BASE64,
    };
  }
  
  return {
    type: 'builtin',
    keyword: DEFAULT_BUILTIN_KEYWORD,
  };
}

/**
 * Cartesia TTS client — Riya (College Roommate, Standard Hindi / Indian)
 * Multilingual Indic: Hindi, Tamil, Telugu, Kannada, Marathi, Punjabi,
 * Odia, Urdu, Bengali, Gujarati, Malayalam (+ English).
 * Docs: https://docs.cartesia.ai
 */

const CARTESIA_API_KEY =
  import.meta.env.VITE_CARTESIA_API_KEY || 'sk_car_PPWhAgBTRFwe9bK1h2oRpD';

/** Riya — College Roommate (Standard Hindi, feminine, India) */
export const CARTESIA_RIYA_VOICE_ID = 'faf0731e-dfb9-4cfc-8119-259a79b27e12';

/** @deprecated kept for compatibility — aliases to Riya */
export const CARTESIA_DANIEL_VOICE_ID = CARTESIA_RIYA_VOICE_ID;

/** Sonic model (multilingual Indic-capable) */
export const CARTESIA_MODEL_ID = 'sonic-3';

/** Confidence / quality threshold (0–1) — same jury benchmark */
export const CARTESIA_QUALITY_THRESHOLD = 0.8;

const CARTESIA_VERSION = '2025-04-16';
const TTS_BYTES_URL = 'https://api.cartesia.ai/tts/bytes';

/** Supported care-plan voice languages (Cartesia language codes) */
export type CartesiaLanguageCode =
  | 'hi'
  | 'ta'
  | 'te'
  | 'kn'
  | 'mr'
  | 'pa'
  | 'or'
  | 'ur'
  | 'bn'
  | 'gu'
  | 'ml'
  | 'en';

export interface VoiceLanguageOption {
  code: CartesiaLanguageCode;
  label: string;
  nativeLabel: string;
}

export const INDIC_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'en', label: 'English (India)', nativeLabel: 'English' },
];

export function isCartesiaConfigured(): boolean {
  return Boolean(CARTESIA_API_KEY && CARTESIA_API_KEY.startsWith('sk_car_'));
}

export interface SynthesizeOptions {
  modelId?: string;
  voiceId?: string;
  /** ISO-ish language code for Indic TTS (default hi) */
  language?: CartesiaLanguageCode;
}

/**
 * Generate speech with Cartesia Riya voice and return a playable Blob (WAV).
 */
export async function synthesizeSpeech(
  transcript: string,
  options?: SynthesizeOptions
): Promise<Blob> {
  if (!isCartesiaConfigured()) {
    throw new Error('Cartesia API key is not configured.');
  }

  const language = options?.language || 'hi';

  const body = {
    model_id: options?.modelId || CARTESIA_MODEL_ID,
    transcript: transcript.slice(0, 4000),
    voice: {
      mode: 'id' as const,
      id: options?.voiceId || CARTESIA_RIYA_VOICE_ID,
    },
    output_format: {
      container: 'wav' as const,
      encoding: 'pcm_s16le' as const,
      sample_rate: 44100,
    },
    language,
  };

  const res = await fetch(TTS_BYTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cartesia-Version': CARTESIA_VERSION,
      'X-API-Key': CARTESIA_API_KEY,
      Authorization: `Bearer ${CARTESIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Cartesia TTS failed (${res.status}): ${errText || res.statusText}`
    );
  }

  return res.blob();
}

/**
 * Play transcript with Riya (Indic) voice.
 * Returns a cleanup function to stop playback.
 */
export async function playWithRiya(
  transcript: string,
  language: CartesiaLanguageCode = 'hi',
  onEnded?: () => void
): Promise<() => void> {
  const blob = await synthesizeSpeech(transcript, { language });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  const cleanup = () => {
    audio.pause();
    audio.src = '';
    URL.revokeObjectURL(url);
  };

  audio.onended = () => {
    cleanup();
    onEnded?.();
  };
  audio.onerror = () => {
    cleanup();
    onEnded?.();
  };

  await audio.play();
  return cleanup;
}

/** @deprecated use playWithRiya */
export async function playWithDaniel(
  transcript: string,
  onEnded?: () => void
): Promise<() => void> {
  return playWithRiya(transcript, 'hi', onEnded);
}

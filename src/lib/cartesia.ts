/**
 * Cartesia TTS client — Riya (College Roommate, Standard Hindi / Indian)
 * Calls the server-side /api/tts endpoint so no API key is ever exposed to the browser.
 * Multilingual Indic: Hindi, Tamil, Telugu, Kannada, Marathi, Punjabi,
 * Odia, Urdu, Bengali, Gujarati, Malayalam (+ English).
 */

/** Riya — College Roommate (Standard Hindi, feminine, India) */
export const CARTESIA_RIYA_VOICE_ID = 'faf0731e-dfb9-4cfc-8119-259a79b27e12';

/** @deprecated kept for compatibility — aliases to Riya */
export const CARTESIA_DANIEL_VOICE_ID = CARTESIA_RIYA_VOICE_ID;

/** Sonic model (multilingual Indic-capable) */
export const CARTESIA_MODEL_ID = 'sonic-3';

const TTS_PROXY_URL = '/api/tts';

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

export interface SynthesizeOptions {
  modelId?: string;
  voiceId?: string;
  /** ISO-ish language code for Indic TTS (default hi) */
  language?: CartesiaLanguageCode;
}

/**
 * Request speech from the /api/tts serverless function and return a playable Blob (WAV).
 */
export async function synthesizeSpeech(
  transcript: string,
  options?: SynthesizeOptions
): Promise<Blob> {
  const language = options?.language || 'hi';

  const res = await fetch(TTS_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: transcript.slice(0, 4000),
      language,
      voiceId: options?.voiceId || CARTESIA_RIYA_VOICE_ID,
      modelId: options?.modelId || CARTESIA_MODEL_ID,
    }),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
      }
    }
    throw new Error(
      `TTS requires server (vercel dev / production) with CARTESIA_API_KEY configured (HTTP ${res.status}).`
    );
  }

  return res.blob();
}

/**
 * Play transcript with Riya (Indic) voice via /api/tts.
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

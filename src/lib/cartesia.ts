/**
 * Cartesia TTS client — Daniel (Modern Assistant) voice
 * Docs: https://docs.cartesia.ai
 */

const CARTESIA_API_KEY =
  import.meta.env.VITE_CARTESIA_API_KEY || 'sk_car_PPWhAgBTRFwe9bK1h2oRpD';

/** Daniel — Modern Assistant (General American, masculine) */
export const CARTESIA_DANIEL_VOICE_ID = '47c38ca4-5f35-497b-b1a3-415245fb35e1';

/** Recommended Sonic model for production TTS */
export const CARTESIA_MODEL_ID = 'sonic-3';

/** Confidence / quality threshold used for Cartesia-related checks (0–1) */
export const CARTESIA_QUALITY_THRESHOLD = 0.8;

const CARTESIA_VERSION = '2025-04-16';
const TTS_BYTES_URL = 'https://api.cartesia.ai/tts/bytes';

export function isCartesiaConfigured(): boolean {
  return Boolean(CARTESIA_API_KEY && CARTESIA_API_KEY.startsWith('sk_car_'));
}

/**
 * Generate speech with Cartesia Daniel voice and return a playable Blob (WAV).
 */
export async function synthesizeSpeech(
  transcript: string,
  options?: { modelId?: string; voiceId?: string }
): Promise<Blob> {
  if (!isCartesiaConfigured()) {
    throw new Error('Cartesia API key is not configured.');
  }

  const body = {
    model_id: options?.modelId || CARTESIA_MODEL_ID,
    transcript: transcript.slice(0, 4000), // keep request size reasonable
    voice: {
      mode: 'id' as const,
      id: options?.voiceId || CARTESIA_DANIEL_VOICE_ID,
    },
    output_format: {
      container: 'wav' as const,
      encoding: 'pcm_s16le' as const,
      sample_rate: 44100,
    },
    language: 'en',
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
 * Play transcript with Daniel voice. Returns a cleanup function to stop playback.
 */
export async function playWithDaniel(
  transcript: string,
  onEnded?: () => void
): Promise<() => void> {
  const blob = await synthesizeSpeech(transcript);
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

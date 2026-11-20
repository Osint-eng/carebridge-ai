const CARTESIA_VERSION = '2025-04-16';
const TTS_BYTES_URL = 'https://api.cartesia.ai/tts/bytes';
const DEFAULT_VOICE_ID = 'faf0731e-dfb9-4cfc-8119-259a79b27e12'; // Riya
const DEFAULT_MODEL_ID = 'sonic-3';

const ALLOWED_LANGUAGES = new Set([
  'hi',
  'ta',
  'te',
  'kn',
  'mr',
  'pa',
  'or',
  'ur',
  'bn',
  'gu',
  'ml',
  'en',
]);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Audio synthesis is unavailable: CARTESIA_API_KEY is not configured on the server.',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
  }

  const rawText = typeof body?.text === 'string' ? body.text : body?.transcript;
  const text = typeof rawText === 'string' ? rawText.trim().slice(0, 4000) : '';
  if (!text) {
    return res.status(400).json({ error: 'Missing required "text" field.' });
  }

  const language =
    typeof body?.language === 'string' && ALLOWED_LANGUAGES.has(body.language)
      ? body.language
      : 'hi';

  const voiceId =
    typeof body?.voiceId === 'string' && body.voiceId.trim()
      ? body.voiceId.trim()
      : DEFAULT_VOICE_ID;

  const modelId =
    typeof body?.modelId === 'string' && body.modelId.trim()
      ? body.modelId.trim()
      : DEFAULT_MODEL_ID;

  try {
    const upstream = await fetch(TTS_BYTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cartesia-Version': CARTESIA_VERSION,
        'X-API-Key': apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_id: modelId,
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId,
        },
        output_format: {
          container: 'wav',
          encoding: 'pcm_s16le',
          sample_rate: 44100,
        },
        language,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({
        error: `Cartesia TTS failed (${upstream.status}): ${errText || upstream.statusText}`,
      });
    }

    const audioBuffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (err: any) {
    return res.status(502).json({
      error: err?.message || 'Failed to reach Cartesia TTS service.',
    });
  }
}

import React, { useRef, useState } from 'react';
import { useDocuments } from '@/context/DocumentContext';
import { Canvas } from '@react-three/fiber';
import { AudioOrb3D } from '@/components/3d/AudioOrb3D';
import { CameraRig } from '@/components/3d/CameraRig';
import { Play, Square, Loader2 } from 'lucide-react';
import {
  playWithDaniel,
  isCartesiaConfigured,
  CARTESIA_QUALITY_THRESHOLD,
  CARTESIA_DANIEL_VOICE_ID,
  CARTESIA_MODEL_ID,
} from '@/lib/cartesia';

export const AudioPage: React.FC = () => {
  const { currentDoc } = useDocuments();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const handlePlay = async () => {
    if (!currentDoc?.carePlan) return;
    setError(null);

    if (!isCartesiaConfigured()) {
      setError('Cartesia API key is missing. Set VITE_CARTESIA_API_KEY.');
      return;
    }

    const text =
      currentDoc.carePlan.patientFriendlySummary +
      '. Medications: ' +
      currentDoc.carePlan.medications
        .map((m) => `${m.name}, ${m.dose}, ${m.frequency}`)
        .join('. ');

    setLoading(true);
    setPlaying(true);

    try {
      // Stop any previous playback
      stopRef.current?.();
      stopRef.current = null;

      const stop = await playWithDaniel(text, () => {
        setPlaying(false);
        stopRef.current = null;
      });
      stopRef.current = stop;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(message);
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
    setLoading(false);
  };

  if (!currentDoc?.carePlan) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audio Care Plan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Listen with Cartesia Daniel (Modern Assistant) · quality threshold {CARTESIA_QUALITY_THRESHOLD}
        </p>
      </div>

      <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <CameraRig intensity={0.2} fixedZ={5} />
          <AudioOrb3D isPlaying={playing} />
        </Canvas>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Voice:</span> Daniel ·{' '}
          {CARTESIA_DANIEL_VOICE_ID.slice(0, 8)}…
        </p>
        <p>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Model:</span> {CARTESIA_MODEL_ID}
        </p>
        <p>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Threshold:</span>{' '}
          {CARTESIA_QUALITY_THRESHOLD} (pass only when quality ≥ this value)
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={handlePlay}
          disabled={playing || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Play (Daniel)'}
        </button>
        <button
          onClick={handleStop}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-sm font-semibold rounded-lg"
        >
          <Square className="w-4 h-4" /> Stop
        </button>
      </div>
    </div>
  );
};

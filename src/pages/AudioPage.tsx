import React, { useState } from 'react';
import { useDocuments } from '@/context/DocumentContext';
import { Canvas } from '@react-three/fiber';
import { AudioOrb3D } from '@/components/3d/AudioOrb3D';
import { CameraRig } from '@/components/3d/CameraRig';
import { Play, Square } from 'lucide-react';

export const AudioPage: React.FC = () => {
  const { currentDoc } = useDocuments();
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (!currentDoc?.carePlan) return;
    const text = currentDoc.carePlan.patientFriendlySummary +
      '. Medications: ' +
      currentDoc.carePlan.medications.map((m) => `${m.name}, ${m.dose}, ${m.frequency}`).join('. ');
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => setPlaying(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    setPlaying(true);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setPlaying(false);
  };

  if (!currentDoc?.carePlan) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audio Care Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Listen to your care plan</p>
      </div>

      <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <CameraRig intensity={0.2} fixedZ={5} />
          <AudioOrb3D isPlaying={playing} />
        </Canvas>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={handlePlay} disabled={playing}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          <Play className="w-4 h-4" /> Play
        </button>
        <button onClick={handleStop}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-sm font-semibold rounded-lg">
          <Square className="w-4 h-4" /> Stop
        </button>
      </div>
    </div>
  );
};

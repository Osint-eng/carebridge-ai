import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { Canvas } from '@react-three/fiber';
import { VerificationScanner3D } from '@/components/3d/VerificationScanner3D';
import { CameraRig } from '@/components/3d/CameraRig';

export const FaithfulnessPage: React.FC = () => {
  const { currentDoc, runFaithfulnessCheck, isProcessing, processingStage } = useDocument();

  const handleCheck = async (injectError = false) => {
    if (!currentDoc) return;
    await runFaithfulnessCheck(currentDoc.id, injectError);
  };

  const status = currentDoc?.faithfulnessReport?.overallStatus === 'VERIFIED'
    ? 'VERIFIED'
    : currentDoc?.faithfulnessReport?.overallStatus === 'VALIDATION_FAILED'
    ? 'VALIDATION_FAILED'
    : 'SCANNING';

  if (!currentDoc) {
    return <div className="text-center py-20 text-slate-500">No document loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faithfulness Audit</h1>
        <p className="text-sm text-slate-500 mt-1">Verify every instruction against the original document</p>
      </div>

      <div className="h-72 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <CameraRig intensity={0.15} fixedZ={6} />
          <VerificationScanner3D status={status} />
        </Canvas>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => handleCheck(false)} disabled={isProcessing || !currentDoc.carePlan}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          Run Faithfulness Check
        </button>
        <button onClick={() => handleCheck(true)} disabled={isProcessing || !currentDoc.carePlan}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          Inject Test Dosage Error
        </button>
      </div>

      {currentDoc.faithfulnessReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-lg font-semibold">
            Score: {currentDoc.faithfulnessReport.scorePercentage}% — {currentDoc.faithfulnessReport.overallStatus}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {currentDoc.faithfulnessReport.checksPassed}/{currentDoc.faithfulnessReport.checksTotal} checks passed
          </p>
        </div>
      )}
    </div>
  );
};

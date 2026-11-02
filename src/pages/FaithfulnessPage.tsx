import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { VerificationScanner3D } from '@/components/3d/VerificationScanner3D';
import { CameraRig } from '@/components/3d/CameraRig';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const FAITHFULNESS_THRESHOLD = 0.8; // 80% — same as clinical validation

export const FaithfulnessPage: React.FC = () => {
  const { currentDoc, runFaithfulnessCheck, isProcessing, processingStage } = useDocument();
  const navigate = useNavigate();

  const handleCheck = async (injectError = false) => {
    if (!currentDoc) return;
    await runFaithfulnessCheck(currentDoc.id, injectError);
  };

  const report = currentDoc?.faithfulnessReport;
  const scoreRatio = report ? report.scorePercentage / 100 : 0;
  const isVerified = report?.overallStatus === 'VERIFIED';
  const isFailed = report?.overallStatus === 'VALIDATION_FAILED';

  const status: 'VERIFIED' | 'VALIDATION_FAILED' | 'SCANNING' =
    isVerified ? 'VERIFIED' : isFailed ? 'VALIDATION_FAILED' : 'SCANNING';

  if (!currentDoc) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">No document loaded.</p>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  if (!currentDoc.carePlan) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Generate a care plan first before running the faithfulness audit.</p>
        <button
          onClick={() => navigate('/care-plan')}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          Go to Care Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Faithfulness Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every instruction is checked against the original discharge summary. Pass threshold:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">0.8 (80%)</span>
          </p>
        </div>

        {report && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              isVerified
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
            }`}
          >
            {isVerified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isVerified ? 'VERIFIED' : 'VALIDATION FAILED'}
          </div>
        )}
      </div>

      {/* 3D Scanner */}
      <div className="h-64 sm:h-72 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <CameraRig intensity={0.15} fixedZ={6} />
          <VerificationScanner3D status={status} />
        </Canvas>
      </div>

      {/* Processing banner */}
      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          {processingStage || 'Running faithfulness audit...'}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleCheck(false)}
          disabled={isProcessing}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          Run Faithfulness Check
        </button>
        <button
          onClick={() => handleCheck(true)}
          disabled={isProcessing}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Inject Test Dosage Error
        </button>
      </div>

      {/* Score card */}
      {report && (
        <div
          className={`rounded-xl border p-6 ${
            isVerified
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-3xl font-bold tracking-tight">
                {report.scorePercentage}%
                <span className="text-base font-normal text-slate-500 ml-2">
                  / 100 (threshold 80%)
                </span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {report.checksPassed}/{report.checksTotal} checks passed
                {scoreRatio >= FAITHFULNESS_THRESHOLD
                  ? ' — meets clinical safety threshold'
                  : ' — below clinical safety threshold'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-slate-500">Overall Status</p>
              <p
                className={`text-lg font-bold ${
                  isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {report.overallStatus.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isVerified ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, report.scorePercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span className="font-medium text-emerald-600">80% threshold</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Mismatches */}
      {report && report.mismatches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-950/30">
            <h2 className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Mismatches ({report.mismatches.length})
            </h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {report.mismatches.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {m.category}: {m.itemName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{m.explanation}</p>
                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-400">Source:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{m.sourceText || '—'}</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/40 rounded px-2 py-1.5">
                        <span className="text-red-400">Care plan:</span>{' '}
                        <span className="text-red-700 dark:text-red-300">{m.carePlanText}</span>
                      </div>
                    </div>
                  </div>
                  {m.isFatal && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded">
                      Fatal
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category scores */}
      {report && report.categoryScores.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Category Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {report.categoryScores.map((c) => (
              <div
                key={c.category}
                className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center justify-between ${
                  c.passed
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                <span>{c.category}</span>
                <span>{c.passed ? '✓' : '✗'} {c.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {report && isVerified && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/fridge-sheet')}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            Continue to Fridge Sheet
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

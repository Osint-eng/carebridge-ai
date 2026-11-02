import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react';

export const CarePlanPage: React.FC = () => {
  const { currentDoc, generateCarePlan, isProcessing, processingStage } = useDocument();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!currentDoc) return;
    await generateCarePlan(currentDoc.id);
  };

  const handleContinue = () => {
    navigate('/faithfulness');
  };

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

  const hasExtraction =
    (currentDoc.extractedData?.medications?.length ?? 0) > 0 || currentDoc.status === 'Validated';

  if (!hasExtraction) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">Run extraction first before generating a care plan.</p>
        <button
          onClick={() => navigate('/extraction')}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          Go to Extraction
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-sky-500" />
          Care Plan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Patient-friendly care plan built only from source data (no invented instructions).
        </p>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          {processingStage || 'Generating care plan...'}
        </div>
      )}

      {!currentDoc.carePlan ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Generate a structured, patient-friendly care plan from the extracted clinical data.
            All doses, frequencies and warnings come directly from the source document.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            Generate Care Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Patient Summary</h2>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  currentDoc.carePlan.status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : currentDoc.carePlan.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                {currentDoc.carePlan.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentDoc.carePlan.patientFriendlySummary}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3">
              Medications ({currentDoc.carePlan.medications.length})
            </h2>
            <ul className="space-y-2">
              {currentDoc.carePlan.medications.map((m) => (
                <li
                  key={m.id}
                  className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
                >
                  <span className="font-medium text-slate-900 dark:text-white">{m.name}</span>
                  <span className="text-slate-500"> — {m.dose}, {m.frequency}, {m.route}</span>
                  {m.duration && m.duration !== 'as prescribed' && (
                    <span className="text-slate-400"> · {m.duration}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {(currentDoc.carePlan.warningSigns?.length ?? 0) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Warning Signs</h2>
              <ul className="space-y-1">
                {currentDoc.carePlan.warningSigns.map((w) => (
                  <li key={w.id} className="text-sm text-amber-900 dark:text-amber-200">
                    • {w.sign}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-lg disabled:opacity-50"
            >
              Re-generate
            </button>
            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Run Faithfulness Audit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

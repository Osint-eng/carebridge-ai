import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileSearch } from 'lucide-react';

export const ExtractionPage: React.FC = () => {
  const { currentDoc, runExtraction, isProcessing, processingStage } = useDocument();
  const navigate = useNavigate();

  const handleExtract = async () => {
    if (!currentDoc) return;
    await runExtraction(currentDoc.id);
    // Stay on page so user can review, then continue
  };

  const handleContinue = () => {
    navigate('/care-plan');
  };

  if (!currentDoc) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-500">No document loaded. Please upload one first.</p>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const hasMeds = (currentDoc.extractedData?.medications?.length ?? 0) > 0;
  const alreadyExtracted = hasMeds || currentDoc.status === 'Validated';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-sky-500" />
          Extraction
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Extract medications, warnings, diet, activity and follow-ups from the source document.
        </p>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          {processingStage || 'Extracting...'}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentDoc.fileName}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {currentDoc.status}
          </span>
        </div>

        <pre className="text-xs text-slate-600 dark:text-slate-400 max-h-52 overflow-auto whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          {currentDoc.extractedData?.rawText?.slice(0, 1800) || 'No text available'}
          {(currentDoc.extractedData?.rawText?.length ?? 0) > 1800 ? '\n\n… (truncated)' : ''}
        </pre>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleExtract}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {alreadyExtracted ? 'Re-run Extraction' : 'Run Extraction'}
          </button>

          {alreadyExtracted && (
            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              Continue to Care Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {hasMeds && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">
            Extracted Medications ({currentDoc.extractedData!.medications.length})
          </h2>
          <ul className="space-y-2">
            {currentDoc.extractedData!.medications.map((m) => (
              <li
                key={m.id}
                className="text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-slate-500"> — {m.dose} · {m.frequency} · {m.route}</span>
              </li>
            ))}
          </ul>

          {(currentDoc.extractedData?.warningSigns?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Warning Signs</h3>
              <ul className="space-y-1">
                {currentDoc.extractedData!.warningSigns.map((w) => (
                  <li key={w.id} className="text-sm text-slate-600 dark:text-slate-400">
                    • {w.sign}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useDocuments } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';

export const ExtractionPage: React.FC = () => {
  const { currentDoc, runExtraction, isProcessing, processingStage } = useDocuments();
  const navigate = useNavigate();

  const handleExtract = async () => {
    if (!currentDoc) return;
    await runExtraction(currentDoc.id);
    navigate('/care-plan');
  };

  if (!currentDoc) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">No document loaded. Please upload one first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Extraction</h1>
        <p className="text-sm text-slate-500 mt-1">AI extraction of medications, warnings, and follow-ups</p>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage || 'Extracting...'}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{currentDoc.fileName}</p>
        <pre className="text-xs text-slate-600 dark:text-slate-400 max-h-60 overflow-auto whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          {currentDoc.extractedData?.rawText?.slice(0, 1500) || 'No text'}
        </pre>
        <button onClick={handleExtract} disabled={isProcessing}
          className="mt-4 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          Run Extraction
        </button>
      </div>

      {currentDoc.extractedData?.medications && currentDoc.extractedData.medications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">Extracted Medications</h2>
          <ul className="space-y-2">
            {currentDoc.extractedData.medications.map((m) => (
              <li key={m.id} className="text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-medium">{m.name}</span> — {m.dose} {m.frequency} ({m.route})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

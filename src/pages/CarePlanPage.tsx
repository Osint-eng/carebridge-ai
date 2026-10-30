import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';

export const CarePlanPage: React.FC = () => {
  const { currentDoc, generateCarePlan, isProcessing, processingStage } = useDocument();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!currentDoc) return;
    await generateCarePlan(currentDoc.id);
    navigate('/faithfulness');
  };

  if (!currentDoc) {
    return <div className="text-center py-20 text-slate-500">No document loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Care Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Patient-friendly care plan generated from source</p>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage}
        </div>
      )}

      {!currentDoc.carePlan ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Generate a patient-friendly care plan from the extracted data.</p>
          <button onClick={handleGenerate} disabled={isProcessing || !currentDoc.extractedData}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            Generate Care Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">{currentDoc.carePlan.patientFriendlySummary}</p>
            <p className="text-xs text-amber-600 mt-2">Status: {currentDoc.carePlan.status}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3">Medications</h2>
            <ul className="space-y-2">
              {currentDoc.carePlan.medications.map((m) => (
                <li key={m.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-medium">{m.name}</span> — {m.dose}, {m.frequency}, {m.route}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

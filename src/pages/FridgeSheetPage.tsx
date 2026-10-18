import React from 'react';
import { useDocuments } from '@/context/DocumentContext';

export const FridgeSheetPage: React.FC = () => {
  const { currentDoc } = useDocuments();

  if (!currentDoc?.carePlan) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan first.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fridge Sheet</h1>
          <p className="text-sm text-slate-500 mt-1">Printable high-contrast family care sheet</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg print:hidden">
          Print / Save PDF
        </button>
      </div>

      <div id="fridge-sheet-printable" className="bg-white border-2 border-slate-800 rounded-xl p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-4">CareBridge — Fridge Sheet</h2>
        <p className="text-sm text-center text-slate-600 mb-6">{currentDoc.fileName}</p>

        <h3 className="font-bold text-sm uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-3">Medications</h3>
        <ul className="space-y-2 mb-6">
          {currentDoc.carePlan.medications.map((m) => (
            <li key={m.id} className="text-sm">
              <strong>{m.name}</strong> — {m.dose}, {m.frequency}, {m.route}
            </li>
          ))}
        </ul>

        {currentDoc.carePlan.warningSigns.length > 0 && (
          <>
            <h3 className="font-bold text-sm uppercase tracking-wide border-b-2 border-red-600 text-red-700 pb-1 mb-3">Warning Signs</h3>
            <ul className="space-y-1 mb-6">
              {currentDoc.carePlan.warningSigns.map((w) => (
                <li key={w.id} className="text-sm text-red-800">{w.sign} → {w.actionRequired}</li>
              ))}
            </ul>
          </>
        )}

        {currentDoc.carePlan.dietInstructions.length > 0 && (
          <>
            <h3 className="font-bold text-sm uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-3">Diet</h3>
            <ul className="space-y-1">
              {currentDoc.carePlan.dietInstructions.map((d, i) => (
                <li key={i} className="text-sm">{d}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

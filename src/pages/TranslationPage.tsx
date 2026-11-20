import React, { useState } from 'react';
import { useDocument } from '@/context/DocumentContext';
import type { TranslatedCarePlan } from '@/types';

export const TranslationPage: React.FC = () => {
  const { currentDoc, translateCarePlan, isProcessing } = useDocument();
  const [lang, setLang] = useState<'Telugu' | 'English' | 'Hindi'>('Telugu');
  const [result, setResult] = useState<TranslatedCarePlan | null>(null);

  const handleTranslate = async () => {
    if (!currentDoc) return;
    const t = await translateCarePlan(currentDoc.id, lang);
    setResult(t);
  };

  if (!currentDoc?.carePlan) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan first.</div>;
  }

  const statusColor =
    result?.translationFaithfulnessStatus === 'Verified'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Multilingual Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Translate care plan while preserving dosages</p>
      </div>

      <div className="flex gap-3 items-center">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'Telugu' | 'English' | 'Hindi')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="Telugu">Telugu</option>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
        </select>
        <button
          onClick={handleTranslate}
          disabled={isProcessing}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          Translate
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2">
          <p className="text-sm font-medium">{result.languageNativeName} Translation</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{result.patientFriendlySummary}</p>
          <p className={`text-xs font-semibold ${statusColor}`}>
            Status: {result.translationFaithfulnessStatus}
          </p>
          {result.translationFaithfulnessStatus === 'Partial' && (
            <p className="text-xs text-slate-500">
              Only the overview summary is translated into Hindi; medication names, doses, warnings, and follow-ups remain in English and require review before clinical use.
            </p>
          )}
          {result.translationFaithfulnessStatus === 'Needs review' && (
            <p className="text-xs text-slate-500">
              Offline {result.language} translation dictionary is not yet available; showing original English plan items.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useDocuments } from '@/context/DocumentContext';

export const TranslationPage: React.FC = () => {
  const { currentDoc, translateCarePlan, isProcessing } = useDocuments();
  const [lang, setLang] = useState<'Telugu' | 'English' | 'Hindi'>('Telugu');
  const [result, setResult] = useState<any>(null);

  const handleTranslate = async () => {
    if (!currentDoc) return;
    const t = await translateCarePlan(currentDoc.id, lang);
    setResult(t);
  };

  if (!currentDoc?.carePlan) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Multilingual Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Translate care plan while preserving dosages</p>
      </div>

      <div className="flex gap-3 items-center">
        <select value={lang} onChange={(e) => setLang(e.target.value as any)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm">
          <option value="Telugu">Telugu</option>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
        </select>
        <button onClick={handleTranslate} disabled={isProcessing}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          Translate
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-sm font-medium mb-2">{result.languageNativeName} Translation</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{result.patientFriendlySummary}</p>
          <p className="text-xs text-emerald-600 mt-2">Status: {result.translationFaithfulnessStatus}</p>
        </div>
      )}
    </div>
  );
};

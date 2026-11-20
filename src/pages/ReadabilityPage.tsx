import React, { useMemo } from 'react';
import { useDocument } from '@/context/DocumentContext';

export const ReadabilityPage: React.FC = () => {
  const { currentDoc, calculateReadability } = useDocument();

  const metrics = useMemo(() => {
    if (!currentDoc) return null;
    return calculateReadability(currentDoc.id);
  }, [currentDoc, calculateReadability]);

  if (!currentDoc) {
    return <div className="text-center py-20 text-slate-500">No document loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Readability Score</h1>
        <p className="text-sm text-slate-500 mt-1">
          Flesch-Kincaid score calculated from words, sentences, and syllables in your{' '}
          {currentDoc.carePlan ? 'care plan' : 'uploaded document'} (target: Grade 8 or easier).
        </p>
      </div>

      {metrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">Flesch-Kincaid Grade</p>
            <p className="text-3xl font-bold text-sky-600">{metrics.fleschKincaidGradeLevel}</p>
            <p className="text-xs text-slate-400 mt-1">
              {metrics.totalWords === 0
                ? 'No text to score'
                : metrics.targetAchieved
                ? 'Target achieved (≤ 8.0)'
                : 'Above Grade 8 target'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">Reading Ease</p>
            <p className="text-3xl font-bold text-emerald-600">{metrics.readingEaseScore}</p>
            <p className="text-xs text-slate-400 mt-1">0–100 scale (higher is easier)</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">Total Words</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.totalWords}</p>
            <p className="text-xs text-slate-400 mt-1">
              Avg {metrics.averageSentenceLength} words/sentence
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">Complex Words (≥3 syllables)</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white">
              {metrics.complexWordCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">{metrics.complexWordPercentage}% of words</p>
          </div>
        </div>
      )}
    </div>
  );
};

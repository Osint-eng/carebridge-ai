import React from 'react';
import { useDocuments } from '@/context/DocumentContext';

export const AnalyticsPage: React.FC = () => {
  const { documents } = useDocuments();
  const verified = documents.filter((d) => d.faithfulnessReport?.overallStatus === 'VERIFIED').length;
  const failed = documents.filter((d) => d.faithfulnessReport?.overallStatus === 'VALIDATION_FAILED').length;
  const avgScore = documents.length
    ? Math.round(documents.reduce((s, d) => s + (d.faithfulnessScore || 0), 0) / documents.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quality Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Pipeline and faithfulness metrics</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500">Total Documents</p>
          <p className="text-3xl font-bold">{documents.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500">Verified</p>
          <p className="text-3xl font-bold text-emerald-600">{verified}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500">Failed</p>
          <p className="text-3xl font-bold text-red-600">{failed}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500">Avg Faithfulness</p>
          <p className="text-3xl font-bold text-sky-600">{avgScore}%</p>
        </div>
      </div>
    </div>
  );
};

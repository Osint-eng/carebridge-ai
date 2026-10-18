import React from 'react';
import { useDocuments } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import { FileText, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentDoc, documents, loadSampleDocument, isProcessing, processingStage } = useDocuments();
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Command center for your clinical care pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Documents</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Status</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentDoc?.status || 'No document'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile?.fullName || 'User'}</p>
          <p className="text-xs text-slate-400">{profile?.role}</p>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage || 'Processing...'}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => loadSampleDocument('cardio')} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg">
            Load Cardiology Sample
          </button>
          <button onClick={() => loadSampleDocument('diabetes')} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg">
            Load Diabetes Sample
          </button>
        </div>
        {currentDoc && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentDoc.fileName}</p>
            <p className="text-xs text-slate-500 mt-1">Uploaded {new Date(currentDoc.uploadedAt).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/context/DocumentContext';

export const AdminPage: React.FC = () => {
  const { profile } = useAuth();
  const { documents } = useDocuments();

  if (profile?.role !== 'Administrator') {
    return <div className="text-center py-20 text-slate-500">Administrator access required.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Console</h1>
        <p className="text-sm text-slate-500 mt-1">System administration</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold mb-3">System Overview</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Total documents in system: {documents.length}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Logged in as: {profile.fullName} ({profile.role})</p>
      </div>
    </div>
  );
};

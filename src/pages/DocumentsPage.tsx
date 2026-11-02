import React from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Upload } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { documents, setCurrentDoc, deleteDocument } = useDocument();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Library</h1>
          <p className="text-sm text-slate-500 mt-1">All uploaded discharge summaries</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload new
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 space-y-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-500">No documents yet.</p>
          <p className="text-sm text-slate-400">Upload a discharge summary or load a sample to get started.</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg"
          >
            Go to Upload
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4"
            >
              <FileText className="w-8 h-8 text-sky-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.fileName}</p>
                <p className="text-xs text-slate-400">
                  {new Date(doc.uploadedAt).toLocaleString()} · {doc.status}
                  {doc.faithfulnessScore > 0 ? ` · Score: ${doc.faithfulnessScore}%` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentDoc(doc);
                  navigate('/extraction');
                }}
                className="px-3 py-1.5 text-xs font-medium bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-lg hover:bg-sky-100"
              >
                Open
              </button>
              <button
                onClick={() => deleteDocument(doc.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

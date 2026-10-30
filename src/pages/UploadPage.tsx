import React, { useState } from 'react';
import { useDocument } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { uploadDocument, loadSampleDocument, isProcessing, processingStage } = useDocument();
  const navigate = useNavigate();
  const [pasteText, setPasteText] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument(file);
    navigate('/extraction');
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    await uploadDocument({ name: 'pasted-discharge.txt', content: pasteText, size: pasteText.length });
    navigate('/extraction');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Summary</h1>
        <p className="text-sm text-slate-500 mt-1">Upload or paste a hospital discharge summary</p>
      </div>

      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage || 'Processing...'}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 cursor-pointer hover:border-sky-400 transition-colors bg-white dark:bg-slate-900">
          <Upload className="w-10 h-10 text-slate-400 mb-3" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop file or click to upload</span>
          <span className="text-xs text-slate-400 mt-1">.txt, .pdf, .docx</span>
          <input type="file" className="hidden" accept=".txt,.pdf,.docx,.md" onChange={handleFile} />
        </label>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" /> Paste Discharge Text
          </label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder="Paste the full discharge summary here..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
          <button onClick={handlePaste} disabled={!pasteText.trim() || isProcessing}
            className="mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            Process Text
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => loadSampleDocument('cardio').then(() => navigate('/extraction'))}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-lg">
          Load Cardiology Sample
        </button>
        <button onClick={() => loadSampleDocument('diabetes').then(() => navigate('/extraction'))}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-lg">
          Load Diabetes Sample
        </button>
      </div>
    </div>
  );
};

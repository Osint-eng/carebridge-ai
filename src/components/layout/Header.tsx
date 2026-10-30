import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDocument } from '@/context/DocumentContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import {
  ShieldCheck,
  ShieldAlert,
  Type,
  Contrast,
  ZapOff,
  FileText,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { profile, isSupabaseConfigured } = useAuth();
  const { currentDoc, documents, setCurrentDoc } = useDocuments();
  const {
    reducedMotion,
    toggleReducedMotion,
    largeText,
    toggleLargeText,
    highContrast,
    toggleHighContrast,
  } = useAccessibility();

  const [showDocMenu, setShowDocMenu] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isVerified = currentDoc?.faithfulnessReport?.overallStatus === 'VERIFIED';
  const isFailed = currentDoc?.faithfulnessReport?.overallStatus === 'VALIDATION_FAILED';

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-20 select-none shadow-xs">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">
            {getGreeting()},{' '}
            <span className="text-medical-600 dark:text-medical-400">
              {profile?.fullName || 'User'}
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            {profile?.role || 'Patient'} Mode • Source Fidelity Guaranteed
          </p>
        </div>

        {currentDoc && (
          <div className="relative">
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-medical-600" />
              <span className="max-w-[170px] truncate">{currentDoc.fileName}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
            {showDocMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setCurrentDoc(doc);
                      setShowDocMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 ${
                      currentDoc?.id === doc.id ? 'bg-medical-50 dark:bg-medical-950/40 text-medical-700' : ''
                    }`}
                  >
                    {currentDoc?.id === doc.id && <CheckCircle2 className="w-3 h-3 text-medical-600" />}
                    <span className="truncate">{doc.fileName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentDoc && (
          <Link
            to="/faithfulness"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
              isVerified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : isFailed
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>
              {isVerified ? '100% Faithful' : isFailed ? 'Discrepancy Detected' : 'Pending Verification'}
            </span>
          </Link>
        )}

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleReducedMotion}
            title={reducedMotion ? 'Enable 3D motion' : 'Disable 3D motion'}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              reducedMotion
                ? 'bg-white dark:bg-slate-700 text-medical-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ZapOff className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleLargeText}
            title={largeText ? 'Default text size' : 'Enlarge text'}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              largeText
                ? 'bg-white dark:bg-slate-700 text-medical-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleHighContrast}
            title={highContrast ? 'Normal contrast' : 'High contrast'}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              highContrast
                ? 'bg-white dark:bg-slate-700 text-medical-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

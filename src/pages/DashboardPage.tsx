import React from 'react';
import { Link } from 'react-router-dom';
import { useDocument } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import { roleTheme } from '@/lib/roleNav';
import {
  FileText, Activity, HeartHandshake, Refrigerator, CalendarClock, Volume2,
  FileUp, ShieldCheck, Languages, BarChart3, Users, ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentDoc, documents, loadSampleDocument, isProcessing, processingStage } = useDocument();
  const { profile } = useAuth();
  const role = profile?.role || 'Patient';
  const theme = roleTheme(role);

  if (role === 'Patient') {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-r ${theme.accent} p-6 text-white shadow-lg`}>
          <p className="text-sm opacity-90">Welcome back</p>
          <h1 className="text-2xl font-bold mt-1">{profile?.fullName || 'Patient'}</h1>
          <p className="text-sm mt-2 opacity-90">{theme.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/care-plan', icon: HeartHandshake, title: 'My Care Plan', desc: 'Medicines & instructions' },
            { to: '/fridge-sheet', icon: Refrigerator, title: 'Fridge Sheet', desc: 'Print for the kitchen' },
            { to: '/medicine-timetable', icon: CalendarClock, title: 'Schedule', desc: 'Morning · Night doses' },
            { to: '/audio', icon: Volume2, title: 'Listen', desc: 'Riya reads your plan' },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-teal-400 transition-colors shadow-sm">
              <c.icon className="w-6 h-6 text-teal-600 mb-2" />
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{c.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
            </Link>
          ))}
        </div>
        {currentDoc?.carePlan ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-2">Your plan summary</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentDoc.carePlan.patientFriendlySummary.slice(0, 280)}
              {currentDoc.carePlan.patientFriendlySummary.length > 280 ? '…' : ''}
            </p>
            <Link to="/care-plan" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-teal-600 hover:underline">
              Open full plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl p-5 text-sm text-teal-800 dark:text-teal-200">
            No care plan loaded yet. Ask your care team to upload your discharge summary, or open a sample.
            <div className="mt-3 flex gap-2">
              <button onClick={() => loadSampleDocument('cardio')} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium">Try heart sample</button>
              <button onClick={() => loadSampleDocument('diabetes')} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-teal-300 rounded-lg text-xs font-medium">Try diabetes sample</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (role === 'Caregiver') {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-r ${theme.accent} p-6 text-white shadow-lg`}>
          <p className="text-sm opacity-90">Caregiver workspace</p>
          <h1 className="text-2xl font-bold mt-1">{profile?.fullName || 'Caregiver'}</h1>
          <p className="text-sm mt-2 opacity-90">Help a family member follow their discharge plan safely</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 border-slate-200 dark:border-slate-800">
            <Users className="w-5 h-5 text-violet-600 mb-2" />
            <p className="text-xs text-slate-500">Your role</p>
            <p className="font-semibold text-slate-900 dark:text-white">Family caregiver</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 border-slate-200 dark:border-slate-800">
            <FileText className="w-5 h-5 text-violet-600 mb-2" />
            <p className="text-xs text-slate-500">Shared documents</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 border-slate-200 dark:border-slate-800">
            <Activity className="w-5 h-5 text-violet-600 mb-2" />
            <p className="text-xs text-slate-500">Plan status</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentDoc?.status || 'Waiting for plan'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { to: '/fridge-sheet', title: 'Print fridge sheet', desc: 'Put on the fridge for the whole family' },
            { to: '/medicine-timetable', title: "Today's medicines", desc: 'Who takes what, when' },
            { to: '/audio', title: 'Play audio for them', desc: 'Riya speaks the plan in their language' },
            { to: '/translation', title: 'Change language', desc: 'Hindi, Telugu, Tamil and more' },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-400">
              <ArrowRight className="w-4 h-4 text-violet-500 mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.title}</p>
                <p className="text-xs text-slate-500">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl bg-gradient-to-r ${theme.accent} p-6 text-white shadow-lg`}>
        <p className="text-sm opacity-90">{theme.label} console</p>
        <h1 className="text-2xl font-bold mt-1">{profile?.fullName || 'Clinician'}</h1>
        <p className="text-sm mt-2 opacity-90">{theme.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <FileText className="w-5 h-5 text-sky-600 mb-1" />
          <p className="text-xs text-slate-500">Documents</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <Activity className="w-5 h-5 text-sky-600 mb-1" />
          <p className="text-xs text-slate-500">Current status</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentDoc?.status || 'Idle'}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <ShieldCheck className="w-5 h-5 text-sky-600 mb-1" />
          <p className="text-xs text-slate-500">Faithfulness</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentDoc?.faithfulnessReport?.overallStatus || 'Not run'}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <BarChart3 className="w-5 h-5 text-sky-600 mb-1" />
          <p className="text-xs text-slate-500">Score</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {currentDoc?.faithfulnessReport ? `${Math.round(currentDoc.faithfulnessReport.scorePercentage)}%` : '—'}
          </p>
        </div>
      </div>
      {isProcessing && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
          {processingStage || 'Processing…'}
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Clinical workflow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/upload', icon: FileUp, title: 'Upload discharge summary' },
            { to: '/extraction', icon: FileText, title: 'Review extraction' },
            { to: '/care-plan', icon: HeartHandshake, title: 'Generate care plan' },
            { to: '/faithfulness', icon: ShieldCheck, title: 'Run faithfulness audit' },
            { to: '/translation', icon: Languages, title: 'Translate for patient' },
            { to: '/analytics', icon: BarChart3, title: 'Quality analytics' },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400">
              <c.icon className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.title}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => loadSampleDocument('cardio')} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg">Load cardiology sample</button>
          <button onClick={() => loadSampleDocument('diabetes')} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg">Load diabetes sample</button>
        </div>
      </div>
      {role === 'Administrator' && (
        <Link to="/admin" className="block rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 p-4 text-center text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20">
          Open Admin Console →
        </Link>
      )}
    </div>
  );
};

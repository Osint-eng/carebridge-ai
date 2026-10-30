import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/context/DocumentContext';
import type { VerificationRequest } from '@/types';
import {
  listVerificationRequests,
  markInReview,
  approveRequestWithPlan,
  requestChanges,
  countPending,
} from '@/lib/verificationStore';
import { ClipboardList, CheckCircle2, XCircle, Eye, Clock, User } from 'lucide-react';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  in_review: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export const VerificationInboxPage: React.FC = () => {
  const { profile } = useAuth();
  const { documents, setCurrentDoc, runFaithfulnessCheck, isProcessing, processingStage } = useDocuments();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  const refresh = useCallback(() => {
    setRequests(listVerificationRequests());
  }, []);

  useEffect(() => {
    refresh();
    const onUpd = () => refresh();
    window.addEventListener('carebridge-verification-updated', onUpd);
    window.addEventListener('storage', onUpd);
    return () => {
      window.removeEventListener('carebridge-verification-updated', onUpd);
      window.removeEventListener('storage', onUpd);
    };
  }, [refresh]);

  const pendingCount = countPending();
  const visible =
    filter === 'pending'
      ? requests.filter((r) => r.status === 'pending' || r.status === 'in_review')
      : requests;

  const openRequest = (req: VerificationRequest) => {
    setSelected(req);
    setNotes(req.staffNotes || '');
    markInReview(req.id, profile?.fullName || 'Staff');
    refresh();
    const local = documents.find((d) => d.id === req.documentId);
    if (local && setCurrentDoc) setCurrentDoc(local);
  };

  const handleApprove = async () => {
    if (!selected) return;
    let report = selected.faithfulnessReport;
    try {
      if (selected.documentId && documents.find((d) => d.id === selected.documentId)) {
        report = await runFaithfulnessCheck(selected.documentId, false);
      }
    } catch {
      // approve without live run if doc not in this browser session
    }
    approveRequestWithPlan(selected.id, profile?.fullName || 'Staff', notes || 'Approved after review', report);
    setSelected(null);
    refresh();
  };

  const handleRequestChanges = () => {
    if (!selected) return;
    if (!notes.trim()) {
      alert('Please add a short note explaining what the patient / care team should fix.');
      return;
    }
    requestChanges(selected.id, profile?.fullName || 'Staff', notes.trim());
    setSelected(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-sky-600" />
            Verification inbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Care plans submitted by patients for staff faithfulness review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
            {pendingCount} pending
          </span>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'pending' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'all' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            All
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 p-3 text-sm text-sky-800 dark:text-sky-200">
          {processingStage || 'Working…'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">
              No verification requests yet.
              <p className="mt-2 text-xs">When a patient clicks “Submit for staff verification” on their care plan, it appears here.</p>
            </div>
          ) : (
            visible.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openRequest(r)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  selected?.id === r.id
                    ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {r.patientName || 'Patient'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{r.fileName}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusStyle[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.submittedAt).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {r.carePlanSnapshot?.medications?.length || 0} medicines ·{' '}
                  {r.carePlanSnapshot?.warningSigns?.length || 0} warnings
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500">
              <Eye className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              Select a request to review the care plan and approve or request changes.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selected.fileName}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    From {selected.patientName} ({selected.patientEmail}) · submitted{' '}
                    {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${statusStyle[selected.status]}`}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-100 mb-1">Patient-friendly summary</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {selected.carePlanSnapshot?.patientFriendlySummary || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Medications in plan</p>
                {(selected.carePlanSnapshot?.medications || []).length === 0 ? (
                  <p className="text-sm text-amber-700">No medicines in this plan — ask patient to re-generate after extraction.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selected.carePlanSnapshot.medications.map((m) => (
                      <li key={m.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <strong>{m.name}</strong> — {m.dose}, {m.frequency}
                        {m.duration ? `, ${m.duration}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(selected.carePlanSnapshot?.warningSigns || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">Warning signs</p>
                  <ul className="space-y-1">
                    {selected.carePlanSnapshot.warningSigns.map((w) => (
                      <li key={w.id} className="text-sm text-red-800 dark:text-red-300">
                        {w.sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700">View source discharge excerpt</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-950 p-3 text-[11px] whitespace-pre-wrap">
                  {(selected.sourceText || '').slice(0, 2000)}
                  {(selected.sourceText || '').length > 2000 ? '…' : ''}
                </pre>
              </details>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Staff notes (required for changes)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  placeholder="e.g. Dose of Metoprolol looks correct. Approve. / Please re-extract — missing follow-up date."
                />
              </div>

              {(selected.status === 'pending' || selected.status === 'in_review') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve (mark verified)
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Request changes
                  </button>
                </div>
              )}

              {selected.reviewedAt && (
                <p className="text-xs text-slate-500">
                  Reviewed by {selected.reviewedBy} on {new Date(selected.reviewedAt).toLocaleString()}
                  {selected.staffNotes ? ` — “${selected.staffNotes}”` : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationInboxPage;

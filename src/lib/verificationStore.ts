import type { VerificationRequest, CarePlan, ExtractedDischargeData, FaithfulnessReport } from '@/types';

const KEY = 'carebridge_verification_requests_v1';

function readAll(): VerificationRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VerificationRequest[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: VerificationRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('carebridge-verification-updated'));
}

export function listVerificationRequests(): VerificationRequest[] {
  return readAll().sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function listPendingRequests(): VerificationRequest[] {
  return listVerificationRequests().filter((r) => r.status === 'pending' || r.status === 'in_review');
}

export function getVerificationRequest(id: string): VerificationRequest | undefined {
  return readAll().find((r) => r.id === id);
}

export function getRequestForDocument(documentId: string): VerificationRequest | undefined {
  return readAll()
    .filter((r) => r.documentId === documentId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];
}

export function submitVerificationRequest(input: {
  documentId: string;
  patientUserId: string;
  patientName: string;
  patientEmail: string;
  fileName: string;
  carePlan: CarePlan;
  sourceText: string;
  extracted?: ExtractedDischargeData;
}): VerificationRequest {
  const list = readAll();
  const filtered = list.filter(
    (r) => !(r.documentId === input.documentId && (r.status === 'pending' || r.status === 'in_review'))
  );
  const req: VerificationRequest = {
    id: crypto.randomUUID(),
    documentId: input.documentId,
    patientUserId: input.patientUserId,
    patientName: input.patientName,
    patientEmail: input.patientEmail,
    fileName: input.fileName,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    carePlanSnapshot: {
      ...input.carePlan,
      status: 'pending_verification',
    },
    sourceText: input.sourceText,
    extractedSnapshot: input.extracted,
  };
  filtered.unshift(req);
  writeAll(filtered);
  return req;
}

export function updateVerificationRequest(
  id: string,
  patch: Partial<
    Pick<
      VerificationRequest,
      'status' | 'staffNotes' | 'reviewedBy' | 'reviewedAt' | 'faithfulnessReport' | 'carePlanSnapshot'
    >
  >
): VerificationRequest | null {
  const list = readAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  writeAll(list);
  return list[idx];
}

export function markInReview(id: string, staffName: string): VerificationRequest | null {
  return updateVerificationRequest(id, {
    status: 'in_review',
    reviewedBy: staffName,
  });
}

export function approveRequestWithPlan(
  id: string,
  staffName: string,
  notes?: string,
  report?: FaithfulnessReport
): VerificationRequest | null {
  const list = readAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const prev = list[idx];
  list[idx] = {
    ...prev,
    status: 'approved',
    reviewedBy: staffName,
    reviewedAt: new Date().toISOString(),
    staffNotes: notes,
    faithfulnessReport: report,
    carePlanSnapshot: {
      ...prev.carePlanSnapshot,
      status: 'verified',
    },
  };
  writeAll(list);
  return list[idx];
}

export function requestChanges(
  id: string,
  staffName: string,
  notes: string
): VerificationRequest | null {
  const list = readAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const prev = list[idx];
  list[idx] = {
    ...prev,
    status: 'changes_requested',
    reviewedBy: staffName,
    reviewedAt: new Date().toISOString(),
    staffNotes: notes,
    carePlanSnapshot: {
      ...prev.carePlanSnapshot,
      status: 'failed',
    },
  };
  writeAll(list);
  return list[idx];
}

export function countPending(): number {
  return listPendingRequests().length;
}

/** Unified clinical / faithfulness acceptance threshold (0–1). Score must be ≥ this to pass. */
export const CLINICAL_VALIDATION_THRESHOLD = 0.8;

export interface ClinicalValidationResult {
  isValid: boolean;
  /** Normalized score in 0–1 range */
  score: number;
  matchedCategories: string[];
  missingElements: string[];
  rejectionReason?: string;
  detectedSpecialty?: 'Cardiology' | 'Endocrinology / Diabetes' | 'Inpatient Medicine' | 'General Clinical';
}

/**
 * Strict clinical validation engine:
 * Evaluates whether an uploaded document is a genuine hospital clinical discharge summary.
 * Rejects non-medical files, invoices, receipts, code, resumes, recipes, or random documents.
 * Pass criterion: normalized score ≥ CLINICAL_VALIDATION_THRESHOLD (0.8).
 */
export function validateDischargeSummary(text: string, fileName: string = ''): ClinicalValidationResult {
  const clean = (text || '').toLowerCase();
  const trimmed = (text || '').trim();

  if (!trimmed || trimmed.length < 80) {
    return {
      isValid: false,
      score: 0,
      matchedCategories: [],
      missingElements: ['Document contains insufficient text (minimum 80 characters required).'],
      rejectionReason: 'The uploaded file is empty or contains insufficient text to be a clinical discharge summary.',
    };
  }

  const settingKeywords = [
    'discharge summary', 'discharge instructions', 'discharge note', 'discharge report',
    'clinical summary', 'hospital', 'medical center', 'inpatient', 'admission date',
    'discharge date', 'date of admission', 'date of discharge', 'emergency department',
    'attending physician', 'admitting diagnosis', 'discharge diagnosis', 'hospital course',
  ];
  const matchedSettings = settingKeywords.filter((k) => clean.includes(k));

  const clinicalKeywords = [
    'primary diagnosis', 'secondary diagnosis', 'diagnosis:', 'diagnoses:',
    'history of present illness', 'past medical history', 'hospital course',
    'impression', 'assessment', 'stemi', 'myocardial infarction', 'hypertension',
    'diabetes', 'hyperglycemia', 'hypoglycemia', 'fracture', 'pneumonia', 'sepsis',
    'coronary', 'cardiac', 'renal', 'chronic kidney disease', 'neuropathy', 'vital signs',
  ];
  const matchedClinical = clinicalKeywords.filter((k) => clean.includes(k));

  const medKeywords = [
    'medication', 'medications', 'prescription', 'rx', 'tablet', 'capsule',
    'mg', 'mcg', 'ml', 'once daily', 'twice daily', 'bid', 'tid', 'qid',
    'oral', 'intravenous', 'subcutaneous', 'as needed', 'prn',
  ];
  const matchedMeds = medKeywords.filter((k) => clean.includes(k));

  const followUpKeywords = [
    'follow-up', 'follow up', 'followup', 'appointment', 'return to clinic',
    'see your doctor', 'contact your physician', 'outpatient',
  ];
  const matchedFollowUp = followUpKeywords.filter((k) => clean.includes(k));

  const warningKeywords = [
    'warning', 'seek immediate', 'call 911', 'emergency', 'chest pain',
    'shortness of breath', 'return to the emergency', 'red flag',
  ];
  const matchedWarnings = warningKeywords.filter((k) => clean.includes(k));

  // Rejection patterns for non-clinical documents
  const rejectionPatterns = [
    'invoice', 'receipt', 'purchase order', 'curriculum vitae', 'resume',
    'recipe', 'ingredients', 'lorem ipsum', 'hello world', 'function(',
    'const ', 'import react', 'package.json',
  ];
  const hasRejection = rejectionPatterns.some((p) => clean.includes(p));

  if (hasRejection && matchedSettings.length === 0 && matchedClinical.length < 2) {
    return {
      isValid: false,
      score: 0.05,
      matchedCategories: [],
      missingElements: ['Document appears to be non-clinical (invoice, code, resume, etc.).'],
      rejectionReason: 'This file does not appear to be a hospital discharge summary.',
    };
  }

  const rawScore =
    matchedSettings.length * 12 +
    matchedClinical.length * 8 +
    matchedMeds.length * 6 +
    matchedFollowUp.length * 5 +
    matchedWarnings.length * 5;

  // Normalize to 0–1; pass only when score ≥ CLINICAL_VALIDATION_THRESHOLD (0.8)
  const finalScore = Math.min(1, rawScore / 100);
  const isValid = finalScore >= CLINICAL_VALIDATION_THRESHOLD && matchedSettings.length >= 1;

  let specialty: ClinicalValidationResult['detectedSpecialty'] = 'General Clinical';
  if (clean.includes('stemi') || clean.includes('myocardial') || clean.includes('cardiac')) {
    specialty = 'Cardiology';
  } else if (clean.includes('diabetes') || clean.includes('insulin') || clean.includes('hyperglycemia')) {
    specialty = 'Endocrinology / Diabetes';
  } else if (clean.includes('inpatient') || clean.includes('hospital course')) {
    specialty = 'Inpatient Medicine';
  }

  const missing: string[] = [];
  if (matchedSettings.length === 0) missing.push('Hospital / discharge setting markers');
  if (matchedClinical.length === 0) missing.push('Clinical diagnosis or history markers');
  if (matchedMeds.length === 0) missing.push('Medication-related language');

  return {
    isValid,
    score: finalScore,
    matchedCategories: [
      ...matchedSettings.slice(0, 3),
      ...matchedClinical.slice(0, 3),
      ...matchedMeds.slice(0, 2),
    ],
    missingElements: missing,
    rejectionReason: isValid ? undefined : 'Document does not contain enough clinical discharge markers.',
    detectedSpecialty: specialty,
  };
}

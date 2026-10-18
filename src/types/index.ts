export type UserRole = 'Patient' | 'Caregiver' | 'Healthcare Staff' | 'Administrator';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  preferredLanguage: 'English' | 'Telugu' | 'Hindi' | 'Tamil';
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  purpose?: string; // ONLY if stated in source
  timingNotes?: string; // Strictly from source e.g. "Morning / Evening", never invented clock hours
  sourceQuote: string;
  sourceLineNumber?: number;
}

export interface WarningSign {
  id: string;
  sign: string;
  actionRequired: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  sourceQuote: string;
}

export interface FollowUpInstruction {
  id: string;
  departmentOrDoctor: string;
  dateOrTimeframe: string;
  location?: string;
  purpose?: string;
  sourceQuote: string;
}

export interface ExtractedDischargeData {
  patientInfo: {
    name?: string;
    age?: string | number;
    gender?: string;
    admissionDate?: string;
    dischargeDate?: string;
    mrn?: string;
  };
  diagnoses: string[];
  medications: MedicationItem[];
  warningSigns: WarningSign[];
  dietInstructions: string[];
  activityInstructions: string[];
  followUps: FollowUpInstruction[];
  criticalDates: { label: string; date: string; sourceQuote: string }[];
  rawText: string;
}

export interface CarePlanSection {
  title: string;
  summary: string;
  items: string[];
  sourceRef: string;
}

export interface CarePlan {
  id: string;
  documentId: string;
  generatedAt: string;
  status: 'draft' | 'pending_verification' | 'verified' | 'failed';
  readabilityGradeLevel: number;
  medications: MedicationItem[];
  warningSigns: WarningSign[];
  dietInstructions: string[];
  activityInstructions: string[];
  followUps: FollowUpInstruction[];
  patientFriendlySummary: string;
}

export type FaithfulnessCheckStatus = 'MATCH' | 'CRITICAL_MISMATCH' | 'DROPPED_INSTRUCTION' | 'INVENTED_INSTRUCTION';

export interface MismatchDetail {
  id: string;
  category: 'Medication' | 'Dose' | 'Frequency' | 'Duration' | 'Route' | 'Follow-up' | 'Warnings' | 'Diet' | 'Activity' | 'Dates';
  itemName: string;
  sourceText: string;
  carePlanText: string;
  status: FaithfulnessCheckStatus;
  explanation: string;
  isFatal: boolean;
}

export interface FaithfulnessReport {
  id: string;
  documentId: string;
  evaluatedAt: string;
  overallStatus: 'VERIFIED' | 'VALIDATION_FAILED';
  scorePercentage: number;
  checksTotal: number;
  checksPassed: number;
  checksFailed: number;
  mismatches: MismatchDetail[];
  categoryScores: {
    category: string;
    passed: boolean;
    accuracy: number;
  }[];
}

export interface TranslatedCarePlan {
  language: 'Telugu' | 'English' | 'Hindi' | 'Tamil';
  languageNativeName: string;
  patientFriendlySummary: string;
  medications: (MedicationItem & { translatedPurpose?: string; translatedInstructions: string })[];
  warningSigns: (WarningSign & { translatedSign: string; translatedAction: string })[];
  dietInstructions: string[];
  activityInstructions: string[];
  followUps: (FollowUpInstruction & { translatedInstructions: string })[];
  translationFaithfulnessStatus: 'Verified' | 'Validation Failed';
  translatedAt: string;
}

export interface ReadabilityMetrics {
  fleschKincaidGradeLevel: number; // e.g. 7.4 (Class 7-8)
  readingEaseScore: number; // e.g. 75.2
  totalWords: number;
  averageSentenceLength: number;
  complexWordCount: number;
  complexWordPercentage: number;
  medicalTermsSimplified: number;
  targetAchieved: boolean; // Class 8 or easier
  originalTextSample: string;
  simplifiedTextSample: string;
  improvements: {
    clinical: string;
    simplified: string;
    reason: string;
  }[];
}

export interface DischargeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  status: 'Processing' | 'Validated' | 'Needs Review' | 'Failed';
  faithfulnessScore: number;
  language: string;
  extractedData?: ExtractedDischargeData;
  carePlan?: CarePlan;
  faithfulnessReport?: FaithfulnessReport;
  translations?: Record<string, TranslatedCarePlan>;
  readabilityMetrics?: ReadabilityMetrics;
}

export interface SystemServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  lastChecked: string;
  details: string;
}

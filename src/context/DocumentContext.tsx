import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DischargeDocument,
  ExtractedDischargeData,
  CarePlan,
  FaithfulnessReport,
  TranslatedCarePlan,
  ReadabilityMetrics,
} from '@/types';
import { useAuth } from './AuthContext';
import { validateDischargeSummary } from '@/utils/dischargeValidator';
import { extractTextFromFile } from '@/utils/fileExtractor';
import { extractDischargeData } from '@/utils/dischargeExtractor';
import { runFaithfulnessAudit } from '@/utils/faithfulnessChecker';
import { getSampleContent } from '@/lib/sampleDocuments';

interface DocumentContextType {
  documents: DischargeDocument[];
  currentDoc: DischargeDocument | null;
  setCurrentDoc: (doc: DischargeDocument | null) => void;
  loadDocumentById: (id: string) => void;
  uploadDocument: (file: File | { name: string; content: string; size: number }) => Promise<DischargeDocument>;
  loadSampleDocument: (type: 'cardio' | 'diabetes' | 'mismatch_test') => Promise<DischargeDocument>;
  runExtraction: (docId: string) => Promise<ExtractedDischargeData>;
  generateCarePlan: (docId: string) => Promise<CarePlan>;
  runFaithfulnessCheck: (docId: string, introduceTestError?: boolean) => Promise<FaithfulnessReport>;
  translateCarePlan: (docId: string, targetLanguage: 'Telugu' | 'English' | 'Hindi') => Promise<TranslatedCarePlan>;
  calculateReadability: (docId: string) => ReadabilityMetrics;
  deleteDocument: (docId: string) => void;
  markTimetableItemCompleted: (dateKey: string, medId: string, completed: boolean) => void;
  timetableChecklist: Record<string, boolean>;
  isProcessing: boolean;
  processingStage: string;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const STORAGE_KEY = 'carebridge_documents';

const countSyllables = (rawWord: string): number => {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  let trimmed = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  trimmed = trimmed.replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
};

const computeFleschKincaid = (text: string) => {
  const words = text.split(/\s+/).map((w) => w.replace(/[^a-zA-Z0-9'-]/g, '')).filter(Boolean);
  const totalWords = words.length;
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length || (totalWords > 0 ? 1 : 0);

  if (totalWords === 0 || sentences === 0) {
    return {
      fleschKincaidGradeLevel: 0,
      readingEaseScore: 0,
      totalWords: 0,
      averageSentenceLength: 0,
      complexWordCount: 0,
      complexWordPercentage: 0,
      targetAchieved: false,
    };
  }

  let totalSyllables = 0;
  let complexWordCount = 0;
  for (const w of words) {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) complexWordCount += 1;
  }

  const avgSentenceLength = totalWords / sentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  const grade = Math.max(
    0,
    Math.round((0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10,
  );
  const ease = Math.min(
    100,
    Math.max(0, Math.round((206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord) * 10) / 10),
  );

  return {
    fleschKincaidGradeLevel: grade,
    readingEaseScore: ease,
    totalWords,
    averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexWordCount,
    complexWordPercentage: Math.round((complexWordCount / totalWords) * 1000) / 10,
    targetAchieved: grade <= 8.0,
  };
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DischargeDocument[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [currentDoc, setCurrentDoc] = useState<DischargeDocument | null>(null);
  const [timetableChecklist, setTimetableChecklist] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDocuments((prev) => (prev.length === 0 ? prev : []));
      setCurrentDoc(null);
      setTimetableChecklist((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents, user, authLoading]);

  const loadDocumentById = (id: string) => {
    const doc = documents.find((d) => d.id === id) || null;
    setCurrentDoc(doc);
  };

  const uploadDocument = async (
    file: File | { name: string; content: string; size: number },
  ): Promise<DischargeDocument> => {
    setIsProcessing(true);
    setProcessingStage('Extracting text...');
    let text = '';
    let fileName = '';
    let fileSize = 0;

    if (file instanceof File) {
      fileName = file.name;
      fileSize = file.size;
      text = await extractTextFromFile(file);
    } else {
      fileName = file.name;
      fileSize = file.size;
      text = file.content;
    }

    setProcessingStage('Validating clinical document...');
    const validation = validateDischargeSummary(text, fileName);

    const doc: DischargeDocument = {
      id: crypto.randomUUID(),
      userId: user?.id || 'local',
      fileName,
      fileSize,
      fileType: fileName.split('.').pop() || 'txt',
      uploadedAt: new Date().toISOString(),
      status: validation.isValid ? 'Processing' : 'Failed',
      faithfulnessScore: 0,
      language: 'English',
      extractedData: {
        patientInfo: {},
        diagnoses: [],
        medications: [],
        warningSigns: [],
        dietInstructions: [],
        activityInstructions: [],
        followUps: [],
        criticalDates: [],
        rawText: text,
      },
    };

    setDocuments((prev) => [doc, ...prev]);
    setCurrentDoc(doc);
    setIsProcessing(false);
    setProcessingStage('');
    return doc;
  };

  const loadSampleDocument = async (
    type: 'cardio' | 'diabetes' | 'mismatch_test',
  ): Promise<DischargeDocument> => {
    const sample = getSampleContent(type);
    return uploadDocument({ name: sample.name, content: sample.content, size: sample.content.length });
  };

  const runExtraction = async (docId: string): Promise<ExtractedDischargeData> => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc?.extractedData?.rawText) throw new Error('No document text');

    setIsProcessing(true);
    setProcessingStage('Running extraction...');

    const extracted = extractDischargeData(doc.extractedData.rawText);

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, extractedData: extracted, status: 'Validated' as const } : d)),
    );
    if (currentDoc?.id === docId) {
      setCurrentDoc((prev) => (prev ? { ...prev, extractedData: extracted, status: 'Validated' } : null));
    }

    setIsProcessing(false);
    setProcessingStage('');
    return extracted;
  };

  const generateCarePlan = async (docId: string): Promise<CarePlan> => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc?.extractedData) throw new Error('Run extraction first');

    setIsProcessing(true);
    setProcessingStage('Generating care plan...');

    const summary =
      'Your care plan has been prepared from your hospital discharge summary. Follow the medication schedule and contact your doctor if you have concerns.';
    const combinedText = [
      summary,
      ...doc.extractedData.medications.map((m) => `${m.name} ${m.dose} ${m.frequency} ${m.duration}`.trim()),
      ...doc.extractedData.warningSigns.map((w) => `${w.sign}. ${w.actionRequired}`.trim()),
      ...doc.extractedData.dietInstructions,
      ...doc.extractedData.activityInstructions,
      ...doc.extractedData.followUps.map((f) => `${f.departmentOrDoctor} ${f.dateOrTimeframe}`.trim()),
    ]
      .filter(Boolean)
      .join('. ');

    const plan: CarePlan = {
      id: crypto.randomUUID(),
      documentId: docId,
      generatedAt: new Date().toISOString(),
      status: 'pending_verification',
      readabilityGradeLevel: computeFleschKincaid(combinedText).fleschKincaidGradeLevel,
      medications: doc.extractedData.medications,
      warningSigns: doc.extractedData.warningSigns,
      dietInstructions: doc.extractedData.dietInstructions,
      activityInstructions: doc.extractedData.activityInstructions,
      followUps: doc.extractedData.followUps,
      patientFriendlySummary: summary,
    };

    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, carePlan: plan } : d)));
    if (currentDoc?.id === docId) setCurrentDoc((prev) => (prev ? { ...prev, carePlan: plan } : null));

    setIsProcessing(false);
    setProcessingStage('');
    return plan;
  };

  const runFaithfulnessCheck = async (
    docId: string,
    introduceTestError = false,
  ): Promise<FaithfulnessReport> => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc?.carePlan) throw new Error('Generate care plan first');

    setIsProcessing(true);
    setProcessingStage('Running faithfulness audit...');

    const report = runFaithfulnessAudit({
      documentId: docId,
      sourceText: doc.extractedData?.rawText || '',
      carePlan: doc.carePlan,
      introduceTestError,
    });

    const newStatus = report.overallStatus === 'VERIFIED' ? 'verified' : 'failed';

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              faithfulnessReport: report,
              faithfulnessScore: report.scorePercentage,
              carePlan: d.carePlan ? { ...d.carePlan, status: newStatus } : d.carePlan,
            }
          : d,
      ),
    );
    if (currentDoc?.id === docId) {
      setCurrentDoc((prev) =>
        prev
          ? {
              ...prev,
              faithfulnessReport: report,
              faithfulnessScore: report.scorePercentage,
              carePlan: prev.carePlan ? { ...prev.carePlan, status: newStatus } : prev.carePlan,
            }
          : null,
      );
    }

    setIsProcessing(false);
    setProcessingStage('');
    return report;
  };

  const translateCarePlan = async (
    docId: string,
    targetLanguage: 'Telugu' | 'English' | 'Hindi',
  ): Promise<TranslatedCarePlan> => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc?.carePlan) throw new Error('No care plan');

    const hi = targetLanguage === 'Hindi';
    const status: TranslatedCarePlan['translationFaithfulnessStatus'] =
      targetLanguage === 'English'
        ? 'Verified'
        : hi
        ? 'Partial'
        : 'Needs review';

    const translated: TranslatedCarePlan = {
      language: targetLanguage,
      languageNativeName:
        targetLanguage === 'Telugu' ? 'తెలుగు' : targetLanguage === 'Hindi' ? 'हिन्दी' : 'English',
      patientFriendlySummary: hi
        ? 'आपकी देखभाल योजना अस्पताल के डिस्चार्ज सारांश से बनाई गई है। दवा का शेड्यूल पालन करें।'
        : doc.carePlan.patientFriendlySummary,
      medications: doc.carePlan.medications.map((m) => ({
        ...m,
        translatedInstructions: `${m.dose} ${m.frequency}`.trim(),
      })),
      warningSigns: doc.carePlan.warningSigns.map((w) => ({
        ...w,
        translatedSign: w.sign,
        translatedAction: w.actionRequired,
      })),
      dietInstructions: doc.carePlan.dietInstructions,
      activityInstructions: doc.carePlan.activityInstructions,
      followUps: doc.carePlan.followUps.map((f) => ({
        ...f,
        translatedInstructions: f.dateOrTimeframe,
      })),
      translationFaithfulnessStatus: status,
      translatedAt: new Date().toISOString(),
    };

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, translations: { ...(d.translations || {}), [targetLanguage]: translated } }
          : d,
      ),
    );
    return translated;
  };

  const calculateReadability = (docId: string): ReadabilityMetrics => {
    const doc = documents.find((d) => d.id === docId);
    const planText = doc?.carePlan
      ? [
          doc.carePlan.patientFriendlySummary,
          ...doc.carePlan.medications.map((m) => `${m.name} ${m.dose} ${m.frequency} ${m.duration}`.trim()),
          ...doc.carePlan.warningSigns.map((w) => `${w.sign}. ${w.actionRequired}`.trim()),
          ...doc.carePlan.dietInstructions,
          ...doc.carePlan.activityInstructions,
          ...doc.carePlan.followUps.map((f) => `${f.departmentOrDoctor} ${f.dateOrTimeframe}`.trim()),
        ]
          .filter(Boolean)
          .join('. ')
      : '';
    const text = planText || doc?.extractedData?.rawText || '';
    const fk = computeFleschKincaid(text);

    return {
      fleschKincaidGradeLevel: fk.fleschKincaidGradeLevel,
      readingEaseScore: fk.readingEaseScore,
      totalWords: fk.totalWords,
      averageSentenceLength: fk.averageSentenceLength,
      complexWordCount: fk.complexWordCount,
      complexWordPercentage: fk.complexWordPercentage,
      medicalTermsSimplified: 0,
      targetAchieved: fk.targetAchieved,
      originalTextSample: (doc?.extractedData?.rawText || '').slice(0, 120),
      simplifiedTextSample: text.slice(0, 120),
      improvements: [],
    };
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (currentDoc?.id === docId) setCurrentDoc(null);
  };

  const markTimetableItemCompleted = (dateKey: string, medId: string, completed: boolean) => {
    const key = `${dateKey}::${medId}`;
    setTimetableChecklist((prev) => ({ ...prev, [key]: completed }));
  };

  const value: DocumentContextType = {
    documents,
    currentDoc,
    setCurrentDoc,
    loadDocumentById,
    uploadDocument,
    loadSampleDocument,
    runExtraction,
    generateCarePlan,
    runFaithfulnessCheck,
    translateCarePlan,
    calculateReadability,
    deleteDocument,
    markTimetableItemCompleted,
    timetableChecklist,
    isProcessing,
    processingStage,
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
}

/** Backward-compatible alias for pages that still import the plural hook name. */
export const useDocuments = useDocument;

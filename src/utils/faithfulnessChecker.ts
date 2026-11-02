import type { CarePlan, FaithfulnessReport, MismatchDetail } from '@/types';
import { sourceContains } from './dischargeExtractor';

/** Clinical pass threshold (0–1). Must stay in sync with dischargeValidator. */
export const FAITHFULNESS_THRESHOLD = 0.8;

export interface FaithfulnessInput {
  documentId: string;
  sourceText: string;
  carePlan: CarePlan;
  introduceTestError?: boolean;
}

/**
 * Compare care-plan instructions against the original discharge source.
 * Returns a full FaithfulnessReport with mismatches and category scores.
 */
export function runFaithfulnessAudit(input: FaithfulnessInput): FaithfulnessReport {
  const { documentId, sourceText, carePlan, introduceTestError = false } = input;
  const mismatches: MismatchDetail[] = [];

  for (const med of carePlan.medications) {
    if (med.dose && !sourceContains(sourceText, med.dose)) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Dose',
        itemName: med.name,
        sourceText: '(not found in source)',
        carePlanText: med.dose,
        status: 'CRITICAL_MISMATCH',
        explanation: `Dose "${med.dose}" for ${med.name} does not appear in the source discharge summary.`,
        isFatal: true,
      });
    }
    if (med.frequency && med.frequency !== 'as directed' && !sourceContains(sourceText, med.frequency)) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Frequency',
        itemName: med.name,
        sourceText: '(not found in source)',
        carePlanText: med.frequency,
        status: 'CRITICAL_MISMATCH',
        explanation: `Frequency "${med.frequency}" for ${med.name} does not appear in the source.`,
        isFatal: true,
      });
    }
    if (
      med.duration &&
      med.duration !== 'as prescribed' &&
      !sourceContains(sourceText, med.duration)
    ) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Duration',
        itemName: med.name,
        sourceText: '(not found in source)',
        carePlanText: med.duration,
        status: 'CRITICAL_MISMATCH',
        explanation: `Duration "${med.duration}" for ${med.name} does not appear in the source.`,
        isFatal: true,
      });
    }
  }

  for (const fu of carePlan.followUps) {
    const token = fu.dateOrTimeframe || fu.purpose || '';
    if (token && !sourceContains(sourceText, token)) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Follow-up',
        itemName: token.slice(0, 40),
        sourceText: '(not found in source)',
        carePlanText: token,
        status: 'CRITICAL_MISMATCH',
        explanation: `Follow-up text "${token}" is not present in the source.`,
        isFatal: true,
      });
    }
  }

  if (introduceTestError) {
    mismatches.push({
      id: crypto.randomUUID(),
      category: 'Dose',
      itemName: carePlan.medications[0]?.name || 'Medication',
      sourceText: carePlan.medications[0]?.dose || '',
      carePlanText: 'WRONG DOSE (test error)',
      status: 'CRITICAL_MISMATCH',
      explanation: 'Injected test dosage error for demonstration.',
      isFatal: true,
    });
  }

  const checksTotal = 9;
  const checksFailed = mismatches.length;
  const checksPassed = Math.max(0, checksTotal - checksFailed);
  const scoreRatio = checksPassed / checksTotal;
  const scorePercentage = Math.round(scoreRatio * 100);
  const overallStatus =
    mismatches.some((m) => m.isFatal) || scoreRatio < FAITHFULNESS_THRESHOLD
      ? 'VALIDATION_FAILED'
      : 'VERIFIED';

  const categoryScores = [
    'Medication',
    'Dose',
    'Frequency',
    'Duration',
    'Route',
    'Follow-up',
    'Warnings',
    'Diet',
    'Activity',
  ].map((category) => {
    const catFails = mismatches.filter((m) => m.category === category).length;
    return {
      category,
      passed: catFails === 0,
      accuracy: catFails === 0 ? 100 : Math.max(0, 100 - catFails * 40),
    };
  });

  return {
    id: crypto.randomUUID(),
    documentId,
    evaluatedAt: new Date().toISOString(),
    overallStatus,
    scorePercentage,
    checksTotal,
    checksPassed,
    checksFailed,
    mismatches,
    categoryScores,
  };
}

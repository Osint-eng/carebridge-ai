import type { CarePlan, FaithfulnessReport, MismatchDetail } from '@/types';
import { normalize, sourceContains } from './dischargeExtractor';

/** Clinical pass threshold (0–1). Must stay in sync with dischargeValidator. */
export const FAITHFULNESS_THRESHOLD = 0.8;

export interface FaithfulnessInput {
  documentId: string;
  sourceText: string;
  carePlan: CarePlan;
  introduceTestError?: boolean;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsOnBoundary(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  if (!n) return true;
  const h = normalize(haystack);
  if (!h) return false;
  const pattern = new RegExp(`(?<![a-z0-9./-])${escapeRegex(n)}(?![a-z0-9./-])`, 'i');
  return pattern.test(h);
}

/** Normalize dose strings (number + canonical unit spacing) for boundary comparison. */
export function normalizeDoseString(raw: string): string {
  let s = (raw || '')
    .toLowerCase()
    .replace(/½/g, '1/2')
    .replace(/\s+/g, ' ')
    .trim();

  // Separate number and unit cleanly: "10mg" -> "10 mg"
  s = s.replace(/(\d(?:\.\d+)?|1\/2)\s*(mg|mcg|iu|units?|u|ml|tabs?|tablets?|caps?|capsules?|puffs?|g)\b/gi, '$1 $2');
  s = s.replace(/\bunits?\b/gi, 'unit');
  s = s.replace(/\btablets?\b|\btabs?\b/gi, 'tab');
  s = s.replace(/\bcapsules?\b|\bcaps?\b/gi, 'cap');
  s = s.replace(/\bpuffs?\b/gi, 'puff');
  // Treat standalone "u" after a number as "unit"
  s = s.replace(/(\d(?:\.\d+)?)\s+u\b/gi, '$1 unit');
  return s.replace(/\s+/g, ' ').trim();
}

function doseMatchesText(haystack: string, dose: string): boolean {
  const normDose = normalizeDoseString(dose);
  if (!normDose) return true;
  const normHaystack = normalizeDoseString(haystack);
  const pattern = new RegExp(`(?<![a-z0-9./-])${escapeRegex(normDose)}(?![a-z0-9./-])`, 'i');
  return pattern.test(normHaystack);
}

const FREQUENCY_EQUIVALENTS: string[][] = [
  ['once daily', 'once a day', 'od', '1 time a day'],
  ['twice daily', 'twice a day', 'bd', 'bid', '2 times a day'],
  ['thrice daily', 'three times daily', 'three times a day', 'tds', 'tid', '3 times a day'],
  ['four times daily', 'four times a day', 'qid', '4 times a day'],
  ['at bedtime', 'hs', 'before sleep'],
  ['as needed', 'prn', 'sos'],
];

function frequencyMatchesText(haystack: string, frequency: string): boolean {
  const normFreq = normalize(frequency);
  if (!normFreq || normFreq === 'as directed') return true;
  if (containsOnBoundary(haystack, normFreq)) return true;

  for (const group of FREQUENCY_EQUIVALENTS) {
    if (group.includes(normFreq)) {
      return group.some((variant) => containsOnBoundary(haystack, variant));
    }
  }
  return false;
}

function findLinesForMedication(sourceText: string, medName: string): string {
  const lines = (sourceText || '').split(/\r?\n/);
  const matched = lines.filter((line) => containsOnBoundary(line, medName));
  return matched.join('\n');
}

const SECTION_HEADER_RE =
  /^(?:hospital|patient|admission|discharge\s+date|primary\s+diagnosis|secondary\s+diagnosis|hospital\s+course|diet|dietary|nutrition|activity|physical\s+activity|exercise|follow[- ]?up|f\/u|review|warning|warnings|warning\s+signs?|danger\s+signs?|allergies|medications?(?:\s+on\s+discharge)?|discharge\s+medications?)\s*[:\-]/i;

const MED_SECTION_START_RE = /^(?:medications?(?:\s+on\s+discharge)?|discharge\s+medications?|rx)\s*[:\-]?/i;
const STOP_CUE_RE = /\b(?:stop|discontinue|do\s+not\s+take|cease|hold)\b/i;
const DOSE_UNIT_RE =
  /\b(?:\d+(?:\.\d+)?|½|1\/2)\s*(?:mg|mcg|units?|iu|ml|tabs?|tablets?|caps?|capsules?|puffs?|drops?)\b/i;
const MED_ROUTE_OR_FREQ_RE =
  /\b(?:oral|subcutaneous|intravenous|once\s+(?:a\s+)?(?:day|daily)|twice\s+(?:a\s+)?(?:day|daily)|thrice\s+(?:a\s+)?(?:day|daily)|at\s+bedtime|od|bd|tds|qid|hs)\b/i;

function extractMedicationLookingLines(sourceText: string): string[] {
  const lines = (sourceText || '').split(/\r?\n/);
  const results: string[] = [];
  let inMedSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      inMedSection = false;
      continue;
    }

    if (MED_SECTION_START_RE.test(line)) {
      inMedSection = true;
      const afterColon = line.replace(MED_SECTION_START_RE, '').trim();
      if (afterColon && !STOP_CUE_RE.test(afterColon) && (DOSE_UNIT_RE.test(afterColon) || MED_ROUTE_OR_FREQ_RE.test(afterColon))) {
        results.push(afterColon);
      }
      continue;
    }

    if (SECTION_HEADER_RE.test(line)) {
      inMedSection = false;
      continue;
    }

    if (STOP_CUE_RE.test(line)) {
      // Handled by dedicated STOP instruction check
      continue;
    }

    const stripped = line.replace(/^(?:\d+[.)]|[-•*])\s*/, '').trim();
    if (!stripped) continue;

    if (inMedSection) {
      // Inside a Medications section, any non-empty bullet/numbered/drug line should be parsed
      if (/^(?:\d+[.)]|[-•*])/.test(line) || DOSE_UNIT_RE.test(stripped) || MED_ROUTE_OR_FREQ_RE.test(stripped)) {
        results.push(line);
      }
    } else if (DOSE_UNIT_RE.test(stripped)) {
      results.push(line);
    }
  }

  return results;
}

const STOPWORDS = new Set([
  'stop',
  'discontinue',
  'do',
  'not',
  'take',
  'taking',
  'cease',
  'hold',
  'use',
  'using',
  'the',
  'all',
  'and',
  'or',
  'immediately',
  'medications',
  'medication',
  'drug',
  'medicine',
  'now',
  'if',
  'please',
  'prior',
  'previous',
  'home',
  'for',
  'until',
]);

function extractStopInstructions(sourceText: string): string[] {
  const lines = (sourceText || '').split(/\r?\n/);
  const stops: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (STOP_CUE_RE.test(line)) {
      stops.push(line);
    }
  }
  return stops;
}

/**
 * Compare care-plan instructions against the original discharge source.
 * Returns a full FaithfulnessReport with mismatches and category scores.
 */
export function runFaithfulnessAudit(input: FaithfulnessInput): FaithfulnessReport {
  const { documentId, sourceText, carePlan, introduceTestError = false } = input;
  const mismatches: MismatchDetail[] = [];
  let checksTotal = 0;

  for (const med of carePlan.medications) {
    // Determine the authoritative source scope for THIS medication:
    // 1) Prefer its own `sourceQuote` (verified to exist in sourceText)
    // 2) Fall back to source line(s) containing `med.name`
    let medScope = '';
    const hasQuote = Boolean(med.sourceQuote && med.sourceQuote.trim());

    checksTotal += 1; // Medication presence / quote check
    if (hasQuote) {
      const quoteInSource = containsOnBoundary(sourceText, med.sourceQuote);
      if (!quoteInSource) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Medication',
          itemName: med.name,
          sourceText: '(sourceQuote not found in discharge document)',
          carePlanText: med.sourceQuote,
          status: 'INVENTED_INSTRUCTION',
          explanation: `Quoted source line for ${med.name} does not match the original discharge summary.`,
          isFatal: true,
        });
        medScope = findLinesForMedication(sourceText, med.name);
      } else if (!containsOnBoundary(med.sourceQuote, med.name)) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Medication',
          itemName: med.name,
          sourceText: med.sourceQuote,
          carePlanText: med.name,
          status: 'CRITICAL_MISMATCH',
          explanation: `Medication name "${med.name}" does not appear in its quoted source line.`,
          isFatal: true,
        });
        medScope = med.sourceQuote;
      } else {
        medScope = med.sourceQuote;
      }
    } else {
      medScope = findLinesForMedication(sourceText, med.name);
      if (!medScope) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Medication',
          itemName: med.name,
          sourceText: '(not found in source)',
          carePlanText: med.name,
          status: 'INVENTED_INSTRUCTION',
          explanation: `Medication "${med.name}" does not appear in the source discharge summary.`,
          isFatal: true,
        });
      }
    }

    if (med.dose) {
      checksTotal += 1;
      if (!medScope || !doseMatchesText(medScope, med.dose)) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Dose',
          itemName: med.name,
          sourceText: medScope || '(not found in source)',
          carePlanText: med.dose,
          status: 'CRITICAL_MISMATCH',
          explanation: `Dose "${med.dose}" for ${med.name} does not match its source entry.`,
          isFatal: true,
        });
      }
    }

    if (med.frequency && med.frequency !== 'as directed') {
      checksTotal += 1;
      if (!medScope || !frequencyMatchesText(medScope, med.frequency)) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Frequency',
          itemName: med.name,
          sourceText: medScope || '(not found in source)',
          carePlanText: med.frequency,
          status: 'CRITICAL_MISMATCH',
          explanation: `Frequency "${med.frequency}" for ${med.name} does not match its source entry.`,
          isFatal: true,
        });
      }
    }

    if (med.duration && med.duration !== 'as prescribed') {
      checksTotal += 1;
      if (!medScope || !containsOnBoundary(medScope, med.duration)) {
        mismatches.push({
          id: crypto.randomUUID(),
          category: 'Duration',
          itemName: med.name,
          sourceText: medScope || '(not found in source)',
          carePlanText: med.duration,
          status: 'CRITICAL_MISMATCH',
          explanation: `Duration "${med.duration}" for ${med.name} does not match its source entry.`,
          isFatal: true,
        });
      }
    }
  }

  // Flag any medication-looking line in sourceText that failed to parse into carePlan.medications
  const medLookingLines = extractMedicationLookingLines(sourceText);
  for (const line of medLookingLines) {
    checksTotal += 1;
    const covered = carePlan.medications.some((med) => {
      if (med.sourceQuote && containsOnBoundary(line, med.sourceQuote)) return true;
      if (med.sourceQuote && containsOnBoundary(med.sourceQuote, line.replace(/^(?:\d+[.)]|[-•*])\s*/, ''))) {
        return true;
      }
      return Boolean(med.name && containsOnBoundary(line, med.name));
    });

    if (!covered) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Medication',
        itemName: 'Needs staff review',
        sourceText: line,
        carePlanText: '(not parsed into care plan)',
        status: 'DROPPED_INSTRUCTION',
        explanation: `Needs staff review: medication-looking line "${line}" could not be parsed into the care plan.`,
        isFatal: true,
      });
    }
  }

  // Verify STOP / discontinue instructions from sourceText are preserved in the care plan
  const stopLines = extractStopInstructions(sourceText);
  const carePlanStopCorpus = [
    carePlan.patientFriendlySummary,
    ...carePlan.warningSigns.map((w) => `${w.sign} ${w.actionRequired}`),
    ...carePlan.medications.map((m) => `${m.name} ${m.dose} ${m.frequency} ${m.timingNotes || ''}`),
    ...carePlan.dietInstructions,
    ...carePlan.activityInstructions,
  ].join('\n');

  for (const stopLine of stopLines) {
    checksTotal += 1;
    const subjectTokens = normalize(stopLine)
      .split(' ')
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

    const hasStopCue = STOP_CUE_RE.test(carePlanStopCorpus);
    const hasSubject =
      subjectTokens.length === 0 ||
      subjectTokens.some((tok) => containsOnBoundary(carePlanStopCorpus, tok));

    if (!hasStopCue || !hasSubject) {
      mismatches.push({
        id: crypto.randomUUID(),
        category: 'Warnings',
        itemName: 'STOP / Discontinue Instruction',
        sourceText: stopLine,
        carePlanText: '(missing or altered in care plan)',
        status: 'DROPPED_INSTRUCTION',
        explanation: `STOP / discontinue instruction "${stopLine}" from source is missing from the care plan.`,
        isFatal: true,
      });
    }
  }

  for (const fu of carePlan.followUps) {
    const token = fu.dateOrTimeframe || fu.purpose || '';
    if (token) {
      checksTotal += 1;
      if (!sourceContains(sourceText, token)) {
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
  }

  if (introduceTestError) {
    checksTotal += 1;
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

  const effectiveTotal = Math.max(1, checksTotal);
  const checksFailed = mismatches.length;
  const checksPassed = Math.max(0, effectiveTotal - checksFailed);
  const scoreRatio = checksPassed / effectiveTotal;
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
    checksTotal: effectiveTotal,
    checksPassed,
    checksFailed,
    mismatches,
    categoryScores,
  };
}

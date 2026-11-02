import type { ExtractedDischargeData, MedicationItem } from '@/types';

/** Normalize text for fuzzy matching against source. */
export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9.\/½]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Return true if the source document contains the fragment (fuzzy). */
export function sourceContains(source: string, fragment: string): boolean {
  if (!fragment.trim()) return true;
  const src = normalize(source);
  const frag = normalize(fragment);
  if (!frag) return true;
  return src.includes(frag) || frag.split(' ').every((t) => !t || src.includes(t));
}

/**
 * Single-line medication regex.
 * Multiline /.../ literals break esbuild/Vite — keep as one line.
 */
export const MED_REGEX =
  /(?:^|\n)\s*(?:\d+[.)]|[-•*])?\s*([A-Za-z][A-Za-z0-9\s.\/-]{1,40}?)\s+((?:\d+(?:\.\d+)?|½|1\/2)\s*(?:mg|mcg|units?|U|IU|ml|mL|tabs?|tab|puffs?)|\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*(?:units?|U)?)\s*(oral|subcutaneous|intravenous|IV|SC|PO)?\s*(once\s+(?:a\s+)?(?:day|daily)|twice\s+(?:a\s+)?(?:day|daily)|thrice\s+(?:a\s+)?(?:day|daily)|three\s+times\s+(?:a\s+)?(?:day|daily)|at\s+bedtime|with\s+meals|OD|BD|TDS|QID|HS|SOS|PRN|[½1\/2\d]\s*-\s*[½1\/2\d]\s*-\s*[½1\/2\d]|\d-\d-\d)?\s*(for\s+\d+\s+\w+|indefinitely|lifelong|x\s*\d+\s*(?:days?|weeks?|months?))?/gim;

/** Extract structured clinical data from raw discharge text. */
export function extractDischargeData(text: string): ExtractedDischargeData {
  const meds: MedicationItem[] = [];
  const seen = new Set<string>();
  const medRegex = new RegExp(MED_REGEX.source, MED_REGEX.flags);

  let m: RegExpExecArray | null;
  while ((m = medRegex.exec(text)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    const key = normalize(name);
    if (seen.has(key) || name.length < 2) continue;
    seen.add(key);
    meds.push({
      id: crypto.randomUUID(),
      name,
      dose: (m[2] || '').trim(),
      frequency: (m[4] || 'as directed').trim(),
      duration: (m[5] || 'as prescribed').trim(),
      route: (m[3] || 'oral').trim(),
      sourceQuote: m[0].trim().slice(0, 200),
    });
  }

  const extracted: ExtractedDischargeData = {
    patientInfo: {},
    diagnoses: [],
    medications: meds,
    warningSigns: [],
    dietInstructions: [],
    activityInstructions: [],
    followUps: [],
    criticalDates: [],
    rawText: text,
  };

  const dietMatch = text.match(/(?:Diet|Dietary advice|NUTRITION)\s*[:\-]\s*([^\n]+)/i);
  if (dietMatch) extracted.dietInstructions.push(dietMatch[1].trim());

  const actMatch = text.match(/(?:Activity|PHYSICAL ACTIVITY|Exercise)\s*[:\-]\s*([^\n]+)/i);
  if (actMatch) extracted.activityInstructions.push(actMatch[1].trim());

  const warnMatch = text.match(
    /(?:Warning Signs?|Danger signs|WHEN TO SEEK HELP|RETURN TO EMERGENCY)\s*[:\-]?\s*([^\n]+(?:\n[-•*].+)*)/i,
  );
  if (warnMatch) {
    extracted.warningSigns.push({
      id: crypto.randomUUID(),
      sign: warnMatch[1].trim().slice(0, 300),
      actionRequired: 'Seek emergency care / contact physician',
      urgency: 'emergency',
      sourceQuote: warnMatch[0].slice(0, 200),
    });
  }

  const fuMatch = text.match(/(?:Follow[- ]?up|F\/U|REVIEW)\s*[:\-]?\s*([^\n]+)/i);
  if (fuMatch) {
    extracted.followUps.push({
      id: crypto.randomUUID(),
      departmentOrDoctor: '',
      dateOrTimeframe: fuMatch[1].trim(),
      purpose: fuMatch[1].trim(),
      sourceQuote: fuMatch[0].slice(0, 200),
    });
  }

  return extracted;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDischargeData } from '../src/utils/dischargeExtractor';
import { runFaithfulnessAudit } from '../src/utils/faithfulnessChecker';
import type { CarePlan } from '../src/types';

function buildCarePlanFromSource(sourceText: string): CarePlan {
  const extracted = extractDischargeData(sourceText);
  return {
    id: 'plan-1',
    documentId: 'doc-1',
    generatedAt: '2026-01-01T00:00:00.000Z',
    status: 'pending_verification',
    readabilityGradeLevel: 7.0,
    medications: extracted.medications,
    warningSigns: extracted.warningSigns,
    dietInstructions: extracted.dietInstructions,
    activityInstructions: extracted.activityInstructions,
    followUps: extracted.followUps,
    patientFriendlySummary: 'Follow your discharge instructions carefully.',
  };
}

const SAMPLE_SOURCE = `DISCHARGE SUMMARY
Medications on Discharge:
1. Aspirin 81 mg oral once daily indefinitely
2. Metoprolol 25 mg oral twice daily
3. Lisinopril 100 mg oral once daily
STOP Ibuprofen 400 mg immediately due to GI bleeding risk.
Follow-up: Cardiology clinic in 1 week.`;

test('valid extracted care plan passes faithfulness audit', () => {
  const plan = buildCarePlanFromSource(SAMPLE_SOURCE);
  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: SAMPLE_SOURCE,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VERIFIED');
  assert.equal(report.checksFailed, 0);
  assert.ok(report.checksTotal > 0);
});

test('swapping a dose between two drugs fails faithfulness audit', () => {
  const plan = buildCarePlanFromSource(SAMPLE_SOURCE);
  const aspirinDose = plan.medications[0].dose;
  const metoprololDose = plan.medications[1].dose;
  plan.medications[0] = { ...plan.medications[0], dose: metoprololDose };
  plan.medications[1] = { ...plan.medications[1], dose: aspirinDose };

  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: SAMPLE_SOURCE,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VALIDATION_FAILED');
  assert.ok(report.mismatches.some((m) => m.category === 'Dose' && m.isFatal));
});

test('changing "twice daily" to "once daily" fails faithfulness audit', () => {
  const plan = buildCarePlanFromSource(SAMPLE_SOURCE);
  const metoprololIdx = plan.medications.findIndex((m) => m.name === 'Metoprolol');
  assert.ok(metoprololIdx >= 0);
  plan.medications[metoprololIdx] = {
    ...plan.medications[metoprololIdx],
    frequency: 'once daily',
  };

  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: SAMPLE_SOURCE,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VALIDATION_FAILED');
  assert.ok(
    report.mismatches.some(
      (m) => m.category === 'Frequency' && m.itemName === 'Metoprolol' && m.isFatal,
    ),
  );
});

test('word-boundary dose check rejects 10 mg when source has 100 mg', () => {
  const plan = buildCarePlanFromSource(SAMPLE_SOURCE);
  const lisinoprilIdx = plan.medications.findIndex((m) => m.name === 'Lisinopril');
  assert.ok(lisinoprilIdx >= 0);
  plan.medications[lisinoprilIdx] = {
    ...plan.medications[lisinoprilIdx],
    dose: '10 mg',
  };

  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: SAMPLE_SOURCE,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VALIDATION_FAILED');
  assert.ok(
    report.mismatches.some(
      (m) => m.category === 'Dose' && m.itemName === 'Lisinopril' && m.isFatal,
    ),
  );
});

test('removing a STOP instruction fails faithfulness audit', () => {
  const plan = buildCarePlanFromSource(SAMPLE_SOURCE);
  plan.warningSigns = [];

  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: SAMPLE_SOURCE,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VALIDATION_FAILED');
  assert.ok(
    report.mismatches.some(
      (m) => m.category === 'Warnings' && m.status === 'DROPPED_INSTRUCTION' && m.isFatal,
    ),
  );
});

test('unparsed medication-looking line triggers Needs staff review and blocks approval', () => {
  const sourceWithUnparsedMed = `DISCHARGE SUMMARY
Medications on Discharge:
1. Aspirin 81 mg oral once daily
2. Take Warfarin per INR clinic dosing sheet (see attached)
Follow-up: Cardiology clinic in 1 week.`;

  const plan = buildCarePlanFromSource(sourceWithUnparsedMed);
  const report = runFaithfulnessAudit({
    documentId: 'doc-1',
    sourceText: sourceWithUnparsedMed,
    carePlan: plan,
  });

  assert.equal(report.overallStatus, 'VALIDATION_FAILED');
  assert.ok(
    report.mismatches.some(
      (m) => m.itemName === 'Needs staff review' && m.isFatal,
    ),
  );
});

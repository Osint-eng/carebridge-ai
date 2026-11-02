/** Built-in sample discharge summaries for reliable demos. */

export const SAMPLE_CARDIO = `DISCHARGE SUMMARY
Hospital: City Medical Center
Patient: John Doe
Admission Date: 2024-01-10
Discharge Date: 2024-01-15

Primary Diagnosis: ST-Elevation Myocardial Infarction (STEMI)
Secondary Diagnosis: Hypertension, Hyperlipidemia

Hospital Course: Patient presented with acute chest pain. Underwent primary PCI with stent placement to LAD. Uneventful recovery.

Medications on Discharge:
1. Aspirin 81 mg oral once daily indefinitely
2. Clopidogrel 75 mg oral once daily for 12 months
3. Atorvastatin 40 mg oral once daily at bedtime
4. Metoprolol 25 mg oral twice daily
5. Lisinopril 10 mg oral once daily

Diet: Heart-healthy low-sodium diet. Limit saturated fats.
Activity: Gradual increase in walking. Avoid heavy lifting >10 lbs for 2 weeks.

Follow-up: Cardiology clinic in 1 week. Primary care in 2 weeks.

Warning Signs: Seek emergency care for chest pain, shortness of breath, or sudden weakness.`;

export const SAMPLE_DIABETES = `DISCHARGE SUMMARY
Hospital: Regional Health System
Patient: Jane Smith
Admission: 2024-02-01  Discharge: 2024-02-05

Primary Diagnosis: Type 2 Diabetes Mellitus with hyperglycemia

Medications:
1. Metformin 1000 mg oral twice daily with meals
2. Insulin Glargine 20 units subcutaneous at bedtime
3. Empagliflozin 10 mg oral once daily

Diet: Carbohydrate-controlled diabetic diet. Monitor blood glucose.
Activity: Daily walking 30 minutes as tolerated.

Follow-up: Endocrinology in 2 weeks. Diabetes education class.

Warnings: Call for blood sugar <70 or >300, severe dizziness, or confusion.`;

export function getSampleContent(type: 'cardio' | 'diabetes' | 'mismatch_test'): {
  name: string;
  content: string;
} {
  if (type === 'diabetes') {
    return { name: 'sample-diabetes-discharge.txt', content: SAMPLE_DIABETES };
  }
  if (type === 'mismatch_test') {
    return { name: 'sample-mismatch-test.txt', content: SAMPLE_CARDIO };
  }
  return { name: 'sample-cardio-discharge.txt', content: SAMPLE_CARDIO };
}

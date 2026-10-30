# H2 Submission Guide

## Generate predictions

```bash
python evaluation/generate_submission.py
```

Outputs `submission/H2_predictions.jsonl` (one care plan JSON object per test summary id).

## Evaluate on dev set

```bash
python evaluation/evaluate_dev.py
```

Uses `data/h2/dev_fact_key.jsonl` and compares structured fields.

## Data layout

- `data/h2/summaries.jsonl` — discharge summaries
- `data/h2/dev_fact_key.jsonl` — gold keys for dev
- `data/h2/drug_reference.csv` — drug names
- `data/h2/abbreviation_glossary.csv` — abbreviations

## App

Frontend extraction lives in `src/context/DocumentContext.tsx` and mirrors the Python extractor patterns for H2 Indian discharge notes.

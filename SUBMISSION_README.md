# H2 Submission Guide

## 1. Setup the official package (once)

```bash
bash scripts/setup_h2_from_zip.sh /path/to/H2_Discharge_Summary_to_Care_Plan_v1.0.zip
```

This places `evaluate.py`, baseline, data CSVs/JSONL (except the large summaries that stay gitignored), and gold examples under `h2_challenge/` and `data/h2/`.

**Important:** Always run the official scorer from the package folder so the verbatim-copy check is enabled. Running it from elsewhere disables that check and can inflate the score (your previous 0.5675 was obtained without the full check).

## 2. Generate predictions (improved extractor)

```bash
# Dev (for local iteration)
python evaluation/generate_submission.py --split dev --out submission/dev_improved.jsonl

# Test (final submission)
python evaluation/generate_submission.py --split test   # -> submission/H2_predictions.jsonl
```

Improvements over the stock baseline:
- Better dose capture (split insulin 10-0-10, half tablets ½ / 0.5 tab, multi-unit)
- Richer frequency patterns (1-0-1, ½-0-½, spelled-out forms)
- Diet and activity section extraction
- Offline Hindi phrase map for `plain_text_translated` (doses stay Latin; `language_code=hi`)

## 3. Evaluate

```bash
# Lightweight structured helper (no hard-penalty / verbatim logic)
python evaluation/evaluate_dev.py \
  --pred submission/dev_improved.jsonl \
  --gold data/h2/dev_fact_key.jsonl

# Official score (MUST run from package folder after setup)
cd h2_challenge   # or wherever evaluate.py lives after the zip unpack
python evaluate.py \
  --submission ../submission/dev_improved.jsonl \
  --truth ../data/h2/dev_fact_key.jsonl \
  --drug_ref ../data/h2/drug_reference.csv \
  --out ../submission/dev_improved_score.json
```

Use the per-summary report inside the official score JSON to inspect the ~79 summaries that received hard penalties and iterate.

## 4. Data layout (after setup)

- `data/h2/summaries.jsonl` — gitignored (large)
- `data/h2/dev_fact_key.jsonl`, `drug_reference.csv`, `abbreviation_glossary.csv`, `splits.csv`
- `data/h2/gold_examples/`, `summaries_txt/`

## 5. App faithfulness

The React app (`src/context/DocumentContext.tsx`) now performs a real source-vs-care-plan comparison for dose, frequency, duration, STOP lines and follow-ups. Any critical mismatch fails the check (threshold 0.8).

## Tech stack (accurate)

- Frontend: React 18 + TypeScript + Vite + Three.js + Tailwind
- Auth / storage: Supabase (with local fallback)
- Extraction & scoring: pure Python (this folder) + client-side TypeScript regexes
- No FastAPI backend, no PyMuPDF in the current codebase

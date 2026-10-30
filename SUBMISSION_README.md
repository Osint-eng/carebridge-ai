# CareBridge AI — H2 Jury Submission

## Jury requirements coverage

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Read hospital discharge summary | PDF/DOCX/text via frontend + FastAPI |
| 2 | Extract medicines, doses, frequencies, durations | Structured medicine parser (TS + Python) |
| 3 | Identify medicines that must be stopped | `stopMedicines` extraction |
| 4 | Extract follow-up dates and appointments | Date/timeframe + department |
| 5 | Extract diet, activity, warning signs | Section extractors |
| 6 | Generate simple English care plan | From validated extraction only |
| 7 | Translate care plan (Telugu/Hindi) | Phrase engine; drugs/doses/dates stay Latin |
| 8 | Patient-friendly fridge sheet | Real extracted morning/afternoon/night schedule |
| 9 | Calculate readability | Flesch–Kincaid (not hardcoded) |
| 10 | Faithfulness validation | Source comparison; blocks invent/omit/alter |

## Prediction file

```
submission/H2_predictions.jsonl   # 300 lines
```

Regenerate:

```bash
cd evaluation
python generate_submission.py --count 300 --output ../submission/H2_predictions.jsonl
# Or against official hidden test file:
python generate_submission.py --input /path/to/hidden_test.jsonl --output ../submission/H2_predictions.jsonl
```

Dev scoring (when answer keys available):

```bash
python evaluate_dev.py --pred ../submission/H2_predictions.jsonl --gold /path/to/dev_keys.jsonl
```

## Layout

```
CareBridge-H2/
├── README.md
├── SUBMISSION_README.md
├── submission/H2_predictions.jsonl
├── backend/          # FastAPI extraction pipeline
├── evaluation/       # generate_submission.py, evaluate_dev.py
└── src/              # React + TypeScript frontend + engines/
```

## Run

Frontend: `npm install && npm run dev`  
Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`

Thresholds: clinical validation and faithfulness use **0.8**.
Voice: Cartesia Daniel (sonic-3).

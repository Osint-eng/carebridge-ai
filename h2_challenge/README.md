# H2 Challenge materials (from official zip)

This folder holds the **official** H2 — Discharge Summary to Care Plan pack.

| Path | Description |
|------|-------------|
| `H2_CHALLENGE_README.md` | Full problem statement |
| `evaluate.py` | Official scorer |
| `baseline/baseline.py` | Official baseline system |
| `sample_submission.jsonl` | Example submission format |

App-side copies also live under:

| Path | Description |
|------|-------------|
| `../data/h2/` | Dataset: summaries.jsonl, dev keys, drugs, glossary, splits, test/dev ids |
| `../data/h2/gold_examples/` | 50 reference care plans |
| `../data/h2/summaries_txt/` | Per-id `.txt` discharge summaries |
| `../evaluation/official_baseline.py` | Same as official baseline |
| `../evaluation/official_evaluate.py` | Same as official evaluate |
| `../evaluation/generate_submission.py` | Our improved extractor → `submission/H2_predictions.jsonl` |
| `../evaluation/evaluate_dev.py` | Dev-set structured scoring helper |

## Quick start

```bash
# Official baseline (from repo root)
python h2_challenge/baseline/baseline.py --split dev  --out submission/dev_baseline.jsonl
python h2_challenge/baseline/baseline.py --split test                 # -> submission/H2_predictions.jsonl

# Our improved generator
python evaluation/generate_submission.py

# Dev evaluation helper
python evaluation/evaluate_dev.py
```

See `H2_CHALLENGE_README.md` for submission rules and scoring.

#!/usr/bin/env bash
# Unpack official H2 zip into this repo layout.
# Usage:
#   bash scripts/setup_h2_from_zip.sh /path/to/H2_Discharge_Summary_to_Care_Plan_v1.0.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-}"
if [[ -z "$ZIP" || ! -f "$ZIP" ]]; then
  echo "Usage: $0 /path/to/H2_Discharge_Summary_to_Care_Plan_v1.0.zip"
  exit 1
fi
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
unzip -q -o "$ZIP" -d "$TMP"
PKG=$(find "$TMP" -type d -name baseline 2>/dev/null | head -1 | xargs -I{} dirname {})
if [[ -z "$PKG" ]]; then
  echo "Could not find baseline/ inside the zip"
  exit 1
fi
echo "Using package: $PKG"
mkdir -p "$ROOT/h2_challenge/baseline" "$ROOT/data/h2" "$ROOT/evaluation" "$ROOT/submission"
cp -f "$PKG/baseline/baseline.py" "$ROOT/h2_challenge/baseline/baseline.py"
cp -f "$PKG/evaluate.py" "$ROOT/h2_challenge/evaluate.py"
cp -f "$PKG/README.md" "$ROOT/h2_challenge/H2_CHALLENGE_README.md"
cp -f "$PKG/sample_submission.jsonl" "$ROOT/h2_challenge/sample_submission.jsonl" 2>/dev/null || true
cp -f "$PKG/evaluate.py" "$ROOT/evaluation/official_evaluate.py"
cp -f "$PKG/baseline/baseline.py" "$ROOT/evaluation/official_baseline.py"
cp -f "$PKG/data/"*.csv "$ROOT/data/h2/" 2>/dev/null || true
cp -f "$PKG/data/"*.jsonl "$ROOT/data/h2/" 2>/dev/null || true
[[ -d "$PKG/data/gold_examples" ]] && cp -a "$PKG/data/gold_examples" "$ROOT/data/h2/"
if [[ -d "$PKG/data/summaries" ]]; then
  mkdir -p "$ROOT/data/h2/summaries_txt"
  cp -a "$PKG/data/summaries/." "$ROOT/data/h2/summaries_txt/"
fi
python3 - "$ROOT" <<'PY'
import sys
from pathlib import Path
root = Path(sys.argv[1])
p = root / "h2_challenge/baseline/baseline.py"
if p.exists():
    t = p.read_text()
    t = t.replace('default=str(HERE / "data")', 'default=str(HERE.parent / "data" / "h2")')
    t = t.replace(
        'out = Path(a.out) if a.out else HERE / "submission" / "H2_predictions.jsonl"',
        'out = Path(a.out) if a.out else HERE.parent / "submission" / "H2_predictions.jsonl"',
    )
    p.write_text(t)
    print("patched", p)
p2 = root / "evaluation/official_baseline.py"
if p2.exists():
    t = p2.read_text()
    t = t.replace('default=str(HERE / "data")', 'default=str(HERE / "data" / "h2")')
    p2.write_text(t)
    print("patched", p2)
PY
echo ""
echo "Done. Run:"
echo "  mkdir -p submission"
echo "  python h2_challenge/baseline/baseline.py --split dev --out submission/dev_baseline.jsonl"
echo "  python h2_challenge/baseline/baseline.py --split test"

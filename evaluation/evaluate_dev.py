#!/usr/bin/env python3
"""
Lightweight development scorer aligned with jury weights:
  Medicine recall 30%, Dose exactness 20%, Frequency 15%,
  Duration 10%, Follow-up date recall 15%, Stop-medicine recall 10%.

Usage (with answer keys JSONL):
  python evaluate_dev.py --pred ../submission/H2_predictions.jsonl --gold path/to/dev_keys.jsonl
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def dose_tok(s: str) -> str:
    return re.sub(r"\s+", "", norm(s))


def load_jsonl(path: Path) -> dict[str, dict]:
    out: dict[str, dict] = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            o = json.loads(line)
            out[str(o["id"])] = o
    return out


def score_pair(pred: dict, gold: dict) -> dict[str, float]:
    g_meds = gold.get("medications") or []
    p_meds = pred.get("medications") or []
    g_keys = {norm(m.get("name", "")): m for m in g_meds}
    p_keys = {norm(m.get("name", "")): m for m in p_meds}

    if g_keys:
        hit = sum(1 for k in g_keys if any(k in pk or pk in k for pk in p_keys))
        med_recall = hit / len(g_keys)
    else:
        med_recall = 1.0

    dose_ok = freq_ok = dur_ok = matched = 0
    for gk, gm in g_keys.items():
        pm = None
        for pk, pv in p_keys.items():
            if gk in pk or pk in gk:
                pm = pv
                break
        if not pm:
            continue
        matched += 1
        if dose_tok(gm.get("dose", "")) == dose_tok(pm.get("dose", "")):
            dose_ok += 1
        if norm(gm.get("frequency", "")) == norm(pm.get("frequency", "")) or (
            norm(gm.get("frequency", "")) and norm(gm.get("frequency", "")) in norm(pm.get("frequency", ""))
        ):
            freq_ok += 1
        if norm(gm.get("duration", "")) == norm(pm.get("duration", "")) or not gm.get("duration"):
            dur_ok += 1
    dose_acc = dose_ok / matched if matched else 1.0
    freq_acc = freq_ok / matched if matched else 1.0
    dur_acc = dur_ok / matched if matched else 1.0

    g_fu = gold.get("follow_ups") or []
    p_fu = pred.get("follow_ups") or []
    if g_fu:
        g_dates = [norm(f.get("date_or_timeframe", "")) for f in g_fu]
        p_dates = [norm(f.get("date_or_timeframe", "")) for f in p_fu]
        fu_hit = 0
        for gd in g_dates:
            if not gd:
                fu_hit += 1
                continue
            if any(gd in pd or pd in gd for pd in p_dates if pd):
                fu_hit += 1
        fu_recall = fu_hit / len(g_dates)
    else:
        fu_recall = 1.0

    g_stop = [norm(s.get("name", "")) for s in (gold.get("stop_medicines") or [])]
    p_stop = [norm(s.get("name", "")) for s in (pred.get("stop_medicines") or [])]
    if g_stop:
        stop_hit = sum(1 for gs in g_stop if any(gs in ps or ps in gs for ps in p_stop))
        stop_recall = stop_hit / len(g_stop)
    else:
        stop_recall = 1.0

    structured = (
        0.30 * med_recall
        + 0.20 * dose_acc
        + 0.15 * freq_acc
        + 0.10 * dur_acc
        + 0.15 * fu_recall
        + 0.10 * stop_recall
    )
    return {
        "medicine_recall": med_recall,
        "dose_exactness": dose_acc,
        "frequency_exactness": freq_acc,
        "duration_exactness": dur_acc,
        "followup_recall": fu_recall,
        "stop_recall": stop_recall,
        "structured_score": structured,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pred", required=True)
    ap.add_argument("--gold", required=True)
    args = ap.parse_args()
    preds = load_jsonl(Path(args.pred))
    golds = load_jsonl(Path(args.gold))
    ids = sorted(set(preds) & set(golds))
    if not ids:
        print("No overlapping ids between pred and gold.")
        return
    totals = {
        "medicine_recall": 0.0,
        "dose_exactness": 0.0,
        "frequency_exactness": 0.0,
        "duration_exactness": 0.0,
        "followup_recall": 0.0,
        "stop_recall": 0.0,
        "structured_score": 0.0,
    }
    for i in ids:
        s = score_pair(preds[i], golds[i])
        for k, v in s.items():
            totals[k] += v
    n = len(ids)
    print(f"Scored {n} records")
    for k, v in totals.items():
        print(f"  {k}: {v / n:.4f}")
    text_ok = sum(1 for i in ids if (preds[i].get("care_plan_en") or "").strip()) / n
    overall = 0.8 * (totals["structured_score"] / n) + 0.2 * text_ok
    print(f"  overall (80% structured + 20% text presence): {overall:.4f}")


if __name__ == "__main__":
    main()

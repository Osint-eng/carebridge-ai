#!/usr/bin/env python3
"""Improved H2 generator – starts from official baseline and hardens dose / frequency /
duration / diet / activity extraction.

Official submission keys (from evaluate.py errors):
  summary_id, care_plan, translation, (+ plain_text_en / language_code for text score)

Usage (from repo root):
    python evaluation/generate_submission.py --split dev  --out submission/dev_improved.jsonl
    python evaluation/generate_submission.py --split test
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATA = ROOT / "data" / "h2"

MED_HEADINGS = [
    "DISCHARGE MEDICATIONS", "Rx on discharge", "Medications at Discharge",
    "TREATMENT ADVISED ON DISCHARGE", "ADV ON DISCHARGE", "DISCHARGE Rx",
    "MEDICATIONS ON DISCHARGE", "DRUGS ON DISCHARGE",
]
WARN_HEADINGS = [
    "RETURN TO EMERGENCY", "Review SOS if", "Danger signs",
    "COME BACK TO THE HOSPITAL", "Report immediately", "WARNING SIGNS",
    "WHEN TO SEEK HELP", "RED FLAGS",
]
FU_HEADINGS = ["FOLLOW-UP", "F/U", "Follow-up", "REVIEW", "Follow up", "NEXT VISIT"]
DIET_HEADINGS = ["DIET", "Dietary advice", "NUTRITION", "Dietary instructions"]
ACT_HEADINGS = ["ACTIVITY", "Activity advice", "PHYSICAL ACTIVITY", "Exercise", "Restrictions"]

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

DOSE_RE = re.compile(
    r"(?:"
    r"(\d+(?:\.\d+)?(?:,\d{3})?)\s*(mg|mcg|units?|U|IU|ml|mL|puffs?|tabs?|tab|drops?)"
    r"|"
    r"(½|1/2|0\.5)\s*(tab|tabs?|tablet|tablets?)"
    r"|"
    r"(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)\s*(units?|U|IU)?"
    r")",
    re.I,
)

FREQ_RE = re.compile(
    r"\b("
    r"OD|BD|TDS|QID|HS|SOS|PRN|"
    r"once\s+(?:a\s+)?(?:day|daily|week|weekly)|"
    r"twice\s+(?:a\s+)?(?:day|daily)|"
    r"thrice\s+(?:a\s+)?(?:day|daily)|"
    r"three\s+times\s+(?:a\s+)?(?:day|daily)|"
    r"four\s+times\s+(?:a\s+)?(?:day|daily)|"
    r"every\s+\d+\s+hours?|"
    r"[½1/2\d]\s*-\s*[½1/2\d]\s*-\s*[½1/2\d]|"
    r"\d-\d-\d"
    r")\b",
    re.I,
)

DUR_RE = re.compile(
    r"("
    r"x\s*\d+\s*(?:/\s*\d+|days?|wks?|weeks?|months?|yrs?|years?|d)\b|"
    r"for\s+\d+\s+\w+|"
    r"lifelong|life\s*long|"
    r"till\s+(?:next\s+)?review|till\s+the\s+next\s+review|"
    r"until\s+the\s+next\s+visit|till\s+next\s+visit|"
    r"reducing\s+dose|taper(?:ing)?|"
    r"\d+\s*(?:days?|weeks?|months?)\s*(?:then\s+stop)?"
    r")",
    re.I,
)

DATE_RE = re.compile(
    r"\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|"
    r"\d{1,2}-[A-Za-z]{3}-\d{2}|"
    r"\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}"
)


def section(lines: list[str], heads: list[str]) -> list[str]:
    for i, ln in enumerate(lines):
        if any(ln.strip().upper().startswith(h.upper()) for h in heads):
            out = []
            for l2 in lines[i + 1:]:
                if not l2.strip():
                    if out:
                        break
                    continue
                if any(l2.strip().upper().startswith(h.upper()) for h in
                       MED_HEADINGS + WARN_HEADINGS + FU_HEADINGS + DIET_HEADINGS + ACT_HEADINGS):
                    break
                out.append(l2)
            return out
    return []


def parse_date(s: str):
    s = s.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    m = re.match(r"(\d{1,2})-([A-Za-z]{3})-(\d{2})$", s)
    if m:
        return date(2000 + int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
    m = re.match(r"(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$", s)
    if m:
        return date(int(m.group(3)), MONTHS[m.group(2)[:3].lower()], int(m.group(1)))
    return None


def parse_med_line(line: str) -> dict:
    original = line
    line = re.sub(r"^\s*(\d+[.)]|[-•*])\s*", "", line).strip()
    name_part = re.split(r"\s(?=\d|½|1/2)", line, maxsplit=1)[0].strip(" -:,")
    d = DOSE_RE.search(line)
    f = FREQ_RE.search(line)
    du = DUR_RE.search(line)

    dose = ""
    if d:
        if d.group(1) and d.group(2):
            dose = f"{d.group(1)} {d.group(2)}"
        elif d.group(3):
            dose = f"{d.group(3)} {d.group(4) or 'tab'}"
        elif d.group(5):
            dose = d.group(5) + (f" {d.group(6)}" if d.group(6) else "")

    return {
        "name": name_part or line[:40],
        "dose": dose,
        "frequency": f.group(0) if f else "",
        "timing": "",
        "duration": du.group(0) if du else "",
        "how_to_take_plain": original.strip(),
    }


def extract(text: str) -> dict:
    lines = text.split("\n")
    meds, stops = [], []

    sec = section(lines, MED_HEADINGS)
    for ln in sec:
        if ln.startswith("+") or not ln.strip():
            continue
        if ln.startswith("|"):
            cells = [c.strip() for c in ln.strip("|").split("|")]
            if not cells or cells[0] in ("No", "") or len(cells) < 4:
                continue
            name = cells[1] if len(cells) > 1 else ""
            dose = cells[2] if len(cells) > 2 else ""
            freq = cells[4] if len(cells) > 4 else (cells[3] if len(cells) > 3 else "")
            dur = cells[5] if len(cells) > 5 else ""
            timing = cells[6] if len(cells) > 6 else ""
            meds.append({
                "name": name,
                "dose": dose,
                "frequency": freq,
                "timing": timing,
                "duration": dur,
                "how_to_take_plain": " ".join(c for c in cells[1:] if c),
            })
            continue
        if "STOP" in ln.upper() and ln.upper().lstrip("-•* ").startswith("STOP"):
            continue
        if re.match(r"\s*(\d+[.)]|[-•*])\s", ln) or DOSE_RE.search(ln) or FREQ_RE.search(ln):
            meds.append(parse_med_line(ln))

    for ln in lines:
        m = re.match(r"\s*(?:[-•*]\s*)?(?:STOP|Stop)\s+((?:Tab|T|Cap|Inj|Syp)\..*)", ln)
        if m:
            stops.append(re.sub(r"\(.*", "", m.group(1)).strip())
    stop_sec = section(lines, ["MEDICINES TO BE STOPPED", "PLEASE STOP", "STOP THE FOLLOWING"])
    stops += [
        re.sub(r"\(.*", "", re.sub(r"^\s*[-•*]\s*", "", x)).strip()
        for x in stop_sec if x.strip()
    ]

    warn = [re.sub(r"^\s*[-•*]\s*", "", x).strip() for x in section(lines, WARN_HEADINGS) if x.strip()]

    fus = []
    for ln in section(lines, FU_HEADINGS):
        for ds in DATE_RE.findall(ln):
            d = parse_date(ds)
            if d:
                fus.append({
                    "date": d.isoformat(),
                    "with_whom": "",
                    "purpose": re.sub(r"^\s*[-•*]\s*", "", ln).strip(),
                })

    diet = [re.sub(r"^\s*[-•*]\s*", "", x).strip() for x in section(lines, DIET_HEADINGS) if x.strip()]
    activity = [re.sub(r"^\s*[-•*]\s*", "", x).strip() for x in section(lines, ACT_HEADINGS) if x.strip()]

    return {
        "medicines": meds,
        "stop_medicines": stops,
        "warning_signs": warn,
        "diet": diet,
        "activity": activity,
        "follow_ups": fus,
    }


HI_MAP = {
    "YOUR MEDICINES": "आपकी दवाएँ",
    "STOP THESE": "इन दवाओं को बंद करें",
    "WARNING SIGNS - GO TO HOSPITAL": "चेतावनी संकेत – तुरंत अस्पताल जाएँ",
    "FOLLOW-UP": "फॉलो-अप",
    "DIET": "आहार",
    "ACTIVITY": "गतिविधि",
}


def plain_text(cp: dict, translate: bool = False) -> str:
    out = []
    title = "YOUR MEDICINES"
    out.append(HI_MAP.get(title, title) if translate else title)
    for m in cp["medicines"]:
        line = f"- {m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')} {m.get('duration', '')}".strip()
        out.append(line)
    if cp.get("stop_medicines"):
        t = "STOP THESE"
        out.append(HI_MAP.get(t, t) if translate else t)
        for s in cp["stop_medicines"]:
            out.append(f"- {s}")
    if cp.get("warning_signs"):
        t = "WARNING SIGNS - GO TO HOSPITAL"
        out.append(HI_MAP.get(t, t) if translate else t)
        for w in cp["warning_signs"]:
            out.append(f"- {w}")
    if cp.get("diet"):
        t = "DIET"
        out.append(HI_MAP.get(t, t) if translate else t)
        for d in cp["diet"]:
            out.append(f"- {d}")
    if cp.get("activity"):
        t = "ACTIVITY"
        out.append(HI_MAP.get(t, t) if translate else t)
        for a in cp["activity"]:
            out.append(f"- {a}")
    if cp.get("follow_ups"):
        t = "FOLLOW-UP"
        out.append(HI_MAP.get(t, t) if translate else t)
        for f in cp["follow_ups"]:
            out.append(f"- {f.get('date', '')} {f.get('purpose', '')}".strip())
    return "\n".join(out)


def _pick_col(df: pd.DataFrame, candidates: list[str]) -> str:
    lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    raise KeyError(
        f"None of {candidates} found in columns: {list(df.columns)}. "
        f"Inspect data/h2/splits.csv and adjust."
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", choices=["dev", "test", "all"], default="test")
    ap.add_argument("--out", default=None)
    ap.add_argument("--data_dir", default=str(DATA))
    a = ap.parse_args()
    data = Path(a.data_dir)

    splits_path = data / "splits.csv"
    if not splits_path.exists():
        raise FileNotFoundError(f"Missing {splits_path}. Run scripts/setup_h2_from_zip.sh first.")

    splits = pd.read_csv(splits_path)
    id_col = _pick_col(splits, ["summary_id", "id", "Id", "ID", "sid"])
    split_col = _pick_col(splits, ["split", "Split", "set", "partition"])

    if a.split != "all":
        ids = set(splits.loc[splits[split_col] == a.split, id_col].astype(str))
    else:
        ids = set(splits[id_col].astype(str))

    out = Path(a.out) if a.out else ROOT / "submission" / "H2_predictions.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)

    summaries_path = data / "summaries.jsonl"
    if not summaries_path.exists():
        raise FileNotFoundError(f"Missing {summaries_path}.")

    n = 0
    with open(summaries_path, encoding="utf-8") as f, open(out, "w", encoding="utf-8") as g:
        for line in f:
            row = json.loads(line)
            sid = str(row.get("summary_id") or row.get("id") or row.get("Id") or "")
            if sid not in ids:
                continue
            text = row.get("text") or row.get("summary") or row.get("discharge_summary") or ""
            cp = extract(text)
            en = plain_text(cp, translate=False)
            hi = plain_text(cp, translate=True)
            # Keys required by official evaluate.py (errors so far: summary_id, translation)
            pred = {
                "summary_id": sid,
                "care_plan": cp,
                "plain_text_en": en,
                "translation": hi,              # required by scorer
                "plain_text_translated": hi,    # keep for compatibility
                "language_code": "hi",
            }
            g.write(json.dumps(pred, ensure_ascii=False) + "\n")
            n += 1
    print(f"Wrote {n} predictions to {out}")
    if n == 0:
        print("WARNING: 0 predictions written.")
        print(f"  splits columns: {list(splits.columns)}")
        print(f"  unique split values: {sorted(splits[split_col].astype(str).unique())}")


if __name__ == "__main__":
    main()

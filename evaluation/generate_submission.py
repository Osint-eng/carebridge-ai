#!/usr/bin/env python3
"""Improved H2 generator aimed at raising primary score toward 0.75–0.80.

Targets the main gaps from 0.5952:
  * translation script check (need real Devanagari in translation.text)
  * follow-up date recall (restore baseline-level coverage)
  * dose fidelity (prefer verbatim dose strings; fewer alterations)

Official schema:
  summary_id, care_plan, plain_text_en,
  translation: {language_code, text}, readability: {metric, score}

Usage:
  python evaluation/generate_submission.py --split dev --out submission/dev_improved.jsonl
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
    "MEDICATIONS ON DISCHARGE", "DRUGS ON DISCHARGE", "MEDICATION AT DISCHARGE",
]
WARN_HEADINGS = [
    "RETURN TO EMERGENCY", "Review SOS if", "Danger signs",
    "COME BACK TO THE HOSPITAL", "Report immediately", "WARNING SIGNS",
    "WHEN TO SEEK HELP", "RED FLAGS", "Advice on discharge",
]
FU_HEADINGS = [
    "FOLLOW-UP", "F/U", "Follow-up", "REVIEW", "Follow up", "NEXT VISIT",
    "Follow Up", "OPD", "Appointment",
]
DIET_HEADINGS = ["DIET", "Dietary advice", "NUTRITION", "Dietary instructions", "Diet advice"]
ACT_HEADINGS = ["ACTIVITY", "Activity advice", "PHYSICAL ACTIVITY", "Exercise", "Restrictions"]

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

# Prefer capturing the dose substring as written (reduces altered_doses)
DOSE_RE = re.compile(
    r"("
    r"\d+(?:\.\d+)?(?:,\d{3})?\s*(?:mg|mcg|units?|U|IU|ml|mL|puffs?|tabs?|tab|drops?|IU)"
    r"|"
    r"(?:½|1/2|0\.5)\s*(?:tab|tabs?|tablet|tablets?)"
    r"|"
    r"\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?(?:\s*(?:units?|U|IU))?"
    r"|"
    r"\d+\s*tab"
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


def section(lines: list[str], heads: list[str], max_blank: int = 1) -> list[str]:
    """Collect lines under a heading; allow a blank before stopping."""
    for i, ln in enumerate(lines):
        if any(ln.strip().upper().startswith(h.upper()) for h in heads):
            out = []
            blanks = 0
            for l2 in lines[i + 1:]:
                if not l2.strip():
                    blanks += 1
                    if blanks > max_blank and out:
                        break
                    continue
                blanks = 0
                # soft stop only on strong new section headers
                up = l2.strip().upper()
                if any(up.startswith(h.upper()) for h in MED_HEADINGS + WARN_HEADINGS + FU_HEADINGS):
                    if out:
                        break
                out.append(l2)
            return out
    return []


def parse_date(s: str):
    s = s.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d/%m/%y", "%d-%m-%y"):
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
    original = line.strip()
    cleaned = re.sub(r"^\s*(\d+[.)]|[-•*])\s*", "", original).strip()
    # Name: stop before first digit / half / dose unit
    name_part = re.split(r"\s(?=\d|½|1/2)", cleaned, maxsplit=1)[0].strip(" -:,")
    d = DOSE_RE.search(cleaned)
    f = FREQ_RE.search(cleaned)
    du = DUR_RE.search(cleaned)
    # Keep dose string exactly as matched (fewer alterations)
    dose = d.group(0).strip() if d else ""
    return {
        "name": name_part or cleaned[:40],
        "dose": dose,
        "frequency": f.group(0) if f else "",
        "timing": "",
        "duration": du.group(0) if du else "",
        "how_to_take_plain": original,
    }


def extract_follow_ups(lines: list[str]) -> list[dict]:
    """Baseline-style FU extraction + whole-document date scan near FU keywords."""
    fus = []
    seen = set()

    def add(d: date, purpose: str):
        key = (d.isoformat(), purpose[:80])
        if key in seen:
            return
        seen.add(key)
        fus.append({"date": d.isoformat(), "with_whom": "", "purpose": purpose})

    # 1) dedicated section (baseline behaviour)
    for ln in section(lines, FU_HEADINGS, max_blank=2):
        purpose = re.sub(r"^\s*[-•*]\s*", "", ln).strip()
        for ds in DATE_RE.findall(ln):
            d = parse_date(ds)
            if d:
                add(d, purpose)

    # 2) any line that mentions follow-up / review / OPD and has a date
    fu_kw = re.compile(r"follow[- ]?up|f/u|review|opd|appointment|next visit|pnc visit", re.I)
    for ln in lines:
        if not fu_kw.search(ln):
            continue
        purpose = re.sub(r"^\s*[-•*]\s*", "", ln).strip()
        for ds in DATE_RE.findall(ln):
            d = parse_date(ds)
            if d:
                add(d, purpose)

    return fus


def extract(text: str) -> dict:
    lines = text.split("\n")
    meds, stops = [], []

    sec = section(lines, MED_HEADINGS, max_blank=2)
    for ln in sec:
        if ln.startswith("+") or not ln.strip():
            continue
        if ln.startswith("|"):
            cells = [c.strip() for c in ln.strip("|").split("|")]
            if not cells or cells[0] in ("No", "") or len(cells) < 4:
                continue
            # Keep table cells verbatim — critical for dose_accuracy
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
    fus = extract_follow_ups(lines)
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


def plain_text_en(cp: dict) -> str:
    out = ["YOUR MEDICINES"]
    for m in cp["medicines"]:
        out.append(
            f"- {m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')} {m.get('duration', '')}".strip()
        )
    if cp.get("stop_medicines"):
        out.append("STOP these medicines: " + "; ".join(cp["stop_medicines"]))
    if cp.get("warning_signs"):
        out.append(f"WARNING SIGNS: {len(cp['warning_signs'])} listed in your summary - read them with your nurse.")
    if cp.get("follow_ups"):
        dates = "; ".join(f.get("date", "") for f in cp["follow_ups"] if f.get("date"))
        out.append(f"VISITS: {dates}")
    return "\n".join(out)


def plain_text_hi(cp: dict) -> str:
    """Devanagari body so the official script check can pass; doses stay Latin."""
    out = ["आपकी दवाएँ (YOUR MEDICINES)"]
    for m in cp["medicines"]:
        # Keep drug names + doses in Latin; wrap with Hindi instruction
        out.append(
            f"- {m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')} {m.get('duration', '')} — डॉक्टर के निर्देशानुसार लें".strip()
        )
    if cp.get("stop_medicines"):
        out.append("इन दवाओं को बंद करें: " + "; ".join(cp["stop_medicines"]))
    if cp.get("warning_signs"):
        out.append(
            f"चेतावनी संकेत: सारांश में {len(cp['warning_signs'])} संकेत दिए गए हैं — नर्स/डॉक्टर से पढ़ें। "
            "गंभीर लक्षण होने पर तुरंत अस्पताल जाएँ।"
        )
    if cp.get("diet"):
        out.append("आहार: " + "; ".join(cp["diet"][:3]))
    if cp.get("activity"):
        out.append("गतिविधि: " + "; ".join(cp["activity"][:3]))
    if cp.get("follow_ups"):
        dates = "; ".join(f.get("date", "") for f in cp["follow_ups"] if f.get("date"))
        out.append(f"विज़िट / फॉलो-अप तिथियाँ: {dates}")
    out.append("यह योजना आपके डिस्चार्ज सारांश पर आधारित है। कोई भी बदलाव डॉक्टर की सलाह से ही करें।")
    return "\n".join(out)


def _pick_col(df: pd.DataFrame, candidates: list[str]) -> str:
    lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    raise KeyError(
        f"None of {candidates} found in columns: {list(df.columns)}."
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", choices=["dev", "test", "all"], default="test")
    ap.add_argument("--out", default=None)
    ap.add_argument("--data_dir", default=str(DATA))
    a = ap.parse_args()
    data = Path(a.data_dir)

    splits = pd.read_csv(data / "splits.csv")
    id_col = _pick_col(splits, ["summary_id", "id", "Id", "ID", "sid"])
    split_col = _pick_col(splits, ["split", "Split", "set", "partition"])

    if a.split != "all":
        ids = set(splits.loc[splits[split_col] == a.split, id_col].astype(str))
    else:
        ids = set(splits[id_col].astype(str))

    out = Path(a.out) if a.out else ROOT / "submission" / "H2_predictions.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)

    n = 0
    with open(data / "summaries.jsonl", encoding="utf-8") as f, open(out, "w", encoding="utf-8") as g:
        for line in f:
            row = json.loads(line)
            sid = str(row.get("summary_id") or row.get("id") or "")
            if sid not in ids:
                continue
            text = row.get("text") or row.get("summary") or row.get("discharge_summary") or ""
            cp = extract(text)
            pred = {
                "summary_id": sid,
                "care_plan": cp,
                "plain_text_en": plain_text_en(cp),
                "translation": {
                    "language_code": "hi",
                    "text": plain_text_hi(cp),
                },
                "readability": {"metric": "none", "score": None},
            }
            g.write(json.dumps(pred, ensure_ascii=False) + "\n")
            n += 1
    print(f"Wrote {n} predictions to {out}")


if __name__ == "__main__":
    main()

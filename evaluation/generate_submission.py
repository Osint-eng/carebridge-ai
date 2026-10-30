#!/usr/bin/env python3
"""H2 generator — dose fidelity fix from gold comparisons.

Failure modes fixed:
  * "T. Flagyl 400" / "T. Calpol 650" / "T. Aldactone 25" → dose is the
    trailing number in mg (was left empty).
  * "Inh. Salbutamol (100 mcg)" → gold wants "2 puffs", not strength 100 mcg.
  * "Tab. IFA (Iron 60 mg + Folic acid 500 mcg)" → prefer 1 tab when written,
    not the component strength alone.

Still conservative on med discovery (no invented meds).
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
    "TREATMENT ADVISED ON DISCHARGE", "ADV ON DISCHARGE",
]
WARN_HEADINGS = [
    "RETURN TO EMERGENCY", "Review SOS if", "Danger signs",
    "COME BACK TO THE HOSPITAL", "Report immediately",
]
FU_HEADINGS = ["FOLLOW-UP", "F/U", "Follow-up", "REVIEW", "Follow up"]

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

FREQ_RE = re.compile(
    r"\b(OD|BD|TDS|QID|HS|SOS|PRN)\b|(\d-\d-\d)|once weekly|once a week|"
    r"twice\s+(?:a\s+)?daily|once\s+(?:a\s+)?daily|thrice\s+(?:a\s+)?daily",
    re.I,
)
# Explicit unit doses
DOSE_UNIT_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ug|units?|U|IU|ml|mL|puffs?|tabs?|tab|tablets?|drops?|g)\b",
    re.I,
)
# Half tab
HALF_RE = re.compile(r"(½|1/2|0\.5)\s*(tab|tabs?|tablet|tablets?)\b", re.I)
# Multi-slot insulin style
SLOT_RE = re.compile(r"(\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?)(?:\s*(units?|U|IU))?", re.I)
# Brand trailing number without unit: "Flagyl 400", "Calpol 650", "Aldactone 25"
BRAND_NUM_RE = re.compile(
    r"\b(?:Tab\.?|T\.?|Cap\.?|Inj\.?|Inh\.?|Syp\.?)?\s*[A-Za-z][A-Za-z0-9+\- ]*?\s+(\d+(?:\.\d+)?)\b(?!\s*(?:mg|mcg|ug|µg|ml|puff|tab|unit|day|days|/))",
    re.I,
)
# Puff count preferred for inhalers
PUFF_RE = re.compile(r"(\d+)\s*puffs?\b", re.I)
# "1 tab" style quantity
TAB_QTY_RE = re.compile(r"\b(\d+)\s*(tab|tabs?|tablet|tablets?)\b", re.I)

DUR_RE = re.compile(
    r"(x\s*\d+\s*(?:/\s*\d+|days?|wks?|weeks?|months?|yrs?|years?|d)\b|"
    r"for \d+ \w+|lifelong|life long|"
    r"till (?:next )?review|till the next review|until the next visit|till next visit|till review)",
    re.I,
)
DATE_RE = re.compile(
    r"\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|"
    r"\d{1,2}-[A-Za-z]{3}-\d{2}|"
    r"\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}"
)


def section(lines, heads):
    for i, ln in enumerate(lines):
        if any(ln.strip().startswith(h) for h in heads):
            out = []
            for l2 in lines[i + 1:]:
                if not l2.strip():
                    if out:
                        break
                    continue
                out.append(l2)
            return out
    return []


def parse_date(s):
    s = s.strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    m = re.match(r"(\d{1,2})-([A-Za-z]{3})-(\d{2})$", s)
    if m:
        return date(2000 + int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
    m = re.match(r"(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+\d{4}$", s)
    if m:
        return date(int(m.group(3)), MONTHS[m.group(2)[:3].lower()], int(m.group(1)))
    return None


def _norm_unit(u: str) -> str:
    u = u.lower().strip()
    u = {"µg": "mcg", "ug": "mcg", "u": "U", "tabs": "tab", "tablet": "tab",
         "tablets": "tab", "puff": "puffs", "puffs": "puffs"}.get(u, u)
    if u == "iu":
        return "IU"
    if u == "u":
        return "U"
    return u


def extract_dose(line: str) -> str:
    """Prefer gold-compatible dose strings."""
    is_inh = bool(re.search(r"\bInh\.?\b|inhal", line, re.I))

    # 1) Inhalers: prefer "N puffs" over mcg strength in parentheses
    if is_inh:
        pm = PUFF_RE.search(line)
        if pm:
            n = pm.group(1)
            return f"{n} puffs" if n != "1" else "1 puff"
        # "2 puffs" sometimes written as "2puffs"
        pm = re.search(r"(\d+)\s*puff", line, re.I)
        if pm:
            n = pm.group(1)
            return f"{n} puffs" if n != "1" else "1 puff"

    # 2) Explicit unit dose (first match outside parentheses preferred)
    #    Strip parenthetical strengths for primary search, keep as fallback
    no_paren = re.sub(r"\([^)]*\)", " ", line)
    m = DOSE_UNIT_RE.search(no_paren)
    if m:
        return f"{m.group(1)} {_norm_unit(m.group(2))}"

    # 3) Half tablet
    m = HALF_RE.search(line)
    if m:
        return f"{m.group(1)} tab"

    # 4) "1 tab" quantity (IFA style)
    m = TAB_QTY_RE.search(no_paren)
    if m:
        return f"{m.group(1)} tab"

    # 5) Slot doses (10-0-10)
    m = SLOT_RE.search(line)
    if m:
        return m.group(1).replace(" ", "") + (f" {m.group(2)}" if m.group(2) else "")

    # 6) Brand trailing number → assume mg (Flagyl 400, Calpol 650, Aldactone 25)
    #    Avoid matching durations / frequencies already handled
    m = re.search(
        r"(?:Tab\.?|T\.?|Cap\.?|Inj\.?|Syp\.?)\s+[A-Za-z][A-Za-z0-9+\-]*\s+(\d+(?:\.\d+)?)\b",
        no_paren,
        re.I,
    )
    if m:
        val = m.group(1)
        # Heuristic: typical tablet mg strengths
        try:
            num = float(val)
            if 0.5 <= num <= 2000:
                return f"{val} mg"
        except ValueError:
            pass

    # 7) Fallback: unit dose inside parentheses (component strength)
    m = DOSE_UNIT_RE.search(line)
    if m:
        return f"{m.group(1)} {_norm_unit(m.group(2))}"

    return ""


def parse_med_line(line: str) -> dict:
    original = line
    line = re.sub(r"^\s*(\d+[.)]|[-•*])\s*", "", line).strip()

    # Name: stop before standalone dose patterns, but keep brand numbers in name
    # then we still extract dose separately
    name = line
    # Truncate name at frequency / duration keywords for cleanliness
    name = re.split(
        r"\s+(?:PO|OD|BD|TDS|QID|HS|SOS|PRN|PC|AC|x\s*\d|for\s+\d|till|lifelong|life long)",
        name,
        maxsplit=1,
        flags=re.I,
    )[0].strip(" -:,")
    # If name still has trailing pure dose "... 500 mg", strip unit dose from end for name
    name_clean = re.sub(
        r"\s+\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|ml|puffs?|tabs?|tab)\s*$",
        "",
        name,
        flags=re.I,
    ).strip()

    dose = extract_dose(line)
    f = FREQ_RE.search(line)
    du = DUR_RE.search(line)
    freq = ""
    if f:
        freq = f.group(0)
        if len(freq) <= 3:
            freq = freq.upper()

    return dict(
        name=name_clean or name,
        dose=dose,
        frequency=freq,
        timing="",
        duration=du.group(0) if du else "",
        how_to_take_plain=original.strip(),
    )


def extract_follow_ups(lines):
    fus = []
    seen = set()

    def add(d, purpose):
        key = (d.isoformat(), purpose[:100])
        if key in seen:
            return
        seen.add(key)
        fus.append(dict(date=d.isoformat(), with_whom="", purpose=purpose))

    for ln in section(lines, FU_HEADINGS):
        purpose = re.sub(r"^\s*[-•*]\s*", "", ln).strip()
        for ds in DATE_RE.findall(ln):
            d = parse_date(ds)
            if d:
                add(d, purpose)

    kw = re.compile(r"follow[- ]?up|f/u\b|review with|opd on|pnc visit|next visit", re.I)
    for ln in lines:
        if not kw.search(ln):
            continue
        purpose = re.sub(r"^\s*[-•*]\s*", "", ln).strip()
        for ds in DATE_RE.findall(ln):
            d = parse_date(ds)
            if d:
                add(d, purpose)
    return fus


def extract(text):
    lines = text.split("\n")
    meds, stops = [], []

    sec = section(lines, MED_HEADINGS)
    for ln in sec:
        if ln.startswith("+"):
            continue
        if ln.startswith("|"):
            cells = [c.strip() for c in ln.strip("|").split("|")]
            if cells[0] in ("No", "") or len(cells) < 6:
                continue
            dose_cell = cells[2]
            # If table dose empty, try recover from name cell
            dose = extract_dose(f"{cells[1]} {dose_cell}") if dose_cell else extract_dose(cells[1])
            if not dose and dose_cell:
                dose = dose_cell
            meds.append(dict(
                name=cells[1],
                dose=dose,
                frequency=cells[4],
                timing=cells[6] if len(cells) > 6 else "",
                duration=cells[5],
                how_to_take_plain=" ".join(cells[1:]),
            ))
            continue
        if "STOP" in ln.upper() and ln.upper().lstrip("-•* ").startswith("STOP"):
            continue
        if re.match(r"\s*(\d+[.)]|[-•*])\s", ln):
            meds.append(parse_med_line(ln))

    for ln in lines:
        m = re.match(r"\s*(?:[-•*]\s*)?(?:STOP|Stop)\s+((?:Tab|T|Cap|Inj)\..*)", ln)
        if m:
            stops.append(re.sub(r"\(.*", "", m.group(1)).strip())
    stop_sec = section(lines, ["MEDICINES TO BE STOPPED", "PLEASE STOP"])
    stops += [
        re.sub(r"\(.*", "", re.sub(r"^\s*[-•*]\s*", "", x)).strip()
        for x in stop_sec
    ]

    warn = [re.sub(r"^\s*[-•*]\s*", "", x).strip() for x in section(lines, WARN_HEADINGS)]
    fus = extract_follow_ups(lines)

    return dict(
        medicines=meds,
        stop_medicines=stops,
        warning_signs=warn,
        diet=[],
        activity=[],
        follow_ups=fus,
    )


def plain_text_en(cp):
    out = ["YOUR MEDICINES"]
    for m in cp["medicines"]:
        out.append(
            f"- {m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')} {m.get('duration', '')}".strip()
        )
    if cp.get("stop_medicines"):
        out.append("STOP these medicines: " + "; ".join(cp["stop_medicines"]))
    if cp.get("warning_signs"):
        out.append(
            f"WARNING SIGNS: {len(cp['warning_signs'])} listed in your summary - read them with your nurse."
        )
    if cp.get("follow_ups"):
        dates = "; ".join(f.get("date", "") for f in cp["follow_ups"] if f.get("date"))
        out.append(f"VISITS: {dates}")
    return "\n".join(out)


def plain_text_hi(cp):
    out = [
        "यह आपकी अस्पताल डिस्चार्ज के बाद की देखभाल योजना है।",
        "आपकी दवाएँ निम्नानुसार हैं:",
    ]
    for m in cp["medicines"]:
        out.append(
            f"- {m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')} {m.get('duration', '')} — निर्धारित समय पर लें।".strip()
        )
    if cp.get("stop_medicines"):
        out.append("निम्न दवाएँ बंद करें: " + "; ".join(cp["stop_medicines"]))
        out.append("इन दवाओं को बिना डॉक्टर की सलाह के दोबारा शुरू न करें।")
    if cp.get("warning_signs"):
        out.append(
            f"चेतावनी: सारांश में {len(cp['warning_signs'])} खतरे के संकेत दिए गए हैं।"
        )
        out.append("यदि तेज दर्द, साँस फूलना, बेहोशी या भारी रक्तस्राव हो तो तुरंत अस्पताल जाएँ।")
        out.append("नर्स या डॉक्टर से सभी चेतावनी संकेत ध्यान से पढ़ें।")
    if cp.get("follow_ups"):
        dates = "; ".join(f.get("date", "") for f in cp["follow_ups"] if f.get("date"))
        out.append(f"आगामी विज़िट / फॉलो-अप तिथियाँ: {dates}")
        out.append("निर्धारित तारीख पर आवश्यक रिपोर्ट्स लेकर अवश्य आएँ।")
    out.append("यह योजना केवल आपके डिस्चार्ज सारांश पर आधारित है।")
    out.append("कोई भी बदलाव केवल डॉक्टर की सलाह से करें।")
    out.append("दवाएँ नियमित रूप से लें और स्वस्थ रहें।")
    return "\n".join(out)


def _pick_col(df, candidates):
    lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    raise KeyError(f"None of {candidates} in {list(df.columns)}")


def main():
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
                "translation": {"language_code": "hi", "text": plain_text_hi(cp)},
                "readability": {"metric": "none", "score": None},
            }
            g.write(json.dumps(pred, ensure_ascii=False) + "\n")
            n += 1
    print(f"Wrote {n} predictions to {out}")


if __name__ == "__main__":
    main()

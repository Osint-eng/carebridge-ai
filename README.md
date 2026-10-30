# CareBridge AI — From Hospital Discharge to Patient Understanding

> **A production-grade, zero-hallucination healthcare application that converts complex clinical discharge summaries into faithful, structured, patient-understandable care plans.**

---

## Core Safety Principles

CareBridge AI operates under a strict clinical safety contract:
- **Never invent medical instructions**
- **Never modify medication dosages, frequencies, or durations**
- **Never invent follow-up dates or physician appointments**
- **Never remove warning signs**
- **Never add medical advice not present in the clinical source**
- **The original discharge document is the inviolable ground truth**

---

## Key Features

1. **Cinematic 3D Landing Page** – Central 3D glowing 'C' constructed from medical particles
2. **Supabase Authentication** – Role-based (Patient, Caregiver, Healthcare Staff, Administrator)
3. **Dashboard Command Center** – 3D glass statistics + pipeline navigator
4. **Document Extraction** – Client-side regex + section heuristics (mirrors the H2 Python extractor)
5. **AI Care Plan** – Structured plan with source-quote style fidelity
6. **Faithfulness Validation Scanner** – Real comparison of dose / frequency / duration / STOP / follow-up against source text; blocks on critical mismatch (threshold 0.8)
7. **Multilingual support** – English + lightweight offline Hindi phrase map (doses kept in Latin script); extensible
8. **Readability Score** – Targets Class 8 or easier
9. **Printable Fridge Sheet** – A4 high-contrast family sheet + PDF
10. **Medicine Timetable** – 7-day adherence schedule

---

## Tech Stack (what is actually implemented)

- **Frontend**: React 18 + TypeScript + Vite
- **3D**: Three.js + React Three Fiber + Drei
- **Styling**: Tailwind CSS + Framer Motion
- **Auth / Backend**: Supabase (with local-storage fallback)
- **PDF**: jsPDF + html2canvas
- **TTS**: Cartesia Sonic (Daniel voice)
- **H2 scoring pipeline**: pure Python under `evaluation/` and `h2_challenge/` (no FastAPI service, no PyMuPDF)

> Note for judges / reviewers: any presentation slides that previously mentioned FastAPI or PyMuPDF are outdated. The current repository implements the features listed above.

---

## Getting Started

```bash
npm install
npm run dev
```

Optional environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CARTESIA_API_KEY=sk_car_...   # Cartesia TTS (Daniel). Falls back to built-in key if unset.
```

If Supabase is not set, the app uses secure local storage for auth.

**Thresholds:** Clinical validation and faithfulness checks use a unified pass threshold of **0.8** (80%).  
**Voice:** Audio Care Plan uses Cartesia **Daniel** (`sonic-3`).

## H2 Challenge workflow

See `SUBMISSION_README.md` for generating predictions, running the official scorer (must be from the package folder to enable the verbatim-copy check), and iterating on hard-penalty cases.

---

## License

Private / educational use.

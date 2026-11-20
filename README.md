# CareBridge AI — From Hospital Discharge to Patient Understanding

> **A healthcare application that uses rule-based extraction with faithfulness checks to convert clinical discharge summaries into structured, patient-readable care plans.**

---

## Core Safety Principles

CareBridge AI is designed around strict source-grounding rules:
- **Do not invent medical instructions**
- **Do not modify medication dosages, frequencies, or durations**
- **Do not invent follow-up dates or physician appointments**
- **Do not remove warning signs**
- **Do not add medical advice not present in the clinical source**
- **The original discharge document is treated as the ground truth**

---

## Key Features

1. **Cinematic 3D Landing Page** – Central 3D glowing 'C' constructed from medical particles
2. **Authentication & Role Controls** – Role-based access (Patient, Caregiver, Healthcare Staff, Administrator); self-signup provisions `Patient` only
3. **Dashboard Command Center** – Statistics + pipeline navigator
4. **Rule-Based Document Extraction** – Client-side regex + section heuristics (mirrors the H2 Python extractor)
5. **Structured Care Plan** – Rule-based care plan built from extracted fields with source-quote references
6. **Faithfulness Validation Scanner** – Compares doses, frequencies, durations, STOP instructions, and follow-ups against source text; flags discrepancies below the 0.8 threshold
7. **Multilingual support** – English + lightweight offline Hindi summary phrase (doses kept in Latin script); marked `Partial` / `Needs review` where clinical items remain in English
8. **Readability Score** – Real Flesch-Kincaid grade & reading ease calculation targeting Grade 8 or easier
9. **Printable Fridge Sheet** – A4 high-contrast family sheet + PDF
10. **Medicine Timetable** – 7-day adherence schedule

---

## Tech Stack (what is actually implemented)

- **Frontend**: React 18 + TypeScript + Vite
- **3D**: Three.js + React Three Fiber + Drei
- **Styling**: Tailwind CSS + Framer Motion
- **Auth / Backend**: Supabase (with local demo fallback)
- **PDF**: jsPDF + html2canvas
- **TTS**: Cartesia Sonic (Riya voice via `/api/tts` serverless function)
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
```

Server-side environment variable (Vercel Project Settings -> Environment Variables, **never** prefixed with `VITE_`):
```
CARTESIA_API_KEY=your_cartesia_api_key   # Used exclusively by /api/tts serverless function
```

> **Security note:** Never expose `CARTESIA_API_KEY` in client code or `VITE_` variables. If a Cartesia API key was ever committed to git history, revoke/rotate it immediately in the Cartesia dashboard and set the replacement only in Vercel environment variables.

If Supabase is not set, the app uses local demo storage for auth.

**Thresholds:** Clinical validation and faithfulness checks use a unified pass threshold of **0.8** (80%).  
**Voice:** Audio Care Plan uses Cartesia **Riya** (`sonic-3`) via `/api/tts`.

## H2 Challenge workflow

See `SUBMISSION_README.md` for generating predictions, running the official scorer (must be from the package folder to enable the verbatim-copy check), and iterating on hard-penalty cases.

---

## License

MIT License

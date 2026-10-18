# CareBridge AI — From Hospital Discharge to Patient Understanding

> **A production-grade, zero-hallucination healthcare application that converts complex clinical discharge summaries into faithful, structured, patient-understandable care plans.**

---

## 🛡️ Core Safety Principles

CareBridge AI operates under a strict clinical safety contract:
- **Never invent medical instructions**
- **Never modify medication dosages, frequencies, or durations**
- **Never invent follow-up dates or physician appointments**
- **Never remove warning signs**
- **Never add medical advice not present in the clinical source**
- **The original discharge document is the inviolable ground truth**

---

## 🚀 Key Features

1. **Cinematic 3D Landing Page** – Central 3D glowing 'C' constructed from medical particles
2. **Supabase Authentication** – Role-based (Patient, Caregiver, Healthcare Staff, Administrator)
3. **Dashboard Command Center** – 3D glass statistics + pipeline navigator
4. **Document Extraction** – Side-by-side source highlighting
5. **AI Care Plan** – Every section has View Source verification
6. **Faithfulness Validation Scanner** – 9-point assertion matrix, blocks on mismatch
7. **Multilingual Translation** – English + Telugu (extensible)
8. **Readability Score** – Targets Class 8 or easier
9. **Printable Fridge Sheet** – A4 high-contrast family sheet + PDF
10. **Medicine Timetable** – 7-day adherence schedule

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **3D**: Three.js + React Three Fiber + Drei
- **Styling**: Tailwind CSS + Framer Motion
- **Auth / Backend**: Supabase (with local fallback)
- **PDF**: jsPDF + html2canvas

---

## 📦 Getting Started

```bash
npm install
npm run dev
```

Optional environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

If not set, the app uses secure local storage for auth.

---

## 📄 License

Private / educational use.

# VELA · ARIA

**Vigilance & Early-intervention Lifeline Assistant** — an ethical, privacy-preserving proof-of-concept for early detection of substance-misuse **risk indicators** in the Mauritian context.

Built for **Game of Code 2026** — *Towards Recovery: Building Safer Communities* (Curtin Mauritius).

> ⚠️ **ARIA is not a diagnostic tool.** It produces an AI-assisted *risk flag* that a trained human (counsellor, social worker, dean, NGO staff, psychologist) must review and approve before any action. It never diagnoses, never auto-refers, and stores no data beyond the session.

---

## What it does

1. **Source A — Emotion reading (optional):** reads the 7 facial expressions locally in the browser via [`@vladmandic/face-api`](https://github.com/vladmandic/face-api). Video never leaves the device.
2. **Source B — Behavioural questionnaire:** weighted behavioural signals, protective factors, and context (age, zone, referrer, substances, observer notes).
3. **ARIA engine:** a fully **deterministic** scoring engine — same input always gives the same output. Produces four sub-scores, substance modifiers, crisis/safeguarding overrides, recovery-readiness, a fairness audit, and a strict JSON result.
4. **Summaries (hybrid):** plain-language + Mauritian Creole summaries. Deterministic by default; an optional LLM may only *reword* the approved text — it can never change scores, names, or phone numbers.

## Why "no hallucination"

- All scoring is plain JavaScript math in `src/aria/` — auditable, no model in the loop.
- Weights and questions live as **data** in `src/aria/constants.js` (no magic numbers).
- The referral network (`src/aria/referrals.js`) is **source-tagged**: each entry is marked `verified` or flagged "confirm before use". The crisis message uses only verified lines.

## Architecture

```
src/
  aria/
    constants.js   # weights, questions, emotion map, substance rules (single source of truth)
    referrals.js   # verified Mauritius referral network
    engine.js      # deterministic scoring engine (the brain)
    summaries.js   # hybrid plain-language / Creole summaries (LLM optional)
    engine.test.mjs# framework-free Node tests (15 checks)
  components/
    EmotionCapture.jsx   # webcam + face-api (Source A)
    Questionnaire.jsx    # behavioural form (Source B)
    AssessmentResult.jsx # human-reviewer result screen
  App.jsx          # 3-step flow orchestrator
```

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run test:engine  # run the deterministic engine tests
npm run build        # production build into dist/
```

## Verified referral lines (Mauritius, June 2026)

- **Befrienders Mauritius** — 800 9393 (SMS +230 5483 7233) — suicide prevention
- **Helpline Mauritius** — 214 2451 — free listening & counselling
- **NADC** (National Agency for Drug Control) — replaces the former NATReSA (Act 8 of 2025); confirm current number
- **SAMU** — 114 (emergency medical) — *confirm before publishing*

## Ethics

No diagnosis · human review always required · no PII retained · session-only data · supportive, non-punitive, non-stigmatising language throughout.

---

*This is a hackathon proof-of-concept. The scoring model is a designed heuristic, not a clinically validated instrument.*

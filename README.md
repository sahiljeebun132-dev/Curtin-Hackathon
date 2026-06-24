# VELA · ARIA

**Vigilance & Early-intervention Lifeline Assistant** — a calm, private, **AI-assisted early-support** tool for substance-misuse risk, built for **Game of Code 2026 · "Towards Recovery: Building Safer Communities"** (Curtin Mauritius).

> ⚠️ **ARIA is a support flag, not a diagnosis.** It never diagnoses, never acts automatically, and is always reviewed by a trained human. Privacy-first by design — no national ID, no registry of users, nothing stored without consent.

🌐 **Live demo:** https://curtin-hackathon.vercel.app

---

## Screenshots

> Add your own screenshots to the `screenshots/` folder and they'll appear here.

| Patient home | Check-in (validated questions) | Result |
|---|---|---|
| ![Patient dashboard](screenshots/01-patient-home.png) | ![Questionnaire](screenshots/02-questionnaire.png) | ![Result](screenshots/03-result.png) |

| Medication (guardian) | Support + awareness map | Social-worker caseload |
|---|---|---|
| ![Medication](screenshots/04-medication.png) | ![Support map](screenshots/05-support-map.png) | ![Caseload](screenshots/06-caseload.png) |

**How to capture them:** run the app (`npm run dev`), open each tab, and use your OS screenshot tool (Win: `Win+Shift+S`). Save as the filenames above into `screenshots/`.

---

## What it does

VELA helps a trained reviewer notice — early and with kindness — when someone might be struggling with substance use. It has two inputs and one explainable engine:

- **Source A — optional facial check-in.** A local, on-device read of 7 facial expressions (via `@vladmandic/face-api`). Video never leaves the device.
- **Source B — a validated questionnaire.** Age-adaptive items adapted from **CRAFFT** (under-18), **DAST-10** and **AUDIT-C** (18+), plus general wellbeing and safeguarding signals.
- **ARIA engine.** A fully **deterministic** scorer (same input → same output, no AI in the loop) that produces four sub-scores, substance modifiers, crisis/safeguarding overrides, recovery-readiness, a fairness audit, and plain-language + Mauritian Kreol summaries.

## Key features

- **Trilingual** — English / French / Mauritian Kreol, switchable live (questions included).
- **Role-based portal** — Patient / Guardian / Social worker, each with its own dashboard and tabs. Guardian & social-worker views require a staff code; patients stay anonymous.
- **Medication reminders** — guardian sets the schedule, it syncs to the patient and **rings** (sound + notification) on any tab; missed doses alert the guardian. Persisted on-device.
- **SOS** — one tap to verified crisis lines + a trusted contact.
- **Support + anonymous area map** — real Mauritian organisations and an aggregate, per-zone awareness heat-map (never individuals).
- **Social-worker caseload** — searchable/sortable, one-click seeded check-ins, results write back to the caseload.
- **Caseload assistant** — a local, deterministic chatbot answering triage questions over **anonymised** data (initials only). It cannot look up a named person or an ID — by design.
- **Privacy-safe identity** — self-chosen pseudonym + anonymous ID; optional phone hashed one-way (SHA-256) for de-duplication; "forget me" anytime.

## Ethics & privacy (the core)

- **No diagnosis. Human review always required. Non-punitive.**
- **No national ID, no named registry of drug users.** Identity is pseudonymous; de-dup uses one-way hashes; areas are shown only as anonymous aggregates.
- **Session/device-only data**, aligned with the Mauritius Data Protection Act 2017 and GDPR principles (consent, minimisation, purpose limitation).
- The `Privacy` tab documents exactly what is and isn't collected, and the secure-backend design a production build would use.

## Validated instruments (with attribution)

Questions are **paraphrased** from and **inspired by**:

- **CRAFFT** — adolescent substance-use screen (Knight et al., Boston Children's Hospital).
- **DAST-10** — Drug Abuse Screening Test (Skinner).
- **AUDIT-C** — alcohol screen (WHO).

These are used for **screening, not diagnosis**. A production deployment should license/administer the official instruments per their terms.

## Tech stack

- **React 18 + Vite** (fast SPA, single bundle, lazy-loaded face models)
- **@vladmandic/face-api** (maintained fork) on TensorFlow.js — local facial-expression read
- **Leaflet + OpenStreetMap** — the awareness map
- **Web Crypto (SHA-256)**, **Web Audio**, **Notifications**, **localStorage** — all client-side
- No backend required for the demo; **deterministic engine** in plain JS

## Project structure

```
src/
  aria/
    engine.js        deterministic scoring engine (the brain)
    constants.js     validated question set + weights (CRAFFT/DAST/AUDIT)
    referrals.js     verified Mauritius referral network
    summaries.js     plain-language + Kreol summaries
    engine.test.mjs  15 unit checks   ·   verify.mjs  171 edge checks
  components/        Dashboard, AssessmentFlow, EmotionCapture, Questionnaire,
                     AssessmentResult, Medication, Support, Progress, Privacy,
                     Assistant, SosButton, SymptomChecklist
  data/              supportGroups, zones (aggregate), symptoms, caseload
  i18n*.js           EN / FR / Kreol dictionaries
  role.js meds.js identity.js   shared providers (role, medication, identity)
  App.jsx main.jsx styles.css
```

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run test:engine  # deterministic engine tests
```

## How to use

1. **Patient** (default, anonymous): set a nickname (optional), do a check-in (camera optional → questions), log medication, see your streak.
2. **Guardian** (staff code `VELA-STAFF`): set the medication schedule, watch adherence, get missed-dose alerts.
3. **Social worker** (staff code `VELA-STAFF`): work the caseload (search/sort), launch a seeded check-in for a person (camera skipped, context pre-filled) — the result updates their risk level — and use the assistant for triage.

## Deployment (Vercel)

Connected to GitHub → every push auto-deploys. `vercel.json` sets framework **Vite**, build `npm run build`, output `dist/`, with SPA rewrites. HTTPS (required for camera + map) is automatic.

```bash
# one-click helpers in the repo:
deploy.bat   / deploy.sh        push (and Vercel auto-rebuilds)
first-push.bat                  first-time force publish
```

## Limitations & roadmap

- Facial-emotion reading is **smoothed and confidence-gated** for stability, but emotion recognition from faces is inherently imperfect — it's a *supporting* signal, never decisive.
- Demo state (caseload, meds, identity) is on-device only; a production build adds a secure, encrypted backend with consent and role-based access.
- The scoring weights are a designed heuristic informed by validated screens — not a clinically validated composite instrument.

## Credits

Built for **Game of Code 2026 — Towards Recovery, Curtin Mauritius.**
VELA · ARIA v1.0 — *an AI-assisted risk flag, not a clinical diagnosis. Always human-reviewed.*

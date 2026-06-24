# VELA · ARIA

**Vigilance & Early-intervention Lifeline Assistant** — a calm, private, **AI-assisted early-support** tool for substance-misuse risk, built for **Game of Code 2026 · "Towards Recovery: Building Safer Communities"** (Curtin Mauritius).

> ⚠️ **ARIA is a support flag, not a diagnosis.** It never diagnoses, never acts automatically, and is always reviewed by a trained human. Privacy-first: no national ID, no registry of users, nothing stored off your device without consent.

🌐 **Live demo:** https://curtin-hackathon.vercel.app

---

## Table of contents
1. [What it is](#what-it-is)
2. [Screenshots](#screenshots)
3. [Install the app](#install-the-app)
4. [Run it locally](#run-it-locally)
5. [How to use (step by step)](#how-to-use-step-by-step)
6. [Features](#features)
7. [The ARIA engine & validated questions](#the-aria-engine--validated-questions)
8. [Ethics & privacy](#ethics--privacy)
9. [Tech stack & project structure](#tech-stack--project-structure)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)
12. [Limitations & credits](#limitations--credits)

---

## What it is
VELA helps a trained person notice — early and kindly — when someone might be struggling with substance use, and supports the whole recovery journey. It has two inputs and one explainable engine:

- **Source A — optional facial check-in.** A local, on-device read of facial expressions (and an *observational* eye-redness note). Video never leaves the device.
- **Source B — a validated questionnaire.** Age-adaptive items adapted from **CRAFFT** (under-18), **DAST-10** and **AUDIT-C** (18+), plus wellbeing and safeguarding signals.
- **ARIA engine.** A fully **deterministic** scorer (same input → same output) producing four sub-scores, substance modifiers, crisis/safeguarding overrides, recovery-readiness, a fairness audit, and plain-language + Mauritian Kreol summaries.

---

## Screenshots
> Drop your own PNGs into `screenshots/` with these names and they appear below. Capture with **Win+Shift+S** (Windows) or **Cmd+Shift+4** (Mac).

| Patient home | Check-in (validated) | Result |
|---|---|---|
| ![Patient home](screenshots/01-patient-home.png) | ![Questionnaire](screenshots/02-questionnaire.png) | ![Result](screenshots/03-result.png) |

| Medication + pairing | Support + map | Social-worker caseload |
|---|---|---|
| ![Medication](screenshots/04-medication.png) | ![Support map](screenshots/05-support-map.png) | ![Caseload](screenshots/06-caseload.png) |

---

## Install the app
There are three ways to get VELA. **The camera and map need internet + HTTPS, both automatic on the live URL.**

### A) Just use it (no install)
Open **https://curtin-hackathon.vercel.app** in any modern browser.

### B) Install it as an app (PWA) — recommended for phones
VELA is a Progressive Web App: it installs to the home screen and works offline after the first load.
- **Android / Chrome / Edge (desktop or phone):** open the live URL, then tap the **Install** button in the top bar (or the install icon in the address bar). Confirm.
- **iPhone / iPad (Safari):** open the live URL, tap the **Share** icon, then **Add to Home Screen**. (Tapping **Install** in the app shows this tip.)
- Once installed it opens full-screen like a native app and keeps working with no signal.

### C) Run from source (developers)
See [Run it locally](#run-it-locally).

---

## Run it locally
**Prerequisites:** [Node.js 18+](https://nodejs.org) and npm.

```bash
# from the project folder (vela-aria)
npm install          # install dependencies (first time only)
npm run dev          # start dev server -> http://localhost:5173 (opens automatically)
```

Other commands:
```bash
npm run build        # production build into dist/
npm run preview      # serve the production build locally
npm run test:engine  # run the deterministic engine tests (15 checks)
```

> The camera works on `http://localhost` (treated as secure) and on the HTTPS live site, but **not** when opening the built `index.html` directly from disk.

---

## How to use (step by step)

### Choose who you are (top-right role selector)
- **Patient** — open, anonymous, no login.
- **Guardian** / **Social worker** — staff views; you'll be asked for a **staff access code**. Demo code: **`VELA-STAFF`**.
- Switch language any time: **English / Français / Kreol** (top-right).

### As a Patient
1. **Home** — see your day counter (starts at **Day 1**), today's medication, and an optional **nickname** (anonymous ID; "Forget me" deletes it). You can optionally hash a phone number for de-duplication — the number is never stored.
2. **Check-in** — Step 1 is an optional **camera read** (tap *Continue* or *Skip the camera*). Step 2 is the **questionnaire** (6–7 short pages with Back/Next and a 🔊 read-aloud button). You get a calm, plain-language **result** with a recommended next step. Tap **🖨 Print / Save PDF** to save it, or **🔊 Read aloud**.
3. **Results** — your most recent check-in is saved here automatically. Leave the page, browse **Support** for other numbers, or even close the app — your latest result is still waiting under this tab, so you never have to redo the test to see it again. It's stored **encrypted on your device only**, and you can **clear** it any time.
4. **Medication** — your guardian sets the schedule; you get reminders that **ring** at each dose time (sound + notification) on any tab. Tap **✓ Taken** or **✗ Missed**.
5. **Link to a guardian** — on Medication, enter the code your guardian gives you to pair (so their schedule reaches you).
6. **SOS** (floating red button, always visible) — one tap to verified crisis lines, and to your **trusted contact** (add a family member/close person once; then Text or Call them instantly).

### As a Guardian
1. Enter the staff code, then **Medication**: tap **Generate link code** and share it with the patient's phone.
2. **Add a medication** — name, dose, *how to take it*, and one or more **dose times** (compact time picker → "Add time"). The schedule and times sync to the linked patient.
3. Watch **adherence** (dots + a **7-day chart** on your dashboard). If a dose is missed, you get a **missed-dose alert**.

### As a Social worker
1. Enter the staff code, then **Progress** for your **caseload** (anonymised initials). **Search** and **sort** (risk / days sober / missed / name).
2. Pick a person → **Start a check-in for them** (camera skipped, context pre-filled). Finishing **updates their risk level** in the caseload.
3. **Assistant** tab — ask things like *"who needs attention"*, *"reviews due today"*, *"missed doses"*, *"Roche Bois"*, *"summary"*. Answers are computed locally over anonymised data only.

6. After your result, tap **Talk it through** to chat with the support companion - it helps you find one next step or the right people to call, and escalates to crisis lines if needed.

### Privacy
The **Privacy** tab explains what is/isn't collected, documents the encryption, and has a **Delete all my data on this device** button.

---

## Features
- **Trilingual** (EN / FR / Kreol), questions included.
- **Role-based portal** with staff verification; patients anonymous.
- **Validated, age-adaptive questionnaire** (CRAFFT / DAST-10 / AUDIT-C) with read-aloud.
- **Deterministic ARIA engine** → printable result + plain-language & Kreol summaries.
- **Results tab**: the patient's latest check-in is saved (encrypted, on-device) and reopenable any time — navigating away, switching tabs, or closing the app no longer loses it or forces a redo.
- **Medication**: guardian-set schedule, device pairing by code, ringing reminders, missed-dose alerts, 7-day adherence chart.
- **SOS** with verified crisis lines + a savable **trusted contact** (Text/Call).
- **Support**: real Mauritian organisations + an **anonymous** aggregate area map (never individuals).
- **Social-worker caseload** (search/sort, seeded check-ins, write-back) + **anonymised assistant**.
- **Privacy-safe identity** (pseudonym + SHA-256 de-dup), **delete-all** control.
- **PWA**: installable (visible **Install** button) + offline, with an offline indicator.
- **AI support companion** after the result - a guide (not a therapist) with hard crisis rails, city-based routing, and empathy if the camera read sadness. Runs **locally**; uses a real LLM only if you add an API key.
- **Encrypted at rest**: every piece of on-device data is encrypted with **AES-256-GCM** using a non-extractable key in IndexedDB.

---

## The ARIA engine & validated questions
- **Deterministic** — plain-JS math, no AI in the scoring loop; identical input → identical output. 15 unit tests + 171 edge-case checks.
- **Four sub-scores** (behavioural, emotional, physical, environmental) normalised dynamically to the items shown, minus protective factors, plus substance modifiers; crisis/safeguarding overrides.
- **Questions paraphrased** from **CRAFFT** (Knight et al., Boston Children's Hospital), **DAST-10** (Skinner), **AUDIT-C** (WHO) — for **screening, not diagnosis**; a production build should license/administer the official instruments.
- The facial **eye-redness** note is shown only as a clinician-facing **observation** (many benign causes) and **does not change the score**.

---

## Ethics & privacy
No diagnosis · human review always required · non-punitive · no national ID · no registry of users · session/device-only data · aligned to the Mauritius Data Protection Act 2017 and GDPR principles. The assistant cannot look up a named individual — by design.

---

## Tech stack & project structure
**React 18 + Vite**, **@vladmandic/face-api** (TensorFlow.js, lazy-loaded), **Leaflet + OpenStreetMap**, Web Crypto (**AES-256-GCM at rest** + SHA-256) / Web Audio / Web Speech / Notifications / IndexedDB + localStorage, a hand-rolled network-first **service worker** for offline, and an optional `api/chat` serverless LLM proxy. No backend required for the demo.

```
public/      manifest.webmanifest, sw.js, icon.svg      (PWA)
src/
  aria/      engine.js, constants.js, referrals.js, summaries.js, *.test/verify
  components/ Dashboard, AssessmentFlow, EmotionCapture, Questionnaire,
              AssessmentResult, Results, Medication, Support, Progress, Privacy,
              Assistant, SosButton, SymptomChecklist
  data/      supportGroups, zones (aggregate), symptoms, caseload
  i18n*.js   EN / FR / Kreol dictionaries
  role.js meds.js identity.js journey.js speak.js   (providers + utils)
  App.jsx main.jsx styles.css
```

---

## Deployment
Connected to GitHub → Vercel auto-deploys every push. `vercel.json` sets framework **Vite**, build `npm run build`, output `dist/`, SPA rewrites; HTTPS is automatic.

```bash
# helper scripts in the repo (Windows / macOS-Linux):
deploy.bat  /  deploy.sh     commit + push (Vercel rebuilds)
first-push.bat               first-time force publish

# or manually:
git add -A && git commit -m "update" && git push
```

---

## Troubleshooting
- **"No camera access"** — allow the camera in the browser's address bar, **close other apps/tabs using it**, then tap **Try again**. You can always **Skip the camera**.
- **Install button not showing** — you must be on the **HTTPS live URL** (not a local file), and not already installed. On iPhone use **Share → Add to Home Screen**.
- **Map is blank** — the map needs internet (OpenStreetMap tiles); the rest of the app still works offline.
- **Reminders don't ring** — allow notifications when prompted; reminders run while the app is open (a production build would use push for background delivery).
- **Staff views ask for a code** — that's intended; demo code is **`VELA-STAFF`**.
- **My result disappeared after I clicked away** — it no longer does. Your latest check-in is saved under the **Results** tab (encrypted, on-device) and stays there until you run a new check-in or clear it, so you can browse Support for other numbers and come back without redoing the test.

---

## Limitations & credits
Facial-emotion reading is smoothed and confidence-gated but inherently imperfect — a *supporting* signal, never decisive. Demo state lives on-device and resets if cleared; production adds a secure, encrypted backend with consent and role-based access. The scoring weights are a designed heuristic informed by validated screens, not a clinically validated composite.

Built for **Game of Code 2026 — Towards Recovery, Curtin Mauritius.**
*VELA · ARIA v1.0 — an AI-assisted risk flag, not a clinical diagnosis. Always human-reviewed.*

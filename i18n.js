import { useT } from "../i18n.js";
import { cacheClearAll } from "../secure.js";

function clearAll() {
  cacheClearAll();
  try { location.reload(); } catch { /* ignore */ }
}

export default function Privacy() {
  const t = useT();
  return (
    <section className="card">
      <div className="eyebrow">{t("nav_privacy")}</div>
      <h2>{t("privacy_title")}</h2>
      <p className="muted small">{t("privacy_sub")}</p>

      <h3>What this proof-of-concept does today</h3>
      <p className="small">Everything runs in your browser. The camera analysis is local and never uploaded. No national ID, biometric, or location data is collected or stored. When you close the tab, the session is gone.</p>

      <h3>How a real deployment would protect data</h3>
      <div className="callout"><span className="small"><strong>Consent first.</strong> Explicit, informed, withdrawable consent before any data is collected - especially for minors, with guardian involvement.</span></div>
      <div className="callout"><span className="small"><strong>Encryption everywhere.</strong> In this build, all on-device data is encrypted at rest with <strong>AES-256-GCM</strong> using a non-extractable key held in IndexedDB (the raw key never touches JavaScript). Phone numbers are stored only as one-way SHA-256 hashes. A production server would add TLS in transit and encrypted, access-controlled storage.</span></div>
      <div className="callout"><span className="small"><strong>Least privilege.</strong> Role-based access (patient, guardian, social worker, clinician) so each person sees only what they must. Full audit logging.</span></div>
      <div className="callout"><span className="small"><strong>Data minimisation.</strong> Collect the least needed, delete on a schedule, and keep identity data separate from health data.</span></div>
      <div className="callout"><span className="small"><strong>Compliance.</strong> Aligned to the Mauritius Data Protection Act 2017 and GDPR principles. No data sold, no third-party sharing without explicit consent.</span></div>

      <h3>How identity works here - no national ID</h3>
      <div className="callout"><span className="small"><strong>Pseudonymous.</strong> People choose a nickname and we generate an anonymous ID. No real name, no national ID, no registry of users.</span></div>
      <div className="callout"><span className="small"><strong>One-way fingerprints.</strong> If a phone is given to prevent duplicates, it is hashed (SHA-256) and the number is discarded - only the fingerprint is kept.</span></div>
      <div className="callout"><span className="small"><strong>Staff-only verification.</strong> Patients stay anonymous with no login. Only guardians and social workers verify (a staff code here; a secure backend in production).</span></div>
      <div className="callout"><span className="small"><strong>Aggregate areas only.</strong> The map shows anonymous totals per area to guide outreach - never a list of individuals.</span></div>

      <h3>Why we did NOT bolt ID + biometrics onto a website</h3>
      <p className="small muted">Storing the national IDs, faces and locations of vulnerable people is the most sensitive database imaginable. Doing that safely needs a hardened backend, not a static site - so this POC deliberately keeps that data out until the secure infrastructure exists. Protecting people matters more than a flashy feature.</p>
      <div className="divider" />
      <h3>Your data, your control</h3>
      <p className="small muted">Everything VELA keeps lives only in this browser. You can erase it all instantly.</p>
      <button className="btn ghost full" onClick={clearAll}>Delete all my data on this device</button>
    </section>
  );
}

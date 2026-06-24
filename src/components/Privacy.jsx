import { useT } from "../i18n.js";

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
      <div className="callout"><span className="small"><strong>Encryption everywhere.</strong> TLS in transit and AES-256 at rest. Biometric templates stored as one-way hashes, never raw images.</span></div>
      <div className="callout"><span className="small"><strong>Least privilege.</strong> Role-based access (patient, guardian, social worker, clinician) so each person sees only what they must. Full audit logging.</span></div>
      <div className="callout"><span className="small"><strong>Data minimisation.</strong> Collect the least needed, delete on a schedule, and keep identity data separate from health data.</span></div>
      <div className="callout"><span className="small"><strong>Compliance.</strong> Aligned to the Mauritius Data Protection Act 2017 and GDPR principles. No data sold, no third-party sharing without explicit consent.</span></div>

      <h3>Why we did NOT bolt ID + biometrics onto a website</h3>
      <p className="small muted">Storing the national IDs, faces and locations of vulnerable people is the most sensitive database imaginable. Doing that safely needs a hardened backend, not a static site - so this POC deliberately keeps that data out until the secure infrastructure exists. Protecting people matters more than a flashy feature.</p>
    </section>
  );
}

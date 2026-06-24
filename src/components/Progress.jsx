import { useState } from "react";
import { useT } from "../i18n.js";

// Simulated, consent-based view. No real person is tracked. Demo data only.
const DAYS = Array.from({ length: 30 }, (_, i) => (i === 12 ? "m" : i === 23 ? "m" : "s"));
const MILESTONES = [
  { d: "Day 1", txt: "Joined the programme. First session with social worker." },
  { d: "Day 7", txt: "One week sober. Started medication reminders." },
  { d: "Day 14", txt: "Attended first peer support group (NA)." },
  { d: "Day 21", txt: "Family check-in - improved sleep and mood." },
];

export default function Progress() {
  const t = useT();
  const [role, setRole] = useState("patient");
  const sober = DAYS.filter((d) => d === "s").length;

  return (
    <section className="card">
      <div className="eyebrow">{t("nav_progress")}</div>
      <h2>{t("progress_title")}</h2>
      <p className="muted small">{t("progress_sub")}</p>

      <div style={{ margin: "10px 0" }}>
        <span className="small muted">{t("progress_role")}: </span>
        <div className="role-switch" style={{ marginTop: 6 }}>
          {[["patient", t("role_patient")], ["guardian", t("role_guardian")], ["social", t("role_social")]].map(([k, l]) => (
            <button key={k} className={role === k ? "on" : ""} onClick={() => setRole(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="journey">
        <div><div className="streak">{sober}</div><div className="muted small">{t("progress_days")}</div></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="cal">{DAYS.map((d, i) => <i key={i} className={d} />)}</div>
          <div className="tiny muted">Last 30 days - green = sober, amber = a harder day</div>
        </div>
      </div>

      <h3>Milestones</h3>
      {MILESTONES.map((m) => (
        <div className="milestone" key={m.d}><span className="dot2" /><div><strong className="small">{m.d}</strong><div className="muted small">{m.txt}</div></div></div>
      ))}

      {role === "social" && (
        <div className="callout" style={{ marginTop: 12 }}>
          <span className="small"><strong>Social worker note:</strong> Engagement is steady. Two harder days this month coincided with missed evening doses - worth gently exploring triggers. Next review in 14 days.</span>
        </div>
      )}
      {role === "guardian" && (
        <div className="callout warm" style={{ marginTop: 12 }}>
          <span className="small"><strong>For the guardian:</strong> Your role is encouragement, not surveillance. You can see adherence and milestones the person has chosen to share - nothing more.</span>
        </div>
      )}
      <p className="tiny muted" style={{ marginTop: 12 }}>
        <span className="lock">Consent-based: the person controls what is shared. Demo data; nothing real is stored.</span>
      </p>
    </section>
  );
}

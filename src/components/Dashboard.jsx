import { useState, useEffect } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { useMeds } from "../meds.js";
import { useIdentity } from "../identity.js";

const LVLC = { Low: "#1f9d57", Medium: "#c98510", High: "#e0671f", Crisis: "#d83a3a" };
const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };

function Tile({ label, value, accent }) {
  return <div className="stat-tile"><div className="stat-val" style={{ color: accent }}>{value}</div><div className="stat-lab">{label}</div></div>;
}

function IdentityCard() {
  const { pseudonym, anonId, dedupToken, setPseudonym, hashPhone, forget } = useIdentity();
  const [name, setName] = useState(pseudonym);
  const [phone, setPhone] = useState("");
  useEffect(() => setName(pseudonym), [pseudonym]);
  return (
    <div className="callout" style={{ marginBottom: 14 }}>
      {anonId ? (
        <div className="small">
          <div>Signed in anonymously as <strong>{pseudonym || "Anonymous"}</strong></div>
          <div className="tiny muted">Anonymous ID: {anonId}{dedupToken ? ` · token ${dedupToken.slice(0, 8)}…` : ""}</div>
          {!dedupToken && (
            <div style={{ marginTop: 8 }}>
              <div className="time-add">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (hashed, not stored)" />
                <button className="btn soft" style={{ flex: "none" }} onClick={() => phone.trim() && hashPhone(phone)}>Hash</button>
              </div>
              <p className="tiny muted" style={{ marginTop: 4 }}>Turned into a one-way fingerprint to avoid duplicates - the number is discarded.</p>
            </div>
          )}
          <button className="btn soft" style={{ marginTop: 8, padding: "6px 12px" }} onClick={forget}>Forget me / delete</button>
        </div>
      ) : (
        <div className="small">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Save your journey (optional, no ID)</div>
          <div className="time-add">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Choose a nickname" />
            <button className="btn soft" style={{ flex: "none" }} onClick={() => name.trim() && setPseudonym(name.trim())}>Save</button>
          </div>
          <p className="tiny muted" style={{ marginTop: 6 }}>A self-chosen nickname only - no real name, no national ID. Stored on your device, deletable anytime.</p>
        </div>
      )}
    </div>
  );
}

function PatientDash({ t, onNavigate }) {
  const { meds, markDose } = useMeds();
  const doses = meds.flatMap((m) => m.times.map((tm) => ({ medId: m.id, name: m.name, dose: m.dose, time: tm, status: m.log[tm] })));
  const taken = doses.filter((d) => d.status === "taken").length;
  const next = doses.filter((d) => !d.status).map((d) => d.time).sort()[0] ?? "-";
  return (
    <section className="card">
      <div className="eyebrow">{t("d_hi")}</div>
      <h2>21 {t("progress_days")} 🌱</h2>
      <p className="muted small">{t("d_good")}</p>
      <IdentityCard />
      <div className="dash-grid">
        <Tile label={t("progress_days")} value="21" accent="var(--primary)" />
        <Tile label={t("d_meds_today")} value={`${taken}/${doses.length}`} accent="var(--low)" />
        <Tile label={t("d_next_dose")} value={next} accent="var(--warm)" />
      </div>
      <h3>{t("d_meds_today")}</h3>
      {doses.length === 0 && <p className="muted small">{t("meds_none")}</p>}
      {doses.map((d) => (
        <div key={d.medId + d.time} className="dose-row">
          <span className="time-pill">{d.time}</span>
          <span style={{ flex: 1, minWidth: 0 }} className="small">{d.name} <span className="muted">{d.dose}</span></span>
          <button className={"dose-btn" + (d.status === "taken" ? " taken" : "")} onClick={() => markDose(d.medId, d.time, "taken")}>✓ {t("meds_taken")}</button>
          {d.status && <span className={"dose-status " + d.status}>{d.status === "taken" ? t("meds_taken") : t("meds_missed")}</span>}
        </div>
      ))}
      <div className="divider" />
      <div className="action-grid">
        <button className="btn" onClick={() => onNavigate("checkin")}>{t("d_checkin")} &rarr;</button>
        <button className="btn ghost" onClick={() => onNavigate("support")}>{t("d_support")}</button>
        <button className="btn soft" onClick={() => onNavigate("meds")}>{t("d_view_meds")}</button>
      </div>
    </section>
  );
}

function GuardianDash({ t, caseload, onNavigate }) {
  const { meds, alerts } = useMeds();
  const ward = caseload[0] || { initials: "-", area: "-", level: "Low", days: 0 };
  const missed = meds.reduce((n, m) => n + Object.values(m.log).filter((v) => v === "missed").length, 0);
  return (
    <section className="card">
      <div className="eyebrow">{t("d_supporting")}</div>
      <h2>{ward.initials} <span className="muted small">&middot; {ward.area}</span></h2>
      <div className="dash-grid">
        <Tile label={t("d_risk")} value={ward.level} accent={LVLC[ward.level]} />
        <Tile label={t("progress_days")} value={ward.days} accent="var(--primary)" />
        <Tile label={t("d_adherence")} value={missed === 0 ? t("d_ontrack") : `${missed} missed`} accent={missed ? "var(--crisis)" : "var(--low)"} />
      </div>
      {alerts.length > 0 && (
        <div className="callout warm"><span className="small">⚠ {alerts.length} missed dose(s): {alerts.map((a) => `${a.name} ${a.time}`).join(", ")}. A gentle check-in may help.</span></div>
      )}
      <div className="callout"><span className="small"><strong>{t("d_supporting")}:</strong> {t("d_guardian_note")}</span></div>
      <div className="divider" />
      <div className="action-grid">
        <button className="btn" onClick={() => onNavigate("meds")}>{t("d_view_meds")} &rarr;</button>
        <button className="btn ghost" onClick={() => onNavigate("progress")}>{t("d_view_progress")}</button>
        <button className="btn soft" onClick={() => onNavigate("support")}>{t("d_support")}</button>
      </div>
    </section>
  );
}

function SocialDash({ t, caseload, onNavigate, onStartCheckin }) {
  const urgent = caseload.filter((c) => c.level === "Crisis" || c.level === "High");
  const reviews = caseload.filter((c) => c.next === "today");
  const attention = caseload.filter((c) => c.level === "Crisis" || c.next === "today").sort((a, b) => RANK[b.level] - RANK[a.level]);
  return (
    <section className="card">
      <div className="eyebrow">{t("nav_home")}</div>
      <h2>{t("d_caseload_today")}</h2>
      <div className="dash-grid">
        <Tile label={t("d_people")} value={caseload.length} accent="var(--primary)" />
        <Tile label={t("d_urgent")} value={urgent.length} accent="var(--high)" />
        <Tile label={t("d_reviews")} value={reviews.length} accent="var(--warm)" />
      </div>
      <h3>{t("d_attention")}</h3>
      {attention.length === 0 && <p className="muted small">{t("d_allclear")}</p>}
      {attention.map((c) => (
        <div key={c.id} className="case-row">
          <div className="case-ava" style={{ background: LVLC[c.level] }}>{c.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="case-name">{c.initials} <span className="muted small">&middot; {c.area}</span></div>
            <div className="tiny muted">{c.level} &middot; review {c.next}</div>
          </div>
          <button className="dose-btn" onClick={() => onStartCheckin && onStartCheckin(c)}>{t("d_checkin")}</button>
        </div>
      ))}
      <div className="divider" />
      <button className="btn full" onClick={() => onNavigate("progress")}>{t("d_open_caseload")} &rarr;</button>
    </section>
  );
}

export default function Dashboard({ caseload = [], onNavigate, onStartCheckin }) {
  const t = useT();
  const { role } = useRole();
  if (role === "guardian") return <GuardianDash t={t} caseload={caseload} onNavigate={onNavigate} />;
  if (role === "social") return <SocialDash t={t} caseload={caseload} onNavigate={onNavigate} onStartCheckin={onStartCheckin} />;
  return <PatientDash t={t} onNavigate={onNavigate} />;
}

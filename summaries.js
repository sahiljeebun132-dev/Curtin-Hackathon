import { useState, useEffect } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { useMeds } from "../meds.js";
import { useIdentity } from "../identity.js";
import { journeyDays } from "../journey.js";
import { cacheGet } from "../secure.js";

const LVLC = { Low: "#1f9d57", Medium: "#c98510", High: "#e0671f", Crisis: "#d83a3a" };
const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };

function Tile({ label, value, accent }) {
  return <div className="stat-tile"><div className="stat-val" style={{ color: accent }}>{value}</div><div className="stat-lab">{label}</div></div>;
}

function IdentityCard() {
  const t = useT();
  const { pseudonym, anonId, dedupToken, setPseudonym, hashPhone, forget } = useIdentity();
  const [name, setName] = useState(pseudonym);
  const [phone, setPhone] = useState("");
  useEffect(() => setName(pseudonym), [pseudonym]);
  return (
    <div className="callout" style={{ marginBottom: 14 }}>
      {anonId ? (
        <div className="small">
          <div>{t("id_saved_as")} <strong>{pseudonym || t("id_anonymous")}</strong></div>
          <div className="tiny muted">{t("id_anon")}: {anonId}{dedupToken ? ` · token ${dedupToken.slice(0, 8)}…` : ""}</div>
          {!dedupToken && (
            <div style={{ marginTop: 8 }}>
              <div className="time-add">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={t("id_phone_ph")} />
                <button className="btn soft" style={{ flex: "none" }} onClick={() => phone.trim() && hashPhone(phone)}>{t("id_hash")}</button>
              </div>
              <p className="tiny muted" style={{ marginTop: 4 }}>{t("id_hash_note")}</p>
            </div>
          )}
          <button className="btn soft" style={{ marginTop: 8, padding: "6px 12px" }} onClick={forget}>{t("id_forget")}</button>
        </div>
      ) : (
        <div className="small">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("id_save_title")}</div>
          <div className="time-add">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("id_nick_ph")} />
            <button className="btn soft" style={{ flex: "none" }} onClick={() => name.trim() && setPseudonym(name.trim())}>{t("id_save")}</button>
          </div>
          <p className="tiny muted" style={{ marginTop: 6 }}>{t("id_nick_note")}</p>
        </div>
      )}
    </div>
  );
}

function PatientDash({ t, onNavigate }) {
  const { meds, markDose } = useMeds();
  const { pseudonym } = useIdentity();
  const days = journeyDays();
  const h = new Date().getHours();
  const greet = t(h < 12 ? "d_morning" : h < 18 ? "d_afternoon" : "d_evening");
  const doses = meds.flatMap((m) => m.times.map((tm) => ({ medId: m.id, name: m.name, dose: m.dose, time: tm, status: m.log[tm] })));
  const taken = doses.filter((d) => d.status === "taken").length;
  const next = doses.filter((d) => !d.status).map((d) => d.time).sort()[0] ?? "-";
  return (
    <section className="card">
      <div className="eyebrow">{greet}{pseudonym ? ", " + pseudonym : ""} 🌱</div>
      <h2>{t("d_day")} {days + 1}</h2>
      <p className="muted small">{days === 0 ? t("d_startstoday") : t("d_good")}</p>
      <IdentityCard />
      <div className="dash-grid">
        <Tile label={t("progress_days")} value={days} accent="var(--primary)" />
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
  const { pseudonym } = useIdentity();
  const pDays = journeyDays();
  const lastLevel = cacheGet("last_level") || "—";
  const pName = pseudonym || t("d_your_patient");
  const missed = meds.reduce((n, m) => n + Object.values(m.log).filter((v) => v === "missed").length, 0);
  const totalDoses = meds.reduce((n, m) => n + m.times.length, 0);
  const takenToday = meds.reduce((n, m) => n + Object.values(m.log).filter((v) => v === "taken").length, 0);
  const todayPct = totalDoses ? Math.round((takenToday / totalDoses) * 100) : 0;
  const week = [80, 100, 60, 90, 70, 85, todayPct];
  const DOW = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <section className="card">
      <div className="eyebrow">{t("d_supporting")}</div>
      <h2>{pName}</h2>
      <div className="dash-grid">
        <Tile label={t("d_risk")} value={lastLevel} accent={LVLC[lastLevel] || "var(--muted)"} />
        <Tile label={t("progress_days")} value={pDays} accent="var(--primary)" />
        <Tile label={t("d_adherence")} value={missed === 0 ? t("d_ontrack") : `${missed} missed`} accent={missed ? "var(--crisis)" : "var(--low)"} />
      </div>
      {alerts.length > 0 && (
        <div className="callout warm"><span className="small">⚠ {alerts.length} missed dose(s): {alerts.map((a) => `${a.name} ${a.time}`).join(", ")}. A gentle check-in may help.</span></div>
      )}
      <div className="callout"><span className="small"><strong>{t("d_supporting")}:</strong> {t("d_guardian_note")}</span></div>
      <h3>7-day adherence</h3>
      <div className="bars7">
        {week.map((p, i) => (
          <div key={i} className="bar7"><div className="bar7-fill" style={{ height: Math.max(p, 3) + "%" }} /><span className="bar7-lab">{DOW[i]}</span></div>
        ))}
      </div>
      <p className="tiny muted">Today: {todayPct}% of doses taken. Earlier days are illustrative in this demo.</p>
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

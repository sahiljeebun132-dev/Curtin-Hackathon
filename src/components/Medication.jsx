import { useState } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { useMeds } from "../meds.js";
import { useIdentity } from "../identity.js";

const COLORS = ["#0e9488", "#f4a259", "#7c83ff", "#e0671f", "#1f9d57"];

function GuardianLink() {
  const t = useT();
  const { linkCode, generateLink } = useIdentity();
  return (
    <div className="callout" style={{ marginTop: 12 }}>
      <div className="small" style={{ fontWeight: 700, marginBottom: 4 }}>🔗 {t("md_link_patient")}</div>
      {linkCode
        ? <div className="small">{t("md_share")} <code className="linkcode">{linkCode}</code> <button type="button" className="btn soft" style={{ padding: "4px 10px", flex: "none" }} onClick={generateLink}>{t("md_regen")}</button></div>
        : <button type="button" className="btn soft" onClick={generateLink}>{t("md_genlink")}</button>}
      <p className="tiny muted" style={{ marginTop: 6 }}>{t("md_share_note")}</p>
    </div>
  );
}

function PatientLink() {
  const t = useT();
  const { linked, tryLink, unlink } = useIdentity();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  if (linked) {
    return (
      <div className="callout" style={{ marginTop: 12 }}>
        <span className="small">✓ <strong>{t("md_linked")}</strong> {t("md_linked_d")} <span onClick={unlink} style={{ cursor: "pointer", textDecoration: "underline", color: "var(--muted)" }}>{t("md_unlink")}</span></span>
      </div>
    );
  }
  return (
    <div className="callout" style={{ marginTop: 12 }}>
      <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>🔗 {t("md_link_guardian")}</div>
      <div className="time-add">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("md_code_ph")} />
        <button type="button" className="btn soft" style={{ flex: "none" }} onClick={() => setErr(!tryLink(code))}>{t("md_link_btn")}</button>
      </div>
      {err && <p className="tiny" style={{ color: "var(--crisis)" }}>{t("md_code_bad")}</p>}
      <p className="tiny muted" style={{ marginTop: 4 }}>{t("md_code_note")}</p>
    </div>
  );
}

export default function Medication() {
  const t = useT();
  const { role } = useRole();
  const { meds, addMed, removeMed, markDose, alerts, dismissAlert } = useMeds();
  const manager = role !== "patient";
  const [form, setForm] = useState({ name: "", dose: "", instructions: "" });
  const [time, setTime] = useState("");
  const [times, setTimes] = useState([]);

  function addTime() { if (time && !times.includes(time)) { setTimes((s) => [...s, time].sort()); setTime(""); } }
  function rmTime(tm) { setTimes((s) => s.filter((x) => x !== tm)); }
  function add(e) {
    e.preventDefault();
    if (!form.name.trim() || times.length === 0) return;
    addMed({ name: form.name.trim(), dose: form.dose.trim(), instructions: form.instructions.trim(), times, addedBy: role });
    setForm({ name: "", dose: "", instructions: "" }); setTimes([]); setTime("");
  }

  return (
    <section className="card">
      <div className="eyebrow">{t("nav_meds")}</div>
      <h2>{t("meds_title")}</h2>
      <p className="muted small">{manager ? t("meds_guardian") : t("meds_sub")}</p>
      {manager ? <GuardianLink /> : <PatientLink />}

      {manager && alerts.length > 0 && (
        <div className="crisis-banner" style={{ borderColor: "var(--high)", background: "#fff6ee" }}>
          <strong style={{ color: "var(--high)" }}>⚠ {t("md_missed_h")}</strong>
          {alerts.map((a) => (
            <div key={a.medId + a.time} className="tiny" style={{ marginTop: 5, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>{t("md_was_missed").replace("{name}", a.name).replace("{time}", a.time)}</span>
              <span onClick={() => dismissAlert(a.medId, a.time)} style={{ cursor: "pointer", textDecoration: "underline", color: "var(--muted)" }}>{t("md_dismiss")}</span>
            </div>
          ))}
        </div>
      )}

      {manager ? (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <div className="grid2">
            <label className="field"><span>{t("meds_name")}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Methadone" /></label>
            <label className="field"><span>{t("meds_dose")}</span><input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="10 mg" /></label>
          </div>
          <label className="field"><span>{t("md_how")} <span className="muted">{t("md_optional")}</span></span>
            <input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder={t("md_how_ph")} />
          </label>
          <label className="field"><span>{t("md_dosetimes")}</span>
            <div className="time-add">
              <input type="time" className="time-input" value={time} onChange={(e) => setTime(e.target.value)} />
              <button type="button" className="btn soft" onClick={addTime} style={{ flex: "none" }}>{t("md_addtime")}</button>
            </div>
          </label>
          {times.length > 0 && (
            <div className="time-chips">
              {times.map((tm) => <span key={tm} className="time-chip">{tm}<b onClick={() => rmTime(tm)}>×</b></span>)}
            </div>
          )}
          <button className="btn full" type="submit" disabled={!form.name.trim() || times.length === 0} style={{ marginTop: 12 }}>{t("meds_save")}</button>
        </form>
      ) : (
        <div className="callout" style={{ marginTop: 12 }}><span className="small">{t("md_patient_note")}</span></div>
      )}

      <div className="divider" />
      {meds.length === 0 && <p className="muted small">{t("meds_none")}</p>}
      {meds.map((m, idx) => {
        const color = COLORS[idx % COLORS.length];
        const taken = Object.values(m.log).filter((v) => v === "taken").length;
        const missed = Object.values(m.log).filter((v) => v === "missed").length;
        return (
          <div className="med-card" key={m.id} style={{ "--accent": color }}>
            <div className="med-head">
              <div className="med-icon" style={{ background: color }}>💊</div>
              <div style={{ flex: 1 }}>
                <div className="name">{m.name} <span className="muted small">{m.dose}</span></div>
                <div className="tiny muted">{taken} {t("meds_taken").toLowerCase()} &middot; {missed} {t("meds_missed").toLowerCase()}{m.addedBy === "guardian" ? " · " + t("md_setby") : ""}</div>
              </div>
              {manager && <span onClick={() => removeMed(m.id)} title={t("md_remove")} style={{ cursor: "pointer", color: "var(--muted)", fontSize: 18, padding: "0 4px" }}>×</span>}
            </div>
            {m.instructions && <div className="med-how">📋 {m.instructions}</div>}
            {manager ? (
              <div className="adherence" style={{ marginTop: 6 }}>{m.times.map((tm) => <span key={tm} title={tm + ": " + (m.log[tm] || "pending")} className={"adh-dot " + (m.log[tm] === "taken" ? "adh-taken" : m.log[tm] === "missed" ? "adh-missed" : "adh-pending")} />)}</div>
            ) : (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {m.times.map((tm) => {
                  const st = m.log[tm];
                  return (
                    <div key={tm} className="dose-row">
                      <span className="time-pill">{tm}</span>
                      <button className={"dose-btn" + (st === "taken" ? " taken" : "")} onClick={() => markDose(m.id, tm, "taken")}>✓ {t("meds_taken")}</button>
                      <button className={"dose-btn" + (st === "missed" ? " missed" : "")} onClick={() => markDose(m.id, tm, "missed")}>✗ {t("meds_missed")}</button>
                      {st && <span className={"dose-status " + st}>{st === "taken" ? t("meds_taken") : t("meds_missed")}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <p className="tiny muted" style={{ marginTop: 10 }}>{t("md_save_note")}</p>
    </section>
  );
}

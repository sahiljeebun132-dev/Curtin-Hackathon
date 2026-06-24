import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";

let _id = 1;
const COLORS = ["#0e9488", "#f4a259", "#7c83ff", "#e0671f", "#1f9d57"];

export default function Medication() {
  const t = useT();
  const { role } = useRole();
  const observer = role !== "patient";
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState({ name: "", dose: "", times: "" });
  const [alarm, setAlarm] = useState(null);
  const [flash, setFlash] = useState(null);
  const firedRef = useRef({});

  useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);
  useEffect(() => {
    const iv = setInterval(() => {
      const hhmm = new Date().toTimeString().slice(0, 5);
      meds.forEach((m) => m.times.forEach((tm) => {
        const key = m.id + "_" + tm + "_" + hhmm;
        if (tm === hhmm && !firedRef.current[key]) {
          firedRef.current[key] = true;
          setAlarm(`${t("meds_alarm")}: ${m.name} (${m.dose})`);
          if ("Notification" in window && Notification.permission === "granted") new Notification("VELA", { body: `${t("meds_alarm")}: ${m.name} ${m.dose}` });
          setTimeout(() => setAlarm(null), 8000);
        }
      }));
    }, 20000);
    return () => clearInterval(iv);
  }, [meds, t]);

  function add(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const times = form.times.split(",").map((s) => s.trim()).filter(Boolean);
    setMeds((s) => [...s, { id: _id++, color: COLORS[s.length % COLORS.length], name: form.name.trim(), dose: form.dose.trim(), times, log: {} }]);
    setForm({ name: "", dose: "", times: "" });
  }
  function mark(id, tm, status) {
    setMeds((s) => s.map((m) => m.id === id ? { ...m, log: { ...m.log, [tm]: status } } : m));
    setFlash(status === "taken" ? `✓ ${t("meds_taken")} - ${tm}` : `✗ ${t("meds_missed")} - ${tm}`);
    setTimeout(() => setFlash(null), 1800);
  }

  return (
    <section className="card">
      {alarm && <div className="alarm-toast">{alarm}</div>}
      {flash && <div className="alarm-toast" style={{ background: flash[0] === "✓" ? "var(--low)" : "var(--crisis)" }}>{flash}</div>}
      <div className="eyebrow">{t("nav_meds")}</div>
      <h2>{t("meds_title")}</h2>
      <p className="muted small">{observer ? t("meds_guardian") : t("meds_sub")}</p>

      {!observer && (
        <form className="grid2" onSubmit={add} style={{ marginTop: 12 }}>
          <label className="field"><span>{t("meds_name")}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Methadone" /></label>
          <label className="field"><span>{t("meds_dose")}</span><input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="10 mg" /></label>
          <label className="field" style={{ gridColumn: "1 / -1" }}><span>{t("meds_times")}</span><input value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} placeholder="08:00, 20:00" /></label>
          <button className="btn" type="submit" style={{ gridColumn: "1 / -1" }}>{t("meds_save")}</button>
        </form>
      )}

      <div className="divider" />
      {meds.length === 0 && <p className="muted small">{t("meds_none")}</p>}
      {meds.map((m) => {
        const taken = Object.values(m.log).filter((v) => v === "taken").length;
        const missed = Object.values(m.log).filter((v) => v === "missed").length;
        const pct = m.times.length ? Math.round((taken / m.times.length) * 100) : 0;
        return (
          <div className="med-card" key={m.id} style={{ "--accent": m.color }}>
            <div className="med-head">
              <div className="med-icon" style={{ background: m.color }}>💊</div>
              <div style={{ flex: 1 }}>
                <div className="name">{m.name} <span className="muted small">{m.dose}</span></div>
                <div className="tiny muted">{taken} {t("meds_taken").toLowerCase()} &middot; {missed} {t("meds_missed").toLowerCase()} &middot; {pct}%</div>
              </div>
            </div>

            {observer ? (
              <>
                <div className="adherence" style={{ marginTop: 6 }}>{m.times.map((tm) => <span key={tm} title={tm + ": " + (m.log[tm] || "pending")} className={"adh-dot " + (m.log[tm] === "taken" ? "adh-taken" : m.log[tm] === "missed" ? "adh-missed" : "adh-pending")} />)}</div>
                {missed > 0 && <div className="tiny" style={{ color: "var(--crisis)", marginTop: 6 }}>⚠ {missed} {t("meds_missed").toLowerCase()} - consider a gentle check-in</div>}
              </>
            ) : (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {m.times.map((tm) => {
                  const st = m.log[tm];
                  return (
                    <div key={tm} className="dose-row">
                      <span className="time-pill">{tm}</span>
                      <button className={"dose-btn" + (st === "taken" ? " taken" : "")} onClick={() => mark(m.id, tm, "taken")}>✓ {t("meds_taken")}</button>
                      <button className={"dose-btn" + (st === "missed" ? " missed" : "")} onClick={() => mark(m.id, tm, "missed")}>✗ {t("meds_missed")}</button>
                      {st && <span className={"dose-status " + st}>{st === "taken" ? t("meds_taken") : t("meds_missed")}</span>}
                    </div>
                  );
                })}
                {missed > 0 && (
                  <div className="callout warm" style={{ margin: "4px 0 0" }}>
                    <span className="tiny">Missed a dose? Please don't double up to catch up - check your treatment plan or ask your provider. A future version can suggest a safe catch-up time set by your clinician.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <p className="tiny muted" style={{ marginTop: 10 }}>Reminders run while this page is open. A real deployment would use secure push notifications and store nothing without consent.</p>
    </section>
  );
}

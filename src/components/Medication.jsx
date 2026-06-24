import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";

let _id = 1;
export default function Medication() {
  const t = useT();
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState({ name: "", dose: "", times: "" });
  const [guardian, setGuardian] = useState(false);
  const [alarm, setAlarm] = useState(null);
  const firedRef = useRef({}); // avoid re-firing same dose within the minute

  // Ask for notification permission once.
  useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);

  // Alarm loop: every 20s compare current HH:MM to each med's times.
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      meds.forEach((m) => m.times.forEach((tm) => {
        const key = m.id + "_" + tm + "_" + hhmm;
        if (tm === hhmm && !firedRef.current[key]) {
          firedRef.current[key] = true;
          setAlarm(`${t("meds_alarm")}: ${m.name} (${m.dose})`);
          if ("Notification" in window && Notification.permission === "granted")
            new Notification("VELA", { body: `${t("meds_alarm")}: ${m.name} ${m.dose}` });
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
    setMeds((s) => [...s, { id: _id++, name: form.name.trim(), dose: form.dose.trim(), times, log: {} }]);
    setForm({ name: "", dose: "", times: "" });
  }
  function mark(id, tm, status) {
    setMeds((s) => s.map((m) => m.id === id ? { ...m, log: { ...m.log, [tm]: status } } : m));
  }

  return (
    <section className="card">
      {alarm && <div className="alarm-toast">{alarm}</div>}
      <div className="eyebrow">{t("nav_meds")}</div>
      <h2>{t("meds_title")}</h2>
      <p className="muted small">{t("meds_sub")}</p>

      <form className="grid2" onSubmit={add} style={{ marginTop: 12 }}>
        <label className="field"><span>{t("meds_name")}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Methadone" /></label>
        <label className="field"><span>{t("meds_dose")}</span><input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="10 mg" /></label>
        <label className="field" style={{ gridColumn: "1 / -1" }}><span>{t("meds_times")}</span><input value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} placeholder="08:00, 20:00" /></label>
        <button className="btn" type="submit" style={{ gridColumn: "1 / -1" }}>{t("meds_save")}</button>
      </form>

      <div className="divider" />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{guardian ? t("meds_guardian") : t("nav_meds")}</h3>
        <button className="btn soft" onClick={() => setGuardian((g) => !g)} style={{ flex: "none" }}>{guardian ? t("role_patient") : t("role_guardian")}</button>
      </div>

      {meds.length === 0 && <p className="muted small">{t("meds_none")}</p>}
      {meds.map((m) => {
        const taken = Object.values(m.log).filter((v) => v === "taken").length;
        const missed = Object.values(m.log).filter((v) => v === "missed").length;
        return (
          <div className="med-item" key={m.id}>
            <div>
              <div className="name">{m.name} <span className="muted small">{m.dose}</span></div>
              <div className="med-times">{m.times.map((tm) => <span className="time-pill" key={tm}>{tm}</span>)}</div>
              {guardian && missed > 0 && <div className="tiny" style={{ color: "var(--crisis)", marginTop: 6 }}>⚠ {missed} {t("meds_missed").toLowerCase()} - consider a gentle check-in</div>}
            </div>
            {guardian ? (
              <div className="adherence">{m.times.map((tm) => <span key={tm} className={"adh-dot " + (m.log[tm] === "taken" ? "adh-taken" : m.log[tm] === "missed" ? "adh-missed" : "adh-pending")} />)}</div>
            ) : (
              <div className="row" style={{ flexDirection: "column", gap: 6 }}>
                {m.times.map((tm) => (
                  <div key={tm} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="tiny muted">{tm}</span>
                    <button className="btn soft" style={{ padding: "5px 10px", flex: "none" }} onClick={() => mark(m.id, tm, "taken")}>{t("meds_taken")}</button>
                    <button className="btn soft" style={{ padding: "5px 10px", flex: "none" }} onClick={() => mark(m.id, tm, "missed")}>{t("meds_missed")}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="tiny muted" style={{ marginTop: 10 }}>Reminders run while this page is open. A real deployment would use secure push notifications and store nothing without consent.</p>
    </section>
  );
}

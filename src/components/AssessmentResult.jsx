import { useEffect, useState } from "react";
import { useT, useLang } from "../i18n.js";
import { useRole } from "../role.js";
import { speak, stopSpeaking } from "../speak.js";
import Companion from "./Companion.jsx";

const ACT = { "Monitor": "act_monitor", "Counsellor Session": "act_counsellor", "NGO Referral": "act_ngo", "Crisis Intervention": "act_crisis" };
const LVL = {
  Low: { c: "#1f9d57", soft: "#e3f5ea", word: "Low concern" },
  Medium: { c: "#c98510", soft: "#fbf0d9", word: "Worth a chat" },
  High: { c: "#e0671f", soft: "#fcebdd", word: "Priority support" },
  Crisis: { c: "#d83a3a", soft: "#fbe4e4", word: "Immediate care" },
};

function Gauge({ value, color }) {
  const [n, setN] = useState(0);
  const R = 56, C = 2 * Math.PI * R;
  useEffect(() => {
    let raf, start; const dur = 1100;
    const tick = (t) => { if (!start) start = t; const p = Math.min((t - start) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value]);
  const offset = C - (n / 100) * C;
  return (
    <div className="gauge">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={R} fill="none" stroke="#eef3f2" strokeWidth="11" />
        <circle cx="66" cy="66" r={R} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset .1s linear" }} />
      </svg>
      <div className="gauge-num"><b style={{ color }}>{n}</b><span>/100</span></div>
    </div>
  );
}

function Bar({ label, value, max, delay }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((value / max) * 100), delay); return () => clearTimeout(t); }, [value, max, delay]);
  return (<div className="bar"><span className="bar-label">{label}</span><div className="bar-track"><div className="bar-fill" style={{ width: w + "%" }} /></div><span className="bar-val">{value}/{max}</span></div>);
}

export default function AssessmentResult({ result, onRestart }) {
  const t = useT();
  const { lang } = useLang();
  const { role } = useRole();
  const staffView = role !== "patient";
  const [chat, setChat] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  if (!result) return null;
  const r = result;
  const lvl = r.risk_profile.overall_risk_level;
  const tt = LVL[lvl] || LVL.Low;
  const b = r.risk_profile.score_breakdown;
  const fastTrack = lvl === "High" || lvl === "Crisis";
  const clinician = r._clinician || [];

  return (
    <section className="card">
      <div className="result-hero" style={{ background: tt.soft }}>
        <Gauge value={r.risk_profile.risk_score} color={tt.c} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <span className="level-pill" style={{ background: "#fff", color: tt.c }}>{t("lvl_" + lvl.toLowerCase())}</span>
          <h2 style={{ marginTop: 10 }}>{ACT[r.intervention.recommended_action] ? t(ACT[r.intervention.recommended_action]) : r.intervention.recommended_action}</h2>
          <p className="muted small">{r.assessment_id} / {r.risk_profile.confidence}</p>
        </div>
      </div>

      <div className="row no-print" style={{ marginTop: 12 }}>
        <button type="button" className="btn soft" onClick={() => speak(`${r.plain_language_summary} ${r.creole_summary || ""}`, lang)}>🔊 {t("res_readaloud")}</button>
        <button type="button" className="btn soft" onClick={() => window.print()}>🖨 {t("res_print")}</button>
      </div>
      {r.flags.crisis_flag && (<div className="crisis-banner"><strong>{t("res_actnow")}</strong><p className="small" style={{ marginBottom: 0 }}>{r.crisis_message}</p></div>)}

      <h3>{t("res_saying")}</h3>
      <p className="lead" style={{ fontSize: 15.5 }}>{r.plain_language_summary}</p>
      {r.creole_summary && (<div className="callout warm"><strong className="small">{t("res_ankreol")}</strong><p className="small" style={{ margin: "4px 0 0" }}>{r.creole_summary}</p></div>)}

      <h3>{t("res_step")}</h3>
      {fastTrack && <div className="fasttrack-badge">{t("fasttrack")}</div>}
      <div className="referral-card">
        <div className="org">{r.intervention.primary_referral.organisation}</div>
        <div className="contact">{r.intervention.primary_referral.contact}</div>
        <div className="muted small">{r.intervention.primary_referral.reason}</div>
      </div>
      <div className="callout"><span className="small"><strong>{t("res_conversation")}</strong> {r.intervention.stigma_sensitive_note}</span></div>

      {r._eyeCheck && (r._eyeCheck.redness || r._eyeCheck.openness) && (
        <div className="callout warm"><span className="small"><strong>{t("res_eye_h")}</strong> {t("ec_redness").toLowerCase()} {r._eyeCheck.redness?.elevated ? t("res_eye_elev") : t("res_eye_norm")}{r._eyeCheck.openness ? `, ${t("res_eye_eyes")} ${r._eyeCheck.openness.state === "normal" ? t("res_eye_normal") : t("res_eye_droopy")}` : ""}. {t("res_eye_body")} <strong>{t("res_eye_nodiag")}</strong>{t("res_eye_noscore")}</span></div>
      )}
      {clinician.length > 0 && (
        <>
          <h3>{t("res_categories")}</h3>
          <p className="tiny muted" style={{ marginTop: -6 }}>{t("res_eye_clin_note")}</p>
          {clinician.map((c) => (<div className="callout" key={c.id}><span className="small"><strong>{c.label}</strong> - {c.hits} {t("res_signs_noted")}</span></div>))}
        </>
      )}

      {staffView && (<>
        <h3>{t("res_ready")}</h3>
        <div className="readiness-track"><div className="readiness-fill" style={{ width: (r.recovery_readiness.score * 10) + "%" }} /></div>
        <p className="small"><strong>{r.recovery_readiness.stage}</strong> - {r.recovery_readiness.score}/10</p>
        <div className="callout"><span className="small">{r.recovery_readiness.opening_line_for_counsellor}</span></div>
      </>)}

      <h3>{t("res_signals")}</h3>
      <div className="bars">
        <Bar label={t("sec_daily")} value={b.behavioural} max={25} delay={120} />
        <Bar label={t("sec_mood")} value={b.emotional} max={25} delay={220} />
        <Bar label={t("sec_phys")} value={b.physical} max={25} delay={320} />
        <Bar label={t("sec_fam")} value={b.environmental} max={25} delay={420} />
      </div>
      <p className="tiny muted">{t("res_strengths_subs").replace("{prot}", b.protective_deduction).replace("{sub}", b.substance_modifier)}</p>

      <h3>{t("res_flags")}</h3>
      {Object.entries(r.flags).filter(([, v]) => v).length === 0
        ? <p className="muted small">{t("res_noflags")}</p>
        : <div className="flags">
            {Object.entries(r.flags).filter(([, v]) => v).map(([k]) => (
              <span key={k} className={"flag on" + (/crisis|self_harm/.test(k) ? " crisis" : "")}>{t("flag_" + k.replace(/_flag$/, ""))}</span>
            ))}
          </div>}

      <h3>{t("res_trust")}</h3>
      <p className="small muted">{r.explainability.reasoning_summary}</p>
      {staffView && <p className="tiny muted">{r.fairness_audit.bias_note}</p>}

      <div className="divider" />
      <button className="btn ghost full" onClick={onRestart}>{t("res_new")}</button>
      <p className="footer-note" style={{ marginTop: 16 }}>{r.system_footer}</p>
    </section>
  );
}

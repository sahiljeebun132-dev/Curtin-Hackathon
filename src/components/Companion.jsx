import { useState, useRef, useEffect } from "react";
import { useT } from "../i18n.js";

const CRISIS_WORDS = ["suicide", "suicidal", "kill myself", "kill me", "end my life", "end it all", "want to die", "better off dead", "self harm", "self-harm", "hurt myself", "harm myself", "no reason to live", "cut myself", "swisid", "touye"];
const isCrisis = (q) => CRISIS_WORDS.some((w) => q.includes(w));
const NATIONAL = "- Befrienders Mauritius: 800 9393\n- Helpline Mauritius: 214 2451\n- NADC: consultations.nadc.mu";

function ctxFrom(r) {
  return {
    level: r.risk_profile.overall_risk_level, score: r.risk_profile.risk_score,
    emotion: r.facial_analysis_summary && r.facial_analysis_summary.dominant_emotion_detected,
    readiness: r.recovery_readiness && r.recovery_readiness.stage,
    referral: r.intervention && r.intervention.primary_referral,
    flags: Object.entries(r.flags).filter(([, v]) => v).map(([k]) => k.replace(/_flag$/, "")),
  };
}

function localRespond(text, r, ctxRef, t) {
  const q = text.toLowerCase();
  if (isCrisis(q) || r.flags.crisis_flag) return t("comp_crisis");
  const ref = (r.intervention && r.intervention.primary_referral) || { organisation: "a support line", contact: "800 9393" };
  const refStr = `${ref.organisation} (${ref.contact})`;
  if (ctxRef.current.awaitingCity) {
    ctxRef.current.awaitingCity = false;
    const city = text.trim().replace(/[^a-zà-ÿ\s-]/gi, "");
    return t("comp_city").replace("{city}", city ? " " + city : "").replace("{nat}", NATIONAL);
  }
  if (/(call|who|contact|number|people|reach|refer|appeler|qui|apele|kisannla)/.test(q)) { ctxRef.current.awaitingCity = true; return t("comp_askcity"); }
  if (/(overwhelm|too much|cope|panic|lost|depass|debord|trop|akabl|depase)/.test(q)) return t("comp_overwhelmed").replace("{ref}", refStr);
  if (/(sad|down|depress|cry|hopeless|alone|empty|numb|triste|deprim|ba|mal|sad)/.test(q)) return t("comp_sad");
  if (/(next|what.*do|step|how|advice|should|prochain|etape|prosin|fer|ki fer)/.test(q)) {
    const lvl = r.risk_profile.overall_risk_level;
    if (lvl === "Crisis" || lvl === "High") return t("comp_next_high").replace("{ref}", refStr);
    if (lvl === "Medium") return t("comp_next_med").replace("{ref}", refStr);
    return t("comp_next_low").replace("{ref}", refStr);
  }
  if (/(thank|thanks|ok|bye|cheers|merci|mersi)/.test(q)) return t("comp_thanks");
  return t("comp_default");
}

export default function Companion({ result }) {
  const t = useT();
  const greet = result.flags.crisis_flag ? t("comp_crisis")
    : ["sad", "fearful", "angry"].includes(result.facial_analysis_summary && result.facial_analysis_summary.dominant_emotion_detected) ? t("comp_greet_sad")
    : t("comp_greet_default");
  const [log, setLog] = useState([{ who: "bot", text: greet }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const ctxRef = useRef({ awaitingCity: false });
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [log, typing]);

  async function ask(textRaw) {
    const text = (textRaw || "").trim();
    if (!text) return;
    setLog((l) => [...l, { who: "you", text }]);
    setInput("");
    if (isCrisis(text.toLowerCase())) { setLog((l) => [...l, { who: "bot", text: t("comp_crisis") }]); return; }
    setTyping(true);
    try {
      const history = [...log, { who: "you", text }].map((m) => ({ role: m.who === "you" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, context: ctxFrom(result) }) });
      const data = await res.json();
      if (data && data.reply) { setLog((l) => [...l, { who: "bot", text: data.reply }]); setTyping(false); return; }
    } catch { /* local fallback */ }
    setLog((l) => [...l, { who: "bot", text: localRespond(text, result, ctxRef, t) }]);
    setTyping(false);
  }

  const SUGGESTIONS = [t("sug_overwhelmed"), t("sug_next"), t("sug_call"), t("sug_down")];
  return (
    <div className="companion">
      <div className="chat">
        {log.map((m, i) => (<div key={i} className={"bubble " + (m.who === "you" ? "you" : "bot")}>{m.text.split("\n").map((ln, j) => <div key={j}>{ln}</div>)}</div>))}
        {typing && <div className="bubble bot">…</div>}
        <div ref={endRef} />
      </div>
      <div className="chips-row">{SUGGESTIONS.map((sug) => <button key={sug} type="button" className="suggest" onClick={() => ask(sug)}>{sug}</button>)}</div>
      <form className="time-add" onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("comp_placeholder")} />
        <button className="btn" type="submit" style={{ flex: "none" }}>{t("comp_send")}</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 8 }}>{t("comp_disclaimer")}</p>
    </div>
  );
}

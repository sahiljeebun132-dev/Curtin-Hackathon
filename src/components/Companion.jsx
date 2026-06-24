import { useState, useRef, useEffect } from "react";

const CRISIS_WORDS = ["suicide", "suicidal", "kill myself", "kill me", "end my life", "end it all", "want to die", "better off dead", "self harm", "self-harm", "hurt myself", "harm myself", "no reason to live", "cut myself"];
const isCrisis = (q) => CRISIS_WORDS.some((w) => q.includes(w));
const NATIONAL = "- Befrienders Mauritius: 800 9393 (free, anytime)\n- Helpline Mauritius: 214 2451\n- NADC (treatment & rehab): consultations.nadc.mu";

function crisisReply() {
  return "I'm really glad you told me, and I want you to be safe. You don't have to face this alone right now. Please reach out to a person:\n- Befrienders Mauritius: 800 9393 (free, anytime)\n- SAMU: 114 (medical emergency)\nIf you can, stay with someone you trust. A real person can help you best right now - I'll be here too.";
}

function ctxFrom(r) {
  return {
    level: r.risk_profile.overall_risk_level,
    score: r.risk_profile.risk_score,
    emotion: r.facial_analysis_summary && r.facial_analysis_summary.dominant_emotion_detected,
    readiness: r.recovery_readiness && r.recovery_readiness.stage,
    referral: r.intervention && r.intervention.primary_referral,
    flags: Object.entries(r.flags).filter(([, v]) => v).map(([k]) => k.replace(/_flag$/, "")),
  };
}

function localRespond(text, r, ctxRef) {
  const q = text.toLowerCase();
  if (isCrisis(q) || r.flags.crisis_flag) return crisisReply();
  const ref = (r.intervention && r.intervention.primary_referral) || { organisation: "a support line", contact: "800 9393" };

  if (ctxRef.current.awaitingCity) {
    ctxRef.current.awaitingCity = false;
    const city = text.trim().replace(/[^a-zÀ-ſ\s-]/gi, "");
    const central = /(port louis|plaine verte|roche bois|cite|tranquebar)/i.test(city);
    return `Thanks. Wherever you are${city ? " in " + city : ""}, these reach the whole island:\n${NATIONAL}` +
      (central ? "\nClose to you: the Idrice Goomany Centre in Plaine Verte offers in-person support." : "") +
      "\nWould a gentle first step for reaching out help?";
  }
  if (/(call|who|contact|number|people|reach|refer|find someone)/.test(q)) { ctxRef.current.awaitingCity = true; return "I can point you to the right people. Which city or area do you live in?"; }
  if (/(overwhelm|too much|so much|can.?t cope|cant cope|panic|lost|don.?t know where|where do i start)/.test(q)) {
    return `That feeling makes complete sense - it's a lot. Let's not look at everything at once. Just one small thing today: save the number for ${ref.organisation} (${ref.contact}), or tap it to call. Nothing else for now. We can take the next step tomorrow.`;
  }
  if (/(sad|down|depress|cry|hopeless|alone|empty|tired of|low|numb)/.test(q)) {
    return "I'm sorry it feels heavy right now - what you're feeling is real and it matters. Try one slow breath with me: in for 4, out for 6. Doing this check-in took courage. Would it help if I found the right person near you to talk to?";
  }
  if (/(next|what.*do|step|how|advice|should i)/.test(q)) {
    const lvl = r.risk_profile.overall_risk_level;
    if (lvl === "Crisis" || lvl === "High") return `The most caring next step is to talk to someone today: ${ref.organisation} (${ref.contact}). You don't have to explain everything - "I'm not okay" is enough to start.`;
    if (lvl === "Medium") return `A good next step, when you're ready, is a chat with a counsellor - ${ref.organisation} (${ref.contact}). No rush and no pressure.`;
    return `Keep doing what's helping, and keep a gentle eye on your sleep and mood. If things get heavier, ${ref.organisation} (${ref.contact}) is there for you.`;
  }
  if (/(thank|thanks|ok|okay|bye|cheers)/.test(q)) return "Anytime. You did something kind for yourself today. I'm here whenever you need - and the SOS button is always one tap away.";
  return "I'm here with you. I can help you find one small next step, point you to the right people to call near you, or just listen. What would feel most helpful?";
}

const SUGGESTIONS = ["I feel overwhelmed", "What do I do next?", "Who can I call?", "I feel down"];

export default function Companion({ result }) {
  const greet = (() => {
    if (result.flags.crisis_flag) return crisisReply();
    const e = result.facial_analysis_summary && result.facial_analysis_summary.dominant_emotion_detected;
    if (["sad", "fearful", "angry"].includes(e)) return "Hey - I'm really glad you're here. It looks like this might be a heavy moment, and that's okay. I'm a supportive guide (not a doctor), and we can take this one small step at a time. What's on your mind?";
    return "Hi - I'm here to help you make sense of your result and figure out what feels right next. I'm a supportive guide, not a therapist. What would help most: next steps, who to call, or just to talk?";
  })();
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
    if (isCrisis(text.toLowerCase())) { setLog((l) => [...l, { who: "bot", text: crisisReply() }]); return; }
    setTyping(true);
    try {
      const history = [...log, { who: "you", text }].map((m) => ({ role: m.who === "you" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, context: ctxFrom(result) }) });
      const data = await res.json();
      if (data && data.reply) { setLog((l) => [...l, { who: "bot", text: data.reply }]); setTyping(false); return; }
    } catch { /* fall through to local */ }
    const reply = localRespond(text, result, ctxRef);
    setLog((l) => [...l, { who: "bot", text: reply }]);
    setTyping(false);
  }

  return (
    <div className="companion">
      <div className="chat">
        {log.map((m, i) => (<div key={i} className={"bubble " + (m.who === "you" ? "you" : "bot")}>{m.text.split("\n").map((ln, j) => <div key={j}>{ln}</div>)}</div>))}
        {typing && <div className="bubble bot">…</div>}
        <div ref={endRef} />
      </div>
      <div className="chips-row">{SUGGESTIONS.map((s) => <button key={s} type="button" className="suggest" onClick={() => ask(s)}>{s}</button>)}</div>
      <form className="time-add" onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" />
        <button className="btn" type="submit" style={{ flex: "none" }}>Send</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 8 }}>A supportive guide - not a therapist or doctor. In an emergency use the SOS button. Nothing here is stored.</p>
    </div>
  );
}

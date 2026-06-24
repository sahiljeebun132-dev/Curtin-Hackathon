import { useState } from "react";
import { AWARENESS_ZONES } from "../data/zones.js";

const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };
// Deterministic, local query engine over ANONYMISED data (initials only).
// No external AI, no individual identity lookup - triage help, not surveillance.
function answer(qRaw, caseload) {
  const q = (qRaw || "").toLowerCase();
  const fmt = (list) => list.length ? list.map((c) => `• ${c.initials} — ${c.level}, ${c.area}, ${c.days}d sober${c.missed ? `, ${c.missed} missed` : ""}`).join("\n") : "  (no one matches)";
  const byRank = (l) => [...l].sort((a, b) => RANK[b.level] - RANK[a.level]);

  const zone = AWARENESS_ZONES.find((z) => q.includes(z.name.toLowerCase()));
  if (zone) {
    const ppl = caseload.filter((c) => c.area.toLowerCase() === zone.name.toLowerCase());
    return `${zone.name}: ${zone.count} check-ins (${zone.high} higher-risk) — anonymous totals.\nIn your caseload there (${ppl.length}):\n${fmt(byRank(ppl))}`;
  }
  if (/(urgent|attention|priority|crisis|high risk|highest)/.test(q)) {
    const l = byRank(caseload.filter((c) => c.level === "Crisis" || c.level === "High"));
    return `${l.length} need attention:\n${fmt(l)}`;
  }
  if (/(review|today|due)/.test(q)) { const l = caseload.filter((c) => c.next === "today"); return `${l.length} review(s) due today:\n${fmt(l)}`; }
  if (/(miss|dose|medicat|adhere)/.test(q)) { const l = byRank(caseload.filter((c) => c.missed > 0)); return `${l.length} with missed doses:\n${fmt(l)}`; }
  if (/(how many|count|total|number|breakdown|summary|overview)/.test(q)) {
    const c = (lv) => caseload.filter((x) => x.level === lv).length;
    return `Caseload: ${caseload.length} people.\nCrisis ${c("Crisis")} · High ${c("High")} · Medium ${c("Medium")} · Low ${c("Low")}.`;
  }
  if (/(sober|days|longest|progress|best)/.test(q)) { const l = [...caseload].sort((a, b) => b.days - a.days); return `By days sober:\n${fmt(l)}`; }
  return "I can help with: who needs attention, reviews due today, missed doses, a specific area (e.g. \"Roche Bois\"), or a caseload summary. Everything is anonymised — initials only, never identities.";
}

const SUGGESTIONS = ["Who needs attention?", "Reviews due today", "Missed doses", "Roche Bois", "Caseload summary"];

export default function Assistant({ caseload = [] }) {
  const [log, setLog] = useState([{ who: "bot", text: "Hi — I'm your caseload assistant. Ask me about who needs attention, reviews, missed doses, or an area. I only ever show anonymised initials." }]);
  const [input, setInput] = useState("");

  function ask(text) {
    const q = text.trim();
    if (!q) return;
    setLog((l) => [...l, { who: "you", text: q }, { who: "bot", text: answer(q, caseload) }]);
    setInput("");
  }

  return (
    <section className="card">
      <div className="eyebrow">Caseload assistant</div>
      <h2>Ask about your caseload</h2>
      <p className="muted small">Anonymised triage help for verified staff. No identities, no external AI — answers are computed locally from the data you already see.</p>

      <div className="chat">
        {log.map((m, i) => (
          <div key={i} className={"bubble " + (m.who === "you" ? "you" : "bot")}>{m.text.split("\n").map((ln, j) => <div key={j}>{ln}</div>)}</div>
        ))}
      </div>

      <div className="chips-row">
        {SUGGESTIONS.map((s) => <button key={s} type="button" className="suggest" onClick={() => ask(s)}>{s}</button>)}
      </div>
      <form className="time-add" onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something…" />
        <button className="btn" type="submit" style={{ flex: "none" }}>Ask</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 10 }}>This assistant cannot look up a named individual or a national ID - by design. It supports triage, not surveillance.</p>
    </section>
  );
}

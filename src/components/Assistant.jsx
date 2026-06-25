import { useState } from "react";
import { useT } from "../i18n.js";
import { AWARENESS_ZONES } from "../data/zones.js";

const RANK = { Crisis: 4, High: 3, Medium: 2, Low: 1 };
// Deterministic, local query engine over ANONYMISED data (initials only).
// No external AI, no individual identity lookup - triage help, not surveillance.
function answer(qRaw, caseload, t) {
  const q = (qRaw || "").toLowerCase();
  const fmt = (list) => list.length
    ? list.map((c) => `• ${c.initials} — ${c.level}, ${c.area}, ${c.days} ${t("as_sober")}${c.missed ? `, ${c.missed} ${t("as_missed")}` : ""}`).join("\n")
    : "  " + t("as_none_match");
  const byRank = (l) => [...l].sort((a, b) => RANK[b.level] - RANK[a.level]);
  const sub = (str, map) => Object.entries(map).reduce((acc, [k, v]) => acc.replace("{" + k + "}", v), str);

  const zone = AWARENESS_ZONES.find((z) => q.includes(z.name.toLowerCase()));
  if (zone) {
    const ppl = caseload.filter((c) => c.area.toLowerCase() === zone.name.toLowerCase());
    return sub(t("as_zone_line"), { name: zone.name, count: zone.count, high: zone.high }) + "\n" +
      sub(t("as_in_caseload"), { n: ppl.length }) + "\n" + fmt(byRank(ppl));
  }
  if (/(urgent|attention|priority|crisis|high risk|highest)/.test(q)) {
    const l = byRank(caseload.filter((c) => c.level === "Crisis" || c.level === "High"));
    return sub(t("as_need_attention"), { n: l.length }) + "\n" + fmt(l);
  }
  if (/(review|today|due)/.test(q)) { const l = caseload.filter((c) => c.next === "today"); return sub(t("as_reviews_due"), { n: l.length }) + "\n" + fmt(l); }
  if (/(miss|dose|medicat|adhere)/.test(q)) { const l = byRank(caseload.filter((c) => c.missed > 0)); return sub(t("as_with_missed"), { n: l.length }) + "\n" + fmt(l); }
  if (/(how many|count|total|number|breakdown|summary|overview)/.test(q)) {
    const c = (lv) => caseload.filter((x) => x.level === lv).length;
    return sub(t("as_caseload_count"), { n: caseload.length }) + `\nCrisis ${c("Crisis")} · High ${c("High")} · Medium ${c("Medium")} · Low ${c("Low")}.`;
  }
  if (/(sober|days|longest|progress|best)/.test(q)) { const l = [...caseload].sort((a, b) => b.days - a.days); return t("as_by_days") + "\n" + fmt(l); }
  return t("as_help");
}

export default function Assistant({ caseload = [] }) {
  const t = useT();
  const [log, setLog] = useState([{ who: "bot", text: t("as_greet") }]);
  const [input, setInput] = useState("");
  const SUGGESTIONS = [t("as_sug_attention"), t("as_sug_reviews"), t("as_sug_missed"), "Roche Bois", t("as_sug_summary")];

  function ask(text) {
    const q = text.trim();
    if (!q) return;
    setLog((l) => [...l, { who: "you", text: q }, { who: "bot", text: answer(q, caseload, t) }]);
    setInput("");
  }

  return (
    <section className="card">
      <div className="eyebrow">{t("as_eyebrow")}</div>
      <h2>{t("as_title")}</h2>
      <p className="muted small">{t("as_sub")}</p>

      <div className="chat">
        {log.map((m, i) => (
          <div key={i} className={"bubble " + (m.who === "you" ? "you" : "bot")}>{m.text.split("\n").map((ln, j) => <div key={j}>{ln}</div>)}</div>
        ))}
      </div>

      <div className="chips-row">
        {SUGGESTIONS.map((s) => <button key={s} type="button" className="suggest" onClick={() => ask(s)}>{s}</button>)}
      </div>
      <form className="time-add" onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("as_ask_ph")} />
        <button className="btn" type="submit" style={{ flex: "none" }}>{t("as_ask")}</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 10 }}>{t("as_note")}</p>
    </section>
  );
}

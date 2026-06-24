import { useState, useEffect } from "react";
import { useT, useLang } from "../i18n.js";
import { speak, stopSpeaking } from "../speak.js";
import { BEHAVIOURAL_QUESTIONS, PROTECTIVE_QUESTIONS, appliesToAge } from "../aria/constants.js";
import SymptomChecklist from "./SymptomChecklist.jsx";
import { SYMPTOM_CATEGORIES } from "../data/symptoms.js";

function Scale({ value, onChange, labels }) {
  return (
    <div className={"scale" + (labels.length === 3 ? " p3" : "")}>
      {labels.map((lab, i) => (
        <div key={i} className={"chip" + (value === i ? " chip-on" : "")} onClick={() => onChange(value === i ? null : i)} role="button">
          <span className="chip-num">{i}</span><span className="chip-lab">{lab}</span>
        </div>
      ))}
    </div>
  );
}

export default function Questionnaire({ onSubmit, initialMeta, subjectLabel }) {
  const t = useT();
  const { lang } = useLang();
  const B_LABELS = [t("scale0"), t("scale1"), t("scale2"), t("scale3")];
  const P_LABELS = [t("p0"), t("p1"), t("p2")];
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [protective, setProtective] = useState({});
  const [symptoms, setSymptoms] = useState({});
  const [meta, setMeta] = useState(() => ({
    subject_age_group: "19_to_25", subject_gender: "prefer_not", geographic_zone: "",
    language_preference: "english", referrer_type: "self", children_in_household: false,
    observer_notes: "", substances_text: "", ...(initialMeta || {}),
  }));
  const setA = (id, v) => setAnswers((s) => ({ ...s, [id]: v }));
  const setP = (id, v) => setProtective((s) => ({ ...s, [id]: v }));
  const setM = (k, v) => setMeta((s) => ({ ...s, [k]: v }));
  const toggleSym = (key) => setSymptoms((s) => ({ ...s, [key]: !s[key] }));

  const PAGES = [
    { title: t("sec_about"), kind: "about" },
    { title: t("sec_substance"), tags: ["behavioural"], src: true },
    { title: t("sec_mood"), tags: ["emotional"] },
    { title: t("sec_phys"), tags: ["physical"] },
    { title: t("sec_fam") + " + " + t("sec_safety"), tags: ["environmental", "crisis"] },
    { title: t("sec_strengths"), kind: "protective" },
    { title: t("sec_context"), kind: "context" },
  ];
  const N = PAGES.length;
  const cur = PAGES[page];
  const last = page === N - 1;
  useEffect(() => () => stopSpeaking(), []);
  const toTop = () => { stopSpeaking(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => { setPage((p) => Math.min(p + 1, N - 1)); toTop(); };
  const back = () => { setPage((p) => Math.max(p - 1, 0)); toTop(); };

  function submit(e) {
    e.preventDefault();
    const substances_mentioned = meta.substances_text.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const counts = {};
    Object.entries(symptoms).forEach(([k, on]) => { if (on) { const id = k.split("::")[0]; counts[id] = (counts[id] || 0) + 1; } });
    const clinician_symptoms = SYMPTOM_CATEGORIES.filter((c) => counts[c.id]).map((c) => ({ id: c.id, label: c.label, hits: counts[c.id] })).sort((a, b) => b.hits - a.hits);
    onSubmit({ answers, protective, metadata: { ...meta, substances_mentioned, clinician_symptoms } });
  }

  function readPage() {
    let parts = [cur.title];
    if (cur.tags) parts.push(...BEHAVIOURAL_QUESTIONS.filter((q) => cur.tags.includes(q.score) && appliesToAge(q, meta.subject_age_group)).map((q) => t("q_" + q.id)));
    else if (cur.kind === "protective") parts.push(...PROTECTIVE_QUESTIONS.map((q) => t("p_" + q.id)));
    speak(parts.join(". "), lang);
  }
  function renderQuestions(tags) {
    const qs = BEHAVIOURAL_QUESTIONS.filter((q) => tags.includes(q.score) && appliesToAge(q, meta.subject_age_group));
    return qs.map((q) => (
      <div className="qrow" key={q.id}>
        <span className="qlabel">{t("q_" + q.id)}
          {q.source && q.source !== "general" && <span className="src-tag">{q.source}</span>}
          {q.score === "crisis" && <span className="safeguard-tag">{t("sec_safety")}</span>}
        </span>
        <Scale value={answers[q.id] ?? null} onChange={(v) => setA(q.id, v)} labels={B_LABELS} />
      </div>
    ));
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="eyebrow">{t("q_eyebrow")} &middot; {page + 1}/{N}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><h2 style={{ margin: 0 }}>{cur.title}</h2><button type="button" className="btn soft" style={{ padding: "5px 11px", flex: "none" }} onClick={readPage}>🔊</button></div>
      <div className="wiz-bar"><div className="wiz-fill" style={{ width: ((page + 1) / N) * 100 + "%" }} /></div>
      {subjectLabel && page === 0 && <div className="callout" style={{ margin: "0 0 12px" }}><span className="small">Check-in for <strong>{subjectLabel}</strong> (from caseload).</span></div>}

      <div className="fade-key" key={page}>
        {cur.kind === "about" && (<>
          <p className="muted small">This tailors the questions to the person's age. Adapted from validated screening tools (CRAFFT, DAST-10, AUDIT-C) - for screening, never a diagnosis.</p>
          <div className="grid2">
            <label className="field"><span>{t("ctx_age")}</span>
              <select value={meta.subject_age_group} onChange={(e) => setM("subject_age_group", e.target.value)}>
                <option value="under_15">Under 15</option><option value="15_to_18">15-18</option>
                <option value="19_to_25">19-25</option><option value="26_to_35">26-35</option><option value="36_plus">36+</option>
              </select>
            </label>
            <label className="field"><span>{t("ctx_referrer")}</span>
              <select value={meta.referrer_type} onChange={(e) => setM("referrer_type", e.target.value)}>
                <option value="self">{t("r_self")}</option><option value="family">{t("r_family")}</option><option value="school">{t("r_school")}</option>
                <option value="ngo">{t("r_ngo")}</option><option value="counsellor">{t("r_counsellor")}</option><option value="anonymous">{t("r_anonymous")}</option>
              </select>
            </label>
          </div>
        </>)}

        {cur.tags && (<>
          {cur.src && <p className="tiny muted" style={{ marginTop: -2 }}>{appliesToAge({ applies: "youth" }, meta.subject_age_group) ? "CRAFFT (under 18)" : "DAST-10 & AUDIT-C (18+)"} · screening, not diagnosis</p>}
          {renderQuestions(cur.tags)}
        </>)}

        {cur.kind === "protective" && (<>
          <p className="muted small">{t("strengths_note")}</p>
          {PROTECTIVE_QUESTIONS.map((q) => (
            <div className="qrow" key={q.id}>
              <span className="qlabel">{t("p_" + q.id)}</span>
              <Scale value={protective[q.id] ?? null} onChange={(v) => setP(q.id, v)} labels={P_LABELS} />
            </div>
          ))}
        </>)}

        {cur.kind === "context" && (<>
          <div className="grid2">
            <label className="field"><span>{t("ctx_area")}</span>
              <input value={meta.geographic_zone} onChange={(e) => setM("geographic_zone", e.target.value)} placeholder="e.g. Roche Bois" />
            </label>
            <label className="field"><span>{t("ctx_subs")}</span>
              <input value={meta.substances_text} onChange={(e) => setM("substances_text", e.target.value)} placeholder="e.g. alcohol, sousou" />
            </label>
            <label className="check"><input type="checkbox" checked={meta.children_in_household} onChange={(e) => setM("children_in_household", e.target.checked)} /> {t("ctx_children")}</label>
          </div>
          <label className="field"><span>{t("ctx_more")}</span>
            <textarea rows={3} value={meta.observer_notes} onChange={(e) => setM("observer_notes", e.target.value)} />
          </label>
          {meta.referrer_type !== "self" && (<>
            <h3>{t("signs_title")}</h3>
            <SymptomChecklist checked={symptoms} onToggle={toggleSym} />
          </>)}
        </>)}
      </div>

      <div className="divider" />
      <div className="row">
        {page > 0 && <button type="button" className="btn soft" onClick={back}>&larr; {t("nav_back")}</button>}
        {last
          ? <button type="submit" className="btn" style={{ flex: 1 }}>{t("submit")}</button>
          : <button type="button" className="btn" style={{ flex: 1 }} onClick={next}>{t("nav_next")} &rarr;</button>}
      </div>
    </form>
  );
}

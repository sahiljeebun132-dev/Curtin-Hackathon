// ===================================================================
// Questionnaire — Source B (behavioural signals + protective factors +
// contextual metadata). Renders straight from constants.js so the form
// and the engine can never fall out of sync. (Spec Section 1)
// ===================================================================
import { useState } from "react";
import { BEHAVIOURAL_QUESTIONS, PROTECTIVE_QUESTIONS } from "../aria/constants.js";

const BEHAVIOURAL_LABELS = ["Never", "Occasionally", "Regularly", "Always"]; // 0-3
const PROTECTIVE_LABELS = ["Not present", "Somewhat", "Strongly"];           // 0-2

// Reusable 0-N button group (kept inline to keep the POC single-purpose).
function Scale({ value, onChange, labels }) {
  return (
    <div className="scale">
      {labels.map((lab, i) => (
        <button
          key={i}
          type="button"
          className={"chip" + (value === i ? " chip-on" : "")}
          onClick={() => onChange(i)}
        >
          <span className="chip-num">{i}</span>
          <span className="chip-lab">{lab}</span>
        </button>
      ))}
    </div>
  );
}

export default function Questionnaire({ onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [protective, setProtective] = useState({});
  const [metadata, setMetadata] = useState({
    subject_age_group: "19_to_25",
    subject_gender: "prefer_not",
    geographic_zone: "",
    language_preference: "english",
    referrer_type: "self",
    children_in_household: false,
    observer_notes: "",
    substances_text: "", // comma-separated; parsed into an array on submit
  });

  const setA = (id, v) => setAnswers((s) => ({ ...s, [id]: v }));
  const setP = (id, v) => setProtective((s) => ({ ...s, [id]: v }));
  const setM = (k, v) => setMetadata((s) => ({ ...s, [k]: v }));

  function submit(e) {
    e.preventDefault();
    const substances_mentioned = metadata.substances_text
      .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    onSubmit({
      answers,
      protective,
      metadata: { ...metadata, substances_mentioned },
    });
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Step 2 · Behavioural questionnaire</h2>

      <h3>Behavioural signals <span className="muted small">(0 = never · 3 = always)</span></h3>
      {BEHAVIOURAL_QUESTIONS.map((q) => (
        <div className="qrow" key={q.id}>
          <label>{q.label}{q.score === "crisis" && <span className="crisis-tag"> safeguarding</span>}</label>
          <Scale value={answers[q.id] ?? null} onChange={(v) => setA(q.id, v)} labels={BEHAVIOURAL_LABELS} />
        </div>
      ))}

      <h3>Protective factors <span className="muted small">(0 = not present · 2 = strongly)</span></h3>
      {PROTECTIVE_QUESTIONS.map((q) => (
        <div className="qrow" key={q.id}>
          <label>{q.label}</label>
          <Scale value={protective[q.id] ?? null} onChange={(v) => setP(q.id, v)} labels={PROTECTIVE_LABELS} />
        </div>
      ))}

      <h3>Context</h3>
      <div className="grid2">
        <label>Age group
          <select value={metadata.subject_age_group} onChange={(e) => setM("subject_age_group", e.target.value)}>
            <option value="under_15">under 15</option>
            <option value="15_to_18">15–18</option>
            <option value="19_to_25">19–25</option>
            <option value="26_to_35">26–35</option>
            <option value="36_plus">36+</option>
          </select>
        </label>
        <label>Referrer
          <select value={metadata.referrer_type} onChange={(e) => setM("referrer_type", e.target.value)}>
            <option value="self">self</option>
            <option value="family">family</option>
            <option value="school">school</option>
            <option value="ngo">ngo</option>
            <option value="counsellor">counsellor</option>
            <option value="anonymous">anonymous</option>
          </select>
        </label>
        <label>Geographic zone
          <input value={metadata.geographic_zone} onChange={(e) => setM("geographic_zone", e.target.value)} placeholder="e.g. Roche Bois" />
        </label>
        <label>Language
          <select value={metadata.language_preference} onChange={(e) => setM("language_preference", e.target.value)}>
            <option value="english">English</option>
            <option value="french">French</option>
            <option value="creole">Creole</option>
          </select>
        </label>
        <label>Substances mentioned <span className="muted small">(comma-separated)</span>
          <input value={metadata.substances_text} onChange={(e) => setM("substances_text", e.target.value)} placeholder="e.g. alcohol, sousou" />
        </label>
        <label className="check">
          <input type="checkbox" checked={metadata.children_in_household} onChange={(e) => setM("children_in_household", e.target.checked)} />
          Children in household
        </label>
      </div>
      <label>Observer notes
        <textarea value={metadata.observer_notes} onChange={(e) => setM("observer_notes", e.target.value)} rows={3} placeholder="Free text. Creole phrases recognised." />
      </label>

      <button className="btn" type="submit">Generate assessment →</button>
    </form>
  );
}

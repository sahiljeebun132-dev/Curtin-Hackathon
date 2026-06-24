import { SYMPTOM_CATEGORIES } from "../data/symptoms.js";

// Shown only to an observer (family / counsellor / NGO), never asked of the
// patient about themselves. Plain language, fully optional, NON-DIAGNOSTIC.
export default function SymptomChecklist({ checked, onToggle }) {
  return (
    <details className="sym-cat">
      <summary>Signs someone has actually noticed (optional)</summary>
      <p className="tiny muted" style={{ marginTop: 8 }}>
        Only tick what has really been seen - it is completely fine to skip this. It just gives a
        professional a little extra context to consider, and is never a diagnosis.
      </p>
      {SYMPTOM_CATEGORIES.map((cat) => (
        <details className="sym-cat" key={cat.id}>
          <summary>{cat.label}</summary>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {cat.signs.map((sgn) => {
              const key = cat.id + "::" + sgn;
              return (
                <li key={key} style={{ margin: "6px 0" }}>
                  <label className="check" style={{ marginTop: 0 }}>
                    <input type="checkbox" checked={!!checked[key]} onChange={() => onToggle(key, cat.id)} />
                    <span className="small">{sgn}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </details>
  );
}

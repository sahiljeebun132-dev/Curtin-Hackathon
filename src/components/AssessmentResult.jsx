// ===================================================================
// AssessmentResult — renders the ARIA JSON output for a human reviewer.
// It only DISPLAYS what the engine produced; it computes nothing itself.
// ===================================================================
const LEVEL_COLOR = { Low: "var(--low)", Medium: "var(--medium)", High: "var(--high)", Crisis: "var(--crisis)" };

function Bar({ label, value, max }) {
  return (
    <div className="bar">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="bar-val">{value}/{max}</span>
    </div>
  );
}

export default function AssessmentResult({ result, onRestart }) {
  if (!result) return null;
  const r = result;
  const lvl = r.risk_profile.overall_risk_level;
  const b = r.risk_profile.score_breakdown;

  return (
    <section className="panel">
      <div className="result-head" style={{ borderColor: LEVEL_COLOR[lvl] }}>
        <div>
          <div className="muted small">{r.assessment_id} · {new Date(r.timestamp).toLocaleString()}</div>
          <h2 style={{ color: LEVEL_COLOR[lvl], margin: "4px 0" }}>{lvl} · {r.risk_profile.risk_score}/100</h2>
          <div className="muted small">Confidence: {r.risk_profile.confidence}</div>
        </div>
      </div>

      {r.flags.crisis_flag && (
        <div className="crisis-box">
          <strong>⚠ CRISIS</strong>
          <p>{r.crisis_message}</p>
        </div>
      )}

      <h3>Score breakdown</h3>
      <Bar label="Behavioural" value={b.behavioural} max={25} />
      <Bar label="Emotional" value={b.emotional} max={25} />
      <Bar label="Physical" value={b.physical} max={25} />
      <Bar label="Environmental" value={b.environmental} max={25} />
      <div className="muted small">− Protective deduction: {b.protective_deduction} · + Substance modifier: {b.substance_modifier}</div>

      <h3>Flags</h3>
      <div className="flags">
        {Object.entries(r.flags).map(([k, v]) => (
          <span key={k} className={"flag" + (v ? " flag-on" : "")}>{k.replace(/_/g, " ")}</span>
        ))}
      </div>

      <h3>Why this score</h3>
      <p>{r.explainability.reasoning_summary}</p>
      <p className="muted small">Top factor: {r.explainability.top_contributing_factor} · Uncertainty: {r.explainability.uncertainty_note}</p>

      <h3>Recovery readiness</h3>
      <p><strong>{r.recovery_readiness.stage}</strong> ({r.recovery_readiness.score}/10)</p>
      <p className="muted">Opening line: “{r.recovery_readiness.opening_line_for_counsellor}”</p>
      <p className="muted small">Primary barrier: {r.recovery_readiness.primary_barrier}</p>

      <h3>Recommended action</h3>
      <p><strong>{r.intervention.recommended_action}</strong> · urgency {r.intervention.urgency}</p>
      <div className="referral">
        <strong>{r.intervention.primary_referral.organisation}</strong> — {r.intervention.primary_referral.contact}
        <div className="muted small">{r.intervention.primary_referral.reason}</div>
      </div>
      <p className="muted small">Stigma-sensitive note: {r.intervention.stigma_sensitive_note}</p>

      <h3>Plain-language summary</h3>
      <p>{r.plain_language_summary}</p>
      {r.creole_summary && (<><h3>Rezime an Kreol</h3><p>{r.creole_summary}</p></>)}

      <h3>Fairness audit</h3>
      <p className="muted small">Bias risk: {r.fairness_audit.bias_risk} — {r.fairness_audit.bias_note}</p>

      <footer className="muted small">{r.system_footer}</footer>
      <button className="btn ghost" onClick={onRestart}>New assessment</button>
    </section>
  );
}

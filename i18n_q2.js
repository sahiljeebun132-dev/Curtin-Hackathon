import { useState } from "react";
import { useT } from "../i18n.js";
import AssessmentResult from "./AssessmentResult.jsx";
import { cacheGet, cacheRemove } from "../secure.js";

// A durable home for the patient's most recent check-in. The result is read
// from the encrypted on-device cache (hydrated at boot in main.jsx -> loadAll),
// so it survives tab navigation AND a full page refresh - unlike the in-memory
// check-in flow, which intentionally starts blank each time it is opened.
export default function Results({ onNavigate }) {
  const t = useT();
  const [result, setResult] = useState(() => cacheGet("last_result"));
  const savedAt = cacheGet("last_result_at");

  function startNew() { onNavigate && onNavigate("checkin"); }
  function clearResult() {
    cacheRemove("last_result");
    cacheRemove("last_result_at");
    cacheRemove("last_level");
    setResult(null);
  }

  if (!result) {
    return (
      <section className="card">
        <div className="eyebrow">{t("nav_results")}</div>
        <h2>{t("results_title")}</h2>
        <p className="muted small">{t("results_empty")}</p>
        <div className="divider" />
        <button className="btn full" onClick={startNew}>{t("results_empty_cta")} &rarr;</button>
      </section>
    );
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="eyebrow">{t("nav_results")}</div>
        <h2 style={{ marginBottom: 4 }}>{t("results_title")}</h2>
        <p className="muted small" style={{ marginBottom: 0 }}>
          {savedAt ? `${t("results_when")}: ${new Date(savedAt).toLocaleString()}` : t("results_sub")}
        </p>
        <p className="tiny muted" style={{ marginTop: 8, marginBottom: 0 }}>{t("results_note")}</p>
      </div>
      <AssessmentResult result={result} onRestart={startNew} />
      <button className="btn soft full no-print" style={{ marginTop: 12 }} onClick={clearResult}>{t("results_clear")}</button>
    </>
  );
}

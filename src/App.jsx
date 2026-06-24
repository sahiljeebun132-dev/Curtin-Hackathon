// ===================================================================
// App — orchestrates the 3-step flow:
//   1. EmotionCapture (Source A)  ->  2. Questionnaire (Source B)
//   ->  runAriaAssessment() + attachSummaries()  ->  3. AssessmentResult
//
// The engine call is deterministic; attachSummaries runs WITHOUT an LLM
// here (llmFn = null) so the deployed POC needs no API key. To enable the
// LLM rewording, pass a function as the 2nd arg of attachSummaries.
// ===================================================================
import { useState } from "react";
import EmotionCapture from "./components/EmotionCapture.jsx";
import Questionnaire from "./components/Questionnaire.jsx";
import AssessmentResult from "./components/AssessmentResult.jsx";
import { runAriaAssessment } from "./aria/engine.js";
import { attachSummaries } from "./aria/summaries.js";

export default function App() {
  const [step, setStep] = useState("intro");
  const [facial, setFacial] = useState(null);
  const [result, setResult] = useState(null);

  async function handleQuestionnaire(formData) {
    const assessment = runAriaAssessment({ ...formData, facial });
    const withSummaries = await attachSummaries(assessment, null); // no LLM in POC
    setResult(withSummaries);
    setStep("result");
  }

  function restart() {
    setFacial(null);
    setResult(null);
    setStep("intro");
  }

  return (
    <main className="container">
      <header>
        <h1>VELA · ARIA <span className="tag">v1.0 POC</span></h1>
        <p className="muted small">
          Vigilance &amp; Early-intervention Lifeline Assistant — an AI-assisted risk flag,
          not a diagnosis. Every result is human-reviewed. Game of Code 2026, Curtin Mauritius.
        </p>
      </header>

      {step === "intro" && (
        <section className="panel">
          <h2>Consent &amp; purpose</h2>
          <p className="muted">
            This proof-of-concept supports trained reviewers in spotting early risk indicators.
            It does not diagnose, and it never acts automatically. Facial analysis is optional
            and runs entirely on this device. Data is session-only and not stored.
          </p>
          <button className="btn" onClick={() => setStep("capture")}>Begin →</button>
        </section>
      )}

      {step === "capture" && (
        <EmotionCapture onComplete={(f) => { setFacial(f); setStep("questionnaire"); }} />
      )}

      {step === "questionnaire" && (
        <Questionnaire onSubmit={handleQuestionnaire} />
      )}

      {step === "result" && (
        <AssessmentResult result={result} onRestart={restart} />
      )}
    </main>
  );
}

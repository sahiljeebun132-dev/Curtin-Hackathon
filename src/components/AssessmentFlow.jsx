import { useState } from "react";
import { useT } from "../i18n.js";
import EmotionCapture from "./EmotionCapture.jsx";
import Questionnaire from "./Questionnaire.jsx";
import AssessmentResult from "./AssessmentResult.jsx";
import { runAriaAssessment } from "../aria/engine.js";
import { attachSummaries } from "../aria/summaries.js";

const STEPS = ["welcome", "capture", "questionnaire", "result"];

function Stepper({ step }) {
  const idx = STEPS.indexOf(step === "processing" ? "questionnaire" : step);
  return (
    <div className="stepper" aria-hidden="true">
      {STEPS.map((s, i) => (
        <div key={s} className={"dot " + (i < idx ? "done" : i === idx ? "active" : "")} />
      ))}
    </div>
  );
}

export default function AssessmentFlow() {
  const t = useT();
  const [step, setStep] = useState("welcome");
  const [facial, setFacial] = useState(null);
  const [result, setResult] = useState(null);

  async function handleQuestionnaire(formData) {
    setStep("processing");
    const assessment = runAriaAssessment({ ...formData, facial });
    const withSummaries = await attachSummaries(assessment, null);
    withSummaries._clinician = formData.metadata?.clinician_symptoms || [];
    setTimeout(() => { setResult(withSummaries); setStep("result"); }, 1100);
  }
  function restart() { setFacial(null); setResult(null); setStep("welcome"); }

  return (
    <>
      <Stepper step={step} />
      <div key={step} className="fade-key">
        {step === "welcome" && (
          <section className="card">
            <div className="eyebrow">{t("welcome_eyebrow")}</div>
            <h1>{t("welcome_title")}</h1>
            <p className="lead">{t("welcome_lead")}</p>
            <div className="trust">
              <span>{t("trust_device")}</span><span>{t("trust_cam")}</span>
              <span>{t("trust_human")}</span><span>{t("trust_store")}</span>
            </div>
            <div className="divider" />
            <button className="btn full" onClick={() => setStep("capture")}>{t("begin")}</button>
            <p className="tiny muted" style={{ marginTop: 14, textAlign: "center" }}>{t("danger_line")}</p>
          </section>
        )}
        {step === "capture" && (
          <EmotionCapture
            onComplete={(f) => { setFacial(f); setStep("questionnaire"); }}
            onSkip={() => { setFacial({ face_detected: false, dominant_emotion: "n/a", confidence: 0, emotion_timeline: [] }); setStep("questionnaire"); }}
          />
        )}
        {step === "questionnaire" && <Questionnaire onSubmit={handleQuestionnaire} />}
        {step === "processing" && (
          <section className="card processing">
            <div className="breathe" aria-hidden="true"><div /></div>
            <h2>{t("processing_title")}</h2>
            <p className="muted">{t("processing_sub")}</p>
          </section>
        )}
        {step === "result" && <AssessmentResult result={result} onRestart={restart} />}
      </div>
    </>
  );
}

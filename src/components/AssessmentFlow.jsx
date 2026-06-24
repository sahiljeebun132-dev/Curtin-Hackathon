import { useState } from "react";
import { useT } from "../i18n.js";
import { useRole } from "../role.js";
import { useLang } from "../i18n.js";
import EmotionCapture from "./EmotionCapture.jsx";
import Questionnaire from "./Questionnaire.jsx";
import AssessmentResult from "./AssessmentResult.jsx";
import { runAriaAssessment } from "../aria/engine.js";
import { attachSummaries } from "../aria/summaries.js";

const STEPS = ["capture", "questionnaire", "result"];

function Stepper({ step }) {
  const idx = STEPS.indexOf(step === "processing" ? "questionnaire" : step);
  return (
    <div className="stepper" aria-hidden="true">
      {STEPS.map((s, i) => (<div key={s} className={"dot " + (i < idx ? "done" : i === idx ? "active" : "")} />))}
    </div>
  );
}

export default function AssessmentFlow({ seed, onResult, savedResult, onSaveResult }) {
  const t = useT();
  const { role } = useRole();
  const { lang } = useLang();
  // a seeded (social-worker) check-in is ABOUT another person, so the camera
  // (which reads whoever is in front of the screen) is skipped.
  const [step, setStep] = useState(seed ? "questionnaire" : (savedResult ? "result" : "capture"));
  const [facial, setFacial] = useState(seed ? { face_detected: false, dominant_emotion: "n/a", confidence: 0, emotion_timeline: [] } : null);
  const [result, setResult] = useState(savedResult || null);

  async function handleQuestionnaire(formData) {
    setStep("processing");
    const assessment = runAriaAssessment({ ...formData, facial });
    const self = role === "patient" && !seed;
    const withSummaries = await attachSummaries(assessment, null, { self, lang });
    withSummaries._clinician = formData.metadata?.clinician_symptoms || [];
    withSummaries._eyeRedness = facial?.eye_redness || null;
    if (self) { try { localStorage.setItem("vela_last_level", withSummaries.risk_profile.overall_risk_level); } catch { /* ignore */ } }
    setTimeout(() => {
      setResult(withSummaries);
      setStep("result");
      onResult && onResult({ level: withSummaries.risk_profile.overall_risk_level, score: withSummaries.risk_profile.risk_score });
      if (!seed && onSaveResult) onSaveResult(withSummaries);
    }, 1100);
  }
  function restart() {
    setResult(null);
    if (!seed && onSaveResult) onSaveResult(null);
    setFacial(seed ? { face_detected: false, dominant_emotion: "n/a", confidence: 0, emotion_timeline: [] } : null);
    setStep(seed ? "questionnaire" : "capture");
  }

  return (
    <>
      <Stepper step={step} />
      <div key={step} className="fade-key">
        {step === "capture" && (
          <EmotionCapture
            onComplete={(f) => { setFacial(f); setStep("questionnaire"); }}
            onSkip={() => { setFacial({ face_detected: false, dominant_emotion: "n/a", confidence: 0, emotion_timeline: [] }); setStep("questionnaire"); }}
          />
        )}
        {step === "questionnaire" && <Questionnaire onSubmit={handleQuestionnaire} initialMeta={seed?.meta} subjectLabel={seed?.label} />}
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

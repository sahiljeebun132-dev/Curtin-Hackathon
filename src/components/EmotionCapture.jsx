import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 900;

export default function EmotionCapture({ onComplete, onSkip }) {
  const t = useT();
  const videoRef = useRef(null);
  const timelineRef = useRef([]);
  const confidencesRef = useRef([]);
  const [camState, setCamState] = useState("loading"); // loading | running | error
  const [live, setLive] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream, interval, cancelled = false;
    (async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) { stream.getTracks().forEach((x) => x.stop()); return; }
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamState("running");
        interval = setInterval(async () => {
          if (!videoRef.current) return;
          const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          if (det?.expressions) {
            const [emotion] = Object.entries(det.expressions).sort((a, b) => b[1] - a[1])[0];
            timelineRef.current.push(emotion);
            confidencesRef.current.push(det.detection.score);
            setLive((prev) => (prev?.emotion === emotion ? prev : { emotion, confidence: det.detection.score }));
            if (timelineRef.current.length >= 3) setReady(true);
          }
        }, SAMPLE_MS);
      } catch {
        if (!cancelled) setCamState("error"); // one stable state - no flicker
      }
    })();
    return () => { cancelled = true; clearInterval(interval); stream?.getTracks().forEach((x) => x.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run ONCE

  function finish() {
    const timeline = timelineRef.current, confs = confidencesRef.current;
    const counts = timeline.reduce((m, e) => ((m[e] = (m[e] || 0) + 1), m), {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
    const avgConf = confs.length ? confs.reduce((s, c) => s + c, 0) / confs.length : 0;
    onComplete({ dominant_emotion: dominant, face_detected: timeline.length > 0, confidence: Number(avgConf.toFixed(2)), session_duration_seconds: Math.round((timeline.length * SAMPLE_MS) / 1000), emotion_timeline: timeline.slice(-8) });
  }

  return (
    <section className="card">
      <div className="eyebrow">{t("cam_eyebrow")}</div>
      <h2>{t("cam_title")}</h2>

      {camState === "error" ? (
        <>
          <div className="callout warm"><span className="small">No camera access - that's completely fine. The check-in works just as well without it.</span></div>
          <button className="btn full" style={{ marginTop: 12 }} onClick={onSkip}>{t("cam_skip")} &rarr;</button>
        </>
      ) : (
        <>
          <p className="muted small">{camState === "loading" ? "Loading the on-device model..." : t("cam_hint")}</p>
          <div className="cam-wrap">
            <video ref={videoRef} muted playsInline />
            {camState === "running" && (
              <div className="cam-pill"><span className="cam-dot" />{live ? `${live.emotion} / ${(live.confidence * 100).toFixed(0)}%` : "reading"}</div>
            )}
          </div>
          {camState === "running" && <p className="tiny muted" style={{ textAlign: "center" }}>{ready ? t("cam_ready") : t("cam_gather")}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={finish} disabled={!ready}>{t("cam_continue")}</button>
            <button className="btn soft" onClick={onSkip}>{t("cam_skip")}</button>
          </div>
        </>
      )}
    </section>
  );
}

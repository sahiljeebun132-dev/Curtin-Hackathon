import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 900;
let MODELS_LOADED = false;

export default function EmotionCapture({ onComplete, onSkip }) {
  const t = useT();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const timelineRef = useRef([]);
  const confRef = useRef([]);
  const [state, setState] = useState("loading"); // loading | running | error
  const [errReason, setErrReason] = useState("generic");
  const [live, setLive] = useState(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Fully release the webcam (stop tracks, clear the interval and the video).
  function stopCamera() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((tk) => tk.stop()); streamRef.current = null; }
    if (videoRef.current) { try { videoRef.current.srcObject = null; } catch { /* ignore */ } }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      stopCamera(); // release anything left from a previous attempt
      try {
        const faceapi = await import("@vladmandic/face-api");
        if (!MODELS_LOADED) {
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
          MODELS_LOADED = true;
        }
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) { stream.getTracks().forEach((tk) => tk.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setState("running");
        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          if (det?.expressions) {
            const [emotion] = Object.entries(det.expressions).sort((a, b) => b[1] - a[1])[0];
            timelineRef.current.push(emotion);
            confRef.current.push(det.detection.score);
            setLive((prev) => (prev?.emotion === emotion ? prev : { emotion, confidence: det.detection.score }));
            if (timelineRef.current.length >= 3) setReady(true);
          }
        }, SAMPLE_MS);
      } catch (e) {
        if (cancelled) return;
        const n = e && e.name;
        setErrReason(
          (n === "NotAllowedError" || n === "SecurityError") ? "denied" :
          (n === "NotReadableError" || n === "AbortError" || n === "TrackStartError") ? "busy" :
          (n === "NotFoundError" || n === "OverconstrainedError" || n === "DevicesNotFoundError") ? "none" : "generic"
        );
        setState("error");
        stopCamera();
      }
    })();
    return () => { cancelled = true; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function finish() {
    const timeline = timelineRef.current, confs = confRef.current;
    const counts = timeline.reduce((m, e) => ((m[e] = (m[e] || 0) + 1), m), {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
    const avgConf = confs.length ? confs.reduce((s, c) => s + c, 0) / confs.length : 0;
    stopCamera();
    onComplete({ dominant_emotion: dominant, face_detected: timeline.length > 0, confidence: Number(avgConf.toFixed(2)), session_duration_seconds: Math.round((timeline.length * SAMPLE_MS) / 1000), emotion_timeline: timeline.slice(-8) });
  }
  function retry() { timelineRef.current = []; confRef.current = []; setLive(null); setReady(false); setAttempt((a) => a + 1); }
  function skip() { stopCamera(); onSkip(); }

  const ERR = {
    denied: "Camera permission is blocked. Allow it from your browser's address bar, then tap Try again.",
    busy: "Your camera is being used by another app or browser tab. Close it, then tap Try again.",
    none: "No camera was found on this device.",
    generic: "Couldn't start the camera.",
  };

  return (
    <section className="card">
      <div className="eyebrow">{t("cam_eyebrow")}</div>
      <h2>{t("cam_title")}</h2>
      {state === "error" ? (
        <>
          <div className="callout warm"><span className="small">{ERR[errReason]} You can also continue without it - the check-in works just as well.</span></div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={retry}>&#x21bb; Try again</button>
            <button className="btn soft" onClick={skip}>{t("cam_skip")}</button>
          </div>
        </>
      ) : (
        <>
          <p className="muted small">{state === "loading" ? "Loading the on-device model..." : t("cam_hint")}</p>
          <div className="cam-wrap">
            <video ref={videoRef} muted playsInline />
            {state === "running" && (<div className="cam-pill"><span className="cam-dot" />{live ? `${live.emotion} / ${(live.confidence * 100).toFixed(0)}%` : "reading"}</div>)}
          </div>
          {state === "running" && <p className="tiny muted" style={{ textAlign: "center" }}>{ready ? t("cam_ready") : t("cam_gather")}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={finish} disabled={!ready}>{t("cam_continue")}</button>
            <button className="btn soft" onClick={skip}>{t("cam_skip")}</button>
          </div>
        </>
      )}
    </section>
  );
}

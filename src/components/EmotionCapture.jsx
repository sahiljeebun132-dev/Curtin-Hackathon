import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 700;
const MIN_SCORE = 0.5;   // ignore low-confidence detections
const MIN_SAMPLES = 6;   // need several good reads before continuing
const EMOTIONS = ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"];
let MODELS_LOADED = false;

export default function EmotionCapture({ onComplete, onSkip }) {
  const t = useT();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const probSumRef = useRef(Object.fromEntries(EMOTIONS.map((e) => [e, 0]))); // running sum of probabilities (smoothing)
  const timelineRef = useRef([]);
  const confRef = useRef([]);
  const [state, setState] = useState("loading");
  const [errReason, setErrReason] = useState("generic");
  const [live, setLive] = useState(null);
  const [good, setGood] = useState(0);
  const [attempt, setAttempt] = useState(0);

  function stopCamera() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((tk) => tk.stop()); streamRef.current = null; }
    if (videoRef.current) { try { videoRef.current.srcObject = null; } catch { /* ignore */ } }
  }
  const smoothedDominant = () => Object.entries(probSumRef.current).sort((a, b) => b[1] - a[1])[0][0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading"); stopCamera();
      probSumRef.current = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));
      try {
        const faceapi = await import("@vladmandic/face-api");
        if (!MODELS_LOADED) {
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
          MODELS_LOADED = true;
        }
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" } });
        if (cancelled) { stream.getTracks().forEach((tk) => tk.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setState("running");
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }); // larger input = more accurate
        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          const det = await faceapi.detectSingleFace(videoRef.current, opts).withFaceExpressions();
          if (det?.expressions && det.detection.score >= MIN_SCORE) {
            for (const e of EMOTIONS) probSumRef.current[e] += det.expressions[e] || 0; // accumulate -> average
            confRef.current.push(det.detection.score);
            const dom = smoothedDominant();
            timelineRef.current.push(dom);
            setLive({ emotion: dom, confidence: det.detection.score });
            setGood((g) => g + 1);
          }
        }, SAMPLE_MS);
      } catch (e) {
        if (cancelled) return;
        const n = e && e.name;
        setErrReason((n === "NotAllowedError" || n === "SecurityError") ? "denied" : (n === "NotReadableError" || n === "AbortError" || n === "TrackStartError") ? "busy" : (n === "NotFoundError" || n === "OverconstrainedError") ? "none" : "generic");
        setState("error"); stopCamera();
      }
    })();
    return () => { cancelled = true; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function finish() {
    const dominant = good > 0 ? smoothedDominant() : "neutral";
    const confs = confRef.current;
    const avgConf = confs.length ? confs.reduce((s, c) => s + c, 0) / confs.length : 0;
    stopCamera();
    onComplete({ dominant_emotion: dominant, face_detected: good > 0, confidence: Number(avgConf.toFixed(2)), session_duration_seconds: Math.round((timelineRef.current.length * SAMPLE_MS) / 1000), emotion_timeline: timelineRef.current.slice(-8) });
  }
  function retry() { probSumRef.current = Object.fromEntries(EMOTIONS.map((e) => [e, 0])); timelineRef.current = []; confRef.current = []; setLive(null); setGood(0); setAttempt((a) => a + 1); }
  function skip() { stopCamera(); onSkip(); }

  const ready = good >= MIN_SAMPLES;
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
          <div className="callout warm"><span className="small">{ERR[errReason]} You can also continue without it.</span></div>
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={retry}>&#x21bb; Try again</button><button className="btn soft" onClick={skip}>{t("cam_skip")}</button></div>
        </>
      ) : (
        <>
          <p className="muted small">{state === "loading" ? "Loading the on-device model..." : t("cam_hint")}</p>
          <div className="cam-wrap">
            <video ref={videoRef} muted playsInline />
            {state === "running" && (<div className="cam-pill"><span className="cam-dot" />{live ? `${live.emotion} / ${(live.confidence * 100).toFixed(0)}%` : "reading"}</div>)}
          </div>
          {state === "running" && <p className="tiny muted" style={{ textAlign: "center" }}>{ready ? "Reading is stable - ready when you are." : `Reading… ${good}/${MIN_SAMPLES}`}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={finish} disabled={!ready}>{t("cam_continue")}</button>
            <button className="btn soft" onClick={skip}>{t("cam_skip")}</button>
          </div>
        </>
      )}
    </section>
  );
}

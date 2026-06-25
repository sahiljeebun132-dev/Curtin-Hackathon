import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 700;
const MIN_SCORE = 0.5;
const MIN_SAMPLES = 6;
const RED_THRESHOLD = 0.15;
const EAR_LOW = 0.20;
const EMOTIONS = ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"];
let MODELS_LOADED = false;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const earOf = (e) => (dist(e[1], e[5]) + dist(e[2], e[4])) / (2 * dist(e[0], e[3]) || 1);

export default function EmotionCapture({ onComplete, onSkip }) {
  const t = useT();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const probSumRef = useRef(Object.fromEntries(EMOTIONS.map((e) => [e, 0])));
  const timelineRef = useRef([]);
  const confRef = useRef([]);
  const redSumRef = useRef(0); const redCountRef = useRef(0);
  const earSumRef = useRef(0); const earCountRef = useRef(0);
  const [state, setState] = useState("loading");
  const [errReason, setErrReason] = useState("generic");
  const [live, setLive] = useState(null);
  const [eye, setEye] = useState(null); // {red, ear}
  const [good, setGood] = useState(0);
  const [attempt, setAttempt] = useState(0);

  function stopCamera() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((tk) => tk.stop()); streamRef.current = null; }
    if (videoRef.current) { try { videoRef.current.srcObject = null; } catch { /* ignore */ } }
  }
  const smoothedDominant = () => Object.entries(probSumRef.current).sort((a, b) => b[1] - a[1])[0][0];

  function sampleRedness(video, pts) {
    try {
      const w = video.videoWidth, h = video.videoHeight;
      if (!w || !canvasRef.current) return null;
      const c = canvasRef.current; c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(w, Math.ceil(Math.max(...xs)));
      const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(h, Math.ceil(Math.max(...ys)));
      if (x1 <= x0 || y1 <= y0) return null;
      const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let red = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) { red += Math.max(0, (data[i] - (data[i + 1] + data[i + 2]) / 2) / 255); n++; }
      return n ? red / n : null;
    } catch { return null; }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading"); stopCamera();
      probSumRef.current = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));
      redSumRef.current = 0; redCountRef.current = 0; earSumRef.current = 0; earCountRef.current = 0;
      try {
        const faceapi = await import("@vladmandic/face-api");
        if (!MODELS_LOADED) {
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
          MODELS_LOADED = true;
        }
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" } });
        if (cancelled) { stream.getTracks().forEach((tk) => tk.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setState("running");
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          const det = await faceapi.detectSingleFace(videoRef.current, opts).withFaceLandmarks().withFaceExpressions();
          if (det?.expressions && det.detection.score >= MIN_SCORE) {
            for (const e of EMOTIONS) probSumRef.current[e] += det.expressions[e] || 0;
            confRef.current.push(det.detection.score);
            const dom = smoothedDominant();
            timelineRef.current.push(dom);
            setLive({ emotion: dom, confidence: det.detection.score });
            setGood((g) => g + 1);
            try {
              const le = det.landmarks.getLeftEye(), re = det.landmarks.getRightEye();
              const rl = sampleRedness(videoRef.current, le), rr = sampleRedness(videoRef.current, re);
              const r = rl != null && rr != null ? (rl + rr) / 2 : (rl != null ? rl : rr);
              if (r != null) { redSumRef.current += r; redCountRef.current += 1; }
              const e = (earOf(le) + earOf(re)) / 2;
              if (isFinite(e)) { earSumRef.current += e; earCountRef.current += 1; }
              const avgR = redCountRef.current ? redSumRef.current / redCountRef.current : null;
              const avgE = earCountRef.current ? earSumRef.current / earCountRef.current : null;
              setEye({ red: avgR, ear: avgE });
            } catch { /* landmarks unavailable */ }
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
    const avgRed = redCountRef.current ? redSumRef.current / redCountRef.current : null;
    const avgEar = earCountRef.current ? earSumRef.current / earCountRef.current : null;
    const eye_check = {
      redness: avgRed == null ? null : { elevated: avgRed > RED_THRESHOLD, value: Number(avgRed.toFixed(3)) },
      openness: avgEar == null ? null : { value: Number(avgEar.toFixed(3)), state: avgEar < EAR_LOW ? "droopy / low" : "normal" },
    };
    stopCamera();
    onComplete({ dominant_emotion: dominant, face_detected: good > 0, confidence: Number(avgConf.toFixed(2)), session_duration_seconds: Math.round((timelineRef.current.length * SAMPLE_MS) / 1000), emotion_timeline: timelineRef.current.slice(-8), eye_redness: eye_check.redness, eye_check });
  }
  function retry() { probSumRef.current = Object.fromEntries(EMOTIONS.map((e) => [e, 0])); timelineRef.current = []; confRef.current = []; redSumRef.current = 0; redCountRef.current = 0; earSumRef.current = 0; earCountRef.current = 0; setLive(null); setEye(null); setGood(0); setAttempt((a) => a + 1); }
  function skip() { stopCamera(); onSkip(); }

  const ready = good >= MIN_SAMPLES;
  const redPct = eye && eye.red != null ? Math.min(100, Math.round((eye.red / 0.3) * 100)) : 0;
  const redElevated = eye && eye.red != null && eye.red > RED_THRESHOLD;
  const earState = eye && eye.ear != null ? t(eye.ear < EAR_LOW ? "ec_droopy" : "ec_open") : "—";
  const ERR = { denied: t("err_denied"), busy: t("err_busy"), none: t("err_none"), generic: t("err_generic") };

  return (
    <section className="card">
      <div className="eyebrow">{t("cam_eyebrow")}</div>
      <h2>{t("cam_title")}</h2>
      {state === "error" ? (
        <>
          <div className="callout warm"><span className="small">{ERR[errReason]} {t("err_continue")}</span></div>
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={retry}>&#x21bb; {t("cam_retry")}</button><button className="btn soft" onClick={skip}>{t("cam_skip")}</button></div>
        </>
      ) : (
        <>
          <p className="muted small">{state === "loading" ? t("ec_loading") : t("cam_hint")}</p>
          <div className="cam-wrap">
            <video ref={videoRef} muted playsInline />
            {state === "running" && (<div className="cam-pill"><span className="cam-dot" />{live ? `${live.emotion} / ${(live.confidence * 100).toFixed(0)}%` : "reading"}</div>)}
          </div>
          {state === "running" && (
            <div className="eye-check">
              <div className="ec-head">👁  {t("ec_title")} <span className="ec-tag">{t("ec_tag")}</span></div>
              <div className="ec-row"><span className="ec-lbl">{t("ec_redness")}</span><div className="ec-bar"><div className="ec-fill" style={{ width: redPct + "%", background: redElevated ? "var(--crisis)" : "var(--primary)" }} /></div><span className="ec-val" style={{ color: redElevated ? "var(--crisis)" : "var(--low)" }}>{redElevated ? t("ec_elevated") : t("ec_low")}</span></div>
              <div className="ec-row"><span className="ec-lbl">{t("ec_eyes")}</span><span className="ec-val">{earState}</span></div>
              <div className="tiny muted" style={{ marginTop: 4 }}>{t("ec_note")}</div>
            </div>
          )}
          {state === "running" && <p className="tiny muted" style={{ textAlign: "center" }}>{ready ? t("cam_stable") : `${t("cam_scanning")}… ${good}/${MIN_SAMPLES}`}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={finish} disabled={!ready}>{t("cam_continue")}</button>
            <button className="btn soft" onClick={skip}>{t("cam_skip")}</button>
          </div>
        </>
      )}
    </section>
  );
}

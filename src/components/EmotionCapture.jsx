// ===================================================================
// EmotionCapture — Source A (facial & emotion analysis).
//
// Uses @vladmandic/face-api (the MAINTAINED fork) to read the 7 facial
// expressions from the webcam, in the browser, in real time. Nothing is
// uploaded — all inference is local (privacy by design, Spec Section 8).
//
// Model weights are loaded from the package's CDN so we don't have to
// ship binary files in the repo. Two tiny models are enough:
//   - tinyFaceDetector  (finds the face + a detection confidence)
//   - faceExpressionNet (the 7 expression probabilities)
// ===================================================================
import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 700; // how often we read an expression

export default function EmotionCapture({ onComplete }) {
  const videoRef = useRef(null);
  const timelineRef = useRef([]);       // running list of dominant emotions
  const confidencesRef = useRef([]);    // running list of detection scores
  const [status, setStatus] = useState("Loading face model…");
  const [live, setLive] = useState({ emotion: "—", confidence: 0 });
  const [running, setRunning] = useState(false);

  // 1) Load models + start the camera once on mount.
  useEffect(() => {
    let stream;
    let interval;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setStatus("Requesting camera…");
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("Reading expressions… look at the camera naturally.");
        setRunning(true);

        // 2) Every SAMPLE_MS, detect the dominant expression.
        interval = setInterval(async () => {
          if (!videoRef.current) return;
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (det?.expressions) {
            // expressions = {neutral, happy, sad, angry, fearful, disgusted, surprised}
            const [emotion] = Object.entries(det.expressions).sort((a, b) => b[1] - a[1])[0];
            timelineRef.current.push(emotion);
            confidencesRef.current.push(det.detection.score);
            setLive({ emotion, confidence: det.detection.score });
          }
        }, SAMPLE_MS);
      } catch (err) {
        // Camera denied / unavailable -> we degrade gracefully. The engine
        // already handles "no facial data" by contributing 0 and lowering confidence.
        setStatus("Camera unavailable — you can continue without facial data.");
      }
    })();

    return () => {
      clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop()); // release the camera
    };
  }, []);

  // 3) Build the Source-A object the engine expects, and hand it to the parent.
  function finish() {
    const timeline = timelineRef.current;
    const confs = confidencesRef.current;
    const faceDetected = timeline.length > 0;

    // dominant emotion across the whole session = most frequent one
    const counts = timeline.reduce((m, e) => ((m[e] = (m[e] || 0) + 1), m), {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
    const avgConf = confs.length ? confs.reduce((s, c) => s + c, 0) / confs.length : 0;

    onComplete({
      dominant_emotion: dominant,
      face_detected: faceDetected,
      confidence: Number(avgConf.toFixed(2)),
      session_duration_seconds: Math.round((timeline.length * SAMPLE_MS) / 1000),
      // keep the timeline compact (last 8 reads) so the numbing-pattern check is meaningful
      emotion_timeline: timeline.slice(-8),
    });
  }

  function skip() {
    onComplete({ face_detected: false, dominant_emotion: "n/a", confidence: 0, emotion_timeline: [] });
  }

  return (
    <section className="panel">
      <h2>Step 1 · Emotion reading <span className="muted small">(optional, local only)</span></h2>
      <p className="muted small">{status}</p>
      <video ref={videoRef} muted playsInline width={320} height={240} className="video" />
      {running && (
        <p className="muted small">
          Live: <strong>{live.emotion}</strong> · confidence {(live.confidence * 100).toFixed(0)}%
          · samples {timelineRef.current.length}
        </p>
      )}
      <div className="row">
        <button className="btn" onClick={finish} disabled={!running}>Use this reading →</button>
        <button className="btn ghost" onClick={skip}>Skip (no camera)</button>
      </div>
      <p className="muted small">
        Video never leaves this device. Only summary emotion data is passed to the assessment.
      </p>
    </section>
  );
}

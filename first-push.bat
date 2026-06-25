// Shared medication store. Persisted to localStorage on THIS device only
// (with the patient/guardian's consent) so it survives role switches and
// refreshes. Nothing leaves the device. A real product would sync via a
// secure backend across devices.
import { createContext, useContext, useState, useRef, useEffect, useCallback, createElement } from "react";
import { cacheGet, cacheSet } from "./secure.js";

const KEY = "vela_meds";
let _id = 1;
const SEED = [{ id: 1, name: "Methadone", dose: "10 mg", instructions: "With water, morning and night", times: ["08:00", "20:00"], log: {}, addedBy: "guardian" }];

function loadMeds() {
  const arr = cacheGet("meds");
  if (Array.isArray(arr) && arr.length) { _id = Math.max(1, ...arr.map((m) => Number(m.id) || 0)) + 1; return arr; }
  _id = 2; return SEED;
}

function beep() {
  try {
    const A = new (window.AudioContext || window.webkitAudioContext)();
    const o = A.createOscillator(), g = A.createGain();
    o.connect(g); g.connect(A.destination);
    o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.07;
    o.start(); o.frequency.setValueAtTime(660, A.currentTime + 0.2);
    setTimeout(() => { o.stop(); A.close(); }, 500);
  } catch { /* no audio */ }
}

const MedsCtx = createContext(null);

export function MedsProvider({ children }) {
  const [meds, setMeds] = useState(loadMeds);
  const [alarm, setAlarm] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const firedRef = useRef({});
  const startMin = useRef(new Date().getHours() * 60 + new Date().getMinutes());

  useEffect(() => { cacheSet("meds", meds); }, [meds]);
  useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);

  const addMed = useCallback((m) => setMeds((s) => [...s, { id: _id++, log: {}, ...m }]), []);
  const removeMed = useCallback((id) => setMeds((s) => s.filter((m) => m.id !== id)), []);
  const addAlert = useCallback((medId, time, name) => setAlerts((a) => a.find((x) => x.medId === medId && x.time === time) ? a : [...a, { medId, time, name, ts: Date.now() }]), []);
  const markDose = useCallback((id, time, status) => {
    setMeds((s) => s.map((m) => m.id === id ? { ...m, log: { ...m.log, [time]: status } } : m));
    if (status === "taken") setAlerts((a) => a.filter((x) => !(x.medId === id && x.time === time)));
    if (status === "missed") setMeds((s) => { const m = s.find((x) => x.id === id); if (m) addAlert(id, time, m.name); return s; });
  }, [addAlert]);
  const dismissAlert = useCallback((medId, time) => setAlerts((a) => a.filter((x) => !(x.medId === medId && x.time === time))), []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const mins = now.getHours() * 60 + now.getMinutes();
      meds.forEach((m) => m.times.forEach((tm) => {
        const [h, mm] = tm.split(":").map(Number);
        const tmin = h * 60 + mm;
        const dueKey = m.id + "_" + tm + "_" + hhmm;
        if (tm === hhmm && !firedRef.current[dueKey] && !m.log[tm]) {
          firedRef.current[dueKey] = true;
          setAlarm(`${m.name} ${m.dose} - ${tm}`); beep();
          if ("Notification" in window && Notification.permission === "granted") new Notification("VELA - medication", { body: `${m.name} ${m.dose} (${tm})` });
          setTimeout(() => setAlarm(null), 9000);
        }
        const missKey = m.id + "_" + tm + "_miss";
        if (tmin >= startMin.current && mins > tmin + 2 && !m.log[tm] && !firedRef.current[missKey]) {
          firedRef.current[missKey] = true;
          setMeds((s) => s.map((x) => x.id === m.id ? { ...x, log: { ...x.log, [tm]: "missed" } } : x));
          addAlert(m.id, tm, m.name);
        }
      }));
    };
    const iv = setInterval(tick, 15000); tick();
    return () => clearInterval(iv);
  }, [meds, addAlert]);

  return createElement(MedsCtx.Provider, { value: { meds, addMed, removeMed, markDose, alarm, setAlarm, alerts, dismissAlert } }, children);
}
export function useMeds() { return useContext(MedsCtx); }

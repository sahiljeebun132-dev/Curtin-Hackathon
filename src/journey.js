// Real sober-day counter, stored on this device. Starts the day the person
// first opens VELA (day 0 / "day 1"), grows over time. Resettable.
const KEY = "vela_journey_start";
export function journeyDays() {
  try {
    let s = localStorage.getItem(KEY);
    if (!s) { s = String(Date.now()); localStorage.setItem(KEY, s); }
    return Math.max(0, Math.floor((Date.now() - Number(s)) / 86400000));
  } catch { return 0; }
}

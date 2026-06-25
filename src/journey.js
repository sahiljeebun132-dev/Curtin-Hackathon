import { cacheGet, cacheSet } from "./secure.js";
// Real sober-day counter, stored ENCRYPTED on this device.
export function journeyDays() {
  let s = cacheGet("journey_start");
  if (!s) { s = Date.now(); cacheSet("journey_start", s); }
  return Math.max(0, Math.floor((Date.now() - Number(s)) / 86400000));
}

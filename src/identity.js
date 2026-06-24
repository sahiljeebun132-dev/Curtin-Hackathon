// Privacy-safe identity. NO national ID, NO real names, NO registry.
// - Patients choose a pseudonym; an anonymous ID is generated.
// - Optional phone is hashed one-way (SHA-256) to a de-dup fingerprint; the
//   number itself is never stored.
// - Stored only in this browser (localStorage), deletable anytime.
// - Guardian/social-worker views require a staff access code; patients stay anonymous.
import { createContext, useContext, useState, useEffect, useCallback, createElement } from "react";

const KEY = "vela_identity";
const STAFF_CODE = "VELA-STAFF"; // demo only - a real build verifies against a secure backend
const rand = () => "vela-" + Math.random().toString(36).slice(2, 8).toUpperCase();

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const IdCtx = createContext(null);

export function IdentityProvider({ children }) {
  const [pseudonym, setPseudo] = useState("");
  const [anonId, setAnonId] = useState("");
  const [dedupToken, setDedupToken] = useState("");
  const [staffVerified, setStaffVerified] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); setPseudo(d.pseudonym || ""); setAnonId(d.anonId || ""); setDedupToken(d.dedupToken || ""); } } catch { /* ignore */ }
  }, []);
  function persist(p, a, d) { try { localStorage.setItem(KEY, JSON.stringify({ pseudonym: p, anonId: a, dedupToken: d })); } catch { /* ignore */ } }

  const setPseudonym = useCallback((name) => {
    const a = anonId || rand();
    setPseudo(name); setAnonId(a); persist(name, a, dedupToken);
  }, [anonId, dedupToken]);

  const hashPhone = useCallback(async (phone) => {
    const h = (await sha256hex(phone.trim())).slice(0, 16);
    setDedupToken(h); persist(pseudonym, anonId || rand(), h);
    return h; // the raw phone is discarded here - only this fingerprint is kept
  }, [pseudonym, anonId]);

  const forget = useCallback(() => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setPseudo(""); setAnonId(""); setDedupToken(""); }, []);
  const verifyStaff = useCallback((code) => { const ok = code.trim().toUpperCase() === STAFF_CODE; setStaffVerified(ok); return ok; }, []);

  return createElement(IdCtx.Provider, { value: { pseudonym, anonId, dedupToken, staffVerified, setPseudonym, hashPhone, forget, verifyStaff } }, children);
}
export function useIdentity() { return useContext(IdCtx); }

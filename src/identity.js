// Privacy-safe identity + guardian/patient pairing. NO national ID, NO registry.
// - Pseudonym + anonymous ID; optional phone hashed (SHA-256), number discarded.
// - Pairing: guardian generates a code; patient enters it to link. In this demo
//   both live in one browser; in production the code pairs the two phones via a
//   secure backend. Stored on-device only, deletable anytime.
import { createContext, useContext, useState, useEffect, useCallback, createElement } from "react";

const KEY = "vela_identity";
const LINK_KEY = "vela_link_code";
const LINKED_KEY = "vela_linked";
const TRUST_KEY = "vela_trusted";
const STAFF_CODE = "VELA-STAFF";
const rand = () => "vela-" + Math.random().toString(36).slice(2, 8).toUpperCase();
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();

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
  const [linkCode, setLinkCode] = useState("");   // guardian's shareable code
  const [linked, setLinked] = useState(false);     // patient linked?
  const [trustedName, setTrustedName] = useState("");
  const [trustedPhone, setTrustedPhone] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); setPseudo(d.pseudonym || ""); setAnonId(d.anonId || ""); setDedupToken(d.dedupToken || ""); }
      setLinkCode(localStorage.getItem(LINK_KEY) || "");
      setLinked(localStorage.getItem(LINKED_KEY) === "1");
      const tr = JSON.parse(localStorage.getItem(TRUST_KEY) || "null"); if (tr) { setTrustedName(tr.name || ""); setTrustedPhone(tr.phone || ""); }
    } catch { /* ignore */ }
  }, []);
  function persist(p, a, d) { try { localStorage.setItem(KEY, JSON.stringify({ pseudonym: p, anonId: a, dedupToken: d })); } catch { /* ignore */ } }

  const setPseudonym = useCallback((name) => { const a = anonId || rand(); setPseudo(name); setAnonId(a); persist(name, a, dedupToken); }, [anonId, dedupToken]);
  const hashPhone = useCallback(async (phone) => { const h = (await sha256hex(phone.trim())).slice(0, 16); setDedupToken(h); persist(pseudonym, anonId || rand(), h); return h; }, [pseudonym, anonId]);
  const forget = useCallback(() => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setPseudo(""); setAnonId(""); setDedupToken(""); }, []);
  const verifyStaff = useCallback((c) => { const ok = c.trim().toUpperCase() === STAFF_CODE; setStaffVerified(ok); return ok; }, []);

  // --- pairing ---
  const generateLink = useCallback(() => { const c = code6(); setLinkCode(c); try { localStorage.setItem(LINK_KEY, c); } catch { /* ignore */ } return c; }, []);
  const tryLink = useCallback((c) => {
    const stored = (localStorage.getItem(LINK_KEY) || "").toUpperCase();
    const ok = stored !== "" && c.trim().toUpperCase() === stored;
    if (ok) { setLinked(true); try { localStorage.setItem(LINKED_KEY, "1"); } catch { /* ignore */ } }
    return ok;
  }, []);
  const unlink = useCallback(() => { setLinked(false); try { localStorage.removeItem(LINKED_KEY); } catch { /* ignore */ } }, []);
  const setTrusted = useCallback((name, phone) => { setTrustedName(name); setTrustedPhone(phone); try { localStorage.setItem(TRUST_KEY, JSON.stringify({ name, phone })); } catch { /* ignore */ } }, []);
  const clearTrusted = useCallback(() => { setTrustedName(""); setTrustedPhone(""); try { localStorage.removeItem(TRUST_KEY); } catch { /* ignore */ } }, []);

  return createElement(IdCtx.Provider, { value: { pseudonym, anonId, dedupToken, staffVerified, setPseudonym, hashPhone, forget, verifyStaff, linkCode, linked, generateLink, tryLink, unlink, trustedName, trustedPhone, setTrusted, clearTrusted } }, children);
}
export function useIdentity() { return useContext(IdCtx); }

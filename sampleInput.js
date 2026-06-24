// Privacy-safe identity + pairing + trusted contact, all stored ENCRYPTED
// (AES-256-GCM via secure.js). No national ID, no registry.
import { createContext, useContext, useState, useEffect, useCallback, createElement } from "react";
import { cacheGet, cacheSet, cacheRemove } from "./secure.js";

const STAFF_CODE = "VELA-STAFF";
const rand = () => "vela-" + Math.random().toString(36).slice(2, 8).toUpperCase();
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();
async function sha256hex(str) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

const IdCtx = createContext(null);
export function IdentityProvider({ children }) {
  const [pseudonym, setPseudo] = useState("");
  const [anonId, setAnonId] = useState("");
  const [dedupToken, setDedupToken] = useState("");
  const [staffVerified, setStaffVerified] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [linked, setLinked] = useState(false);
  const [trustedName, setTrustedName] = useState("");
  const [trustedPhone, setTrustedPhone] = useState("");

  useEffect(() => {
    const d = cacheGet("identity"); if (d) { setPseudo(d.pseudonym || ""); setAnonId(d.anonId || ""); setDedupToken(d.dedupToken || ""); }
    setLinkCode(cacheGet("link_code") || "");
    setLinked(cacheGet("linked") === true);
    const tr = cacheGet("trusted"); if (tr) { setTrustedName(tr.name || ""); setTrustedPhone(tr.phone || ""); }
  }, []);
  const persist = (p, a, d) => cacheSet("identity", { pseudonym: p, anonId: a, dedupToken: d });

  const setPseudonym = useCallback((name) => { const a = anonId || rand(); setPseudo(name); setAnonId(a); persist(name, a, dedupToken); }, [anonId, dedupToken]);
  const hashPhone = useCallback(async (phone) => { const h = (await sha256hex(phone.trim())).slice(0, 16); setDedupToken(h); persist(pseudonym, anonId || rand(), h); return h; }, [pseudonym, anonId]);
  const forget = useCallback(() => { cacheRemove("identity"); setPseudo(""); setAnonId(""); setDedupToken(""); }, []);
  const verifyStaff = useCallback((c) => { const ok = c.trim().toUpperCase() === STAFF_CODE; setStaffVerified(ok); return ok; }, []);
  const generateLink = useCallback(() => { const c = code6(); setLinkCode(c); cacheSet("link_code", c); return c; }, []);
  const tryLink = useCallback((c) => { const stored = String(cacheGet("link_code") || "").toUpperCase(); const ok = stored !== "" && c.trim().toUpperCase() === stored; if (ok) { setLinked(true); cacheSet("linked", true); } return ok; }, []);
  const unlink = useCallback(() => { setLinked(false); cacheRemove("linked"); }, []);
  const setTrusted = useCallback((name, phone) => { setTrustedName(name); setTrustedPhone(phone); cacheSet("trusted", { name, phone }); }, []);
  const clearTrusted = useCallback(() => { setTrustedName(""); setTrustedPhone(""); cacheRemove("trusted"); }, []);

  return createElement(IdCtx.Provider, { value: { pseudonym, anonId, dedupToken, staffVerified, setPseudonym, hashPhone, forget, verifyStaff, linkCode, linked, generateLink, tryLink, unlink, trustedName, trustedPhone, setTrusted, clearTrusted } }, children);
}
export function useIdentity() { return useContext(IdCtx); }

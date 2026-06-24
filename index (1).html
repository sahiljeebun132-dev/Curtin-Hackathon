// At-rest encryption for all on-device data.
// AES-256-GCM with a NON-EXTRACTABLE CryptoKey kept in IndexedDB - the raw key
// is never exposed to JS, so stored values can't be read without this device's
// browser. Values live in localStorage as {iv, ct} base64 under "enc:<name>".
// A synchronous in-memory cache is hydrated once at boot (loadAll) so the rest
// of the app can read/write without going async everywhere.
const DB = "vela-secure", STORE = "keys", KEY_ID = "aes-gcm";
let cache = {};
let keyPromise = null;

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(k) { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction(STORE, "readonly").objectStore(STORE).get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); }
async function idbPut(k, v) { const db = await openDB(); return new Promise((res, rej) => { const t = db.transaction(STORE, "readwrite").objectStore(STORE).put(v, k); t.onsuccess = () => res(); t.onerror = () => rej(t.error); }); }

function getKey() {
  if (!keyPromise) keyPromise = (async () => {
    let k = await idbGet(KEY_ID);
    if (!k) { k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false /* non-extractable */, ["encrypt", "decrypt"]); await idbPut(KEY_ID, k); }
    return k;
  })();
  return keyPromise;
}
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function encryptStore(name, obj) {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    localStorage.setItem("enc:" + name, JSON.stringify({ iv: b64(iv), ct: b64(ct) }));
  } catch { /* storage/crypto unavailable */ }
}

// Hydrate the in-memory cache by decrypting every enc:* entry. Call once at boot.
export async function loadAll() {
  try {
    if (!("crypto" in window) || !crypto.subtle || !("indexedDB" in window)) return;
    const key = await getKey();
    const names = [];
    for (let i = 0; i < localStorage.length; i++) { const lk = localStorage.key(i); if (lk && lk.startsWith("enc:")) names.push(lk); }
    for (const lk of names) {
      try { const { iv, ct } = JSON.parse(localStorage.getItem(lk)); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct)); cache[lk.slice(4)] = JSON.parse(new TextDecoder().decode(pt)); } catch { /* skip bad entry */ }
    }
  } catch { /* boot without stored data */ }
}

export function cacheGet(name) { return name in cache ? cache[name] : null; }
export function cacheSet(name, obj) { cache[name] = obj; encryptStore(name, obj); } // fire-and-forget encrypt
export function cacheRemove(name) { delete cache[name]; try { localStorage.removeItem("enc:" + name); } catch { /* ignore */ } }
export function cacheClearAll() {
  cache = {};
  try { Object.keys(localStorage).forEach((k) => { if (k.startsWith("enc:") || k.startsWith("vela_")) localStorage.removeItem(k); }); } catch { /* ignore */ }
}

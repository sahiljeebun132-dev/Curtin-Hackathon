// Text-to-speech via the browser. Kreol has no TTS voice, so it falls back to
// French (closest available). No external service.
const LANGMAP = { english: "en-US", french: "fr-FR", creole: "fr-FR" };
export function speak(text, lang) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGMAP[lang] || "en-US";
    u.rate = 0.98;
    synth.speak(u);
  } catch { /* TTS unavailable */ }
}
export function stopSpeaking() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ } }

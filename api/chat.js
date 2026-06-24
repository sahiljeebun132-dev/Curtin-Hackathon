// Optional real-LLM proxy (Vercel serverless). Activates ONLY if an API key
// is set in the environment; otherwise returns {fallback:true} and the client
// uses the safe local companion. Strong safety prompt: a supportive guide,
// never a therapist, with crisis escalation.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(200).json({ fallback: true });
  try {
    const { messages = [], context = {} } = req.body || {};
    const system =
      "You are VELA's supportive companion for someone in Mauritius who just did a substance-use risk check-in. " +
      "You are NOT a therapist or doctor and you NEVER diagnose. Be warm, brief (2-4 sentences), plain, non-judgemental. " +
      "Help them take ONE small next step and connect with real people. Encourage human support over relying on you. " +
      "If there is ANY sign of self-harm, suicide or crisis, do not counsel - gently and immediately tell them to contact " +
      "Befrienders Mauritius 800 9393 and SAMU 114 and to be with someone they trust now. " +
      "Never give medical or dosing advice. Context about this person (do not read it back verbatim): " + JSON.stringify(context);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: system }, ...messages].slice(0, 20),
        max_tokens: 220, temperature: 0.6,
      }),
    });
    const data = await r.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply) return res.status(200).json({ fallback: true });
    return res.status(200).json({ reply: reply.trim() });
  } catch {
    return res.status(200).json({ fallback: true });
  }
}

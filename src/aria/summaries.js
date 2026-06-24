// ===================================================================
// HYBRID SUMMARY LAYER. Deterministic by default; an optional LLM may
// only REWORD the approved text. `opts.self` makes it address the person
// directly ("you") when they take their own check-in.
// ===================================================================
const PLAIN = {
  self: {
    Crisis: "Based on what you shared today, you may be going through real distress right now, and you deserve support immediately.",
    High: "Based on what you shared today, you seem to be going through a hard time and could really benefit from talking to someone.",
    Medium: "Based on what you shared today, you may be struggling a little - talking with a counsellor could help.",
    Low: "Based on what you shared today, things seem mostly okay, with a few signs worth gently keeping an eye on.",
  },
  other: {
    Crisis: "Based on what was shared today, this person may be in immediate distress and needs someone to stay with them right now.",
    High: "Based on what was shared today, this person appears to be going through a serious difficult time and would benefit from priority support.",
    Medium: "Based on what was shared today, this person may be struggling and could benefit from speaking with a counsellor soon.",
    Low: "Based on what was shared today, there are some signs worth keeping an eye on, but nothing urgent right now.",
  },
};

export function deterministicPlainSummary(result, self = false) {
  const level = result.risk_profile.overall_risk_level;
  const ref = result.intervention.primary_referral.organisation;
  const base = (self ? PLAIN.self : PLAIN.other)[level] || PLAIN.other.Low;
  const tail = self
    ? ` A kind next step is to reach out to ${ref}. This is not a diagnosis - just a gentle nudge that support is there for you.`
    : ` A good next step is to connect with ${ref}. This is not a diagnosis - it is a flag for a trained person to check in.`;
  return base + tail;
}

export function deterministicCreoleSummary(result, self = false) {
  const level = result.risk_profile.overall_risk_level;
  const who = self ? "to" : "sa dimoun la";
  const base =
    level === "Crisis" ? `Dapre seki finn partaze zordi, ${self ? "to" : "sa dimoun la"} kapav pe travers enn moman bien difisil. ${self ? "To meriter sipor deswit." : "Pa les li tousel."}`
    : level === "High" ? `Dapre seki finn partaze zordi, ${who} paret pe travers enn moman difisil ek bizin sipor vit.`
    : level === "Medium" ? `Dapre seki finn partaze zordi, ${who} kapav pe lite ek kapav koz ek enn konseye.`
    : `Dapre seki finn partaze zordi, ena de-trwa siyn pou veye, me pa ena irzans pou lemoman.`;
  return `${base} Enn bon premie pa: kontakte Befrienders Mauritius lor 800 9393. Sa pa enn diagnostik.`;
}

export async function attachSummaries(result, llmFn = null, opts = {}) {
  const self = !!opts.self;
  const plainFallback = deterministicPlainSummary(result, self);
  const creoleNeeded = result.language_used === "creole";
  const creoleFallback = creoleNeeded ? deterministicCreoleSummary(result, self) : "";

  if (typeof llmFn !== "function") {
    return { ...result, plain_language_summary: plainFallback, creole_summary: creoleFallback };
  }
  try {
    const guard = "Reword this approved safeguarding summary. Do NOT change any facts, scores, names or phone numbers. Keep it warm, Grade-8, non-stigmatising. Return ONLY the reworded text.";
    const plain = await llmFn(`${guard}\n\nApproved:\n${plainFallback}`);
    let creole = creoleFallback;
    if (creoleNeeded) creole = await llmFn(`${guard} Write it in Mauritian Creole.\n\nApproved:\n${creoleFallback}`);
    return { ...result, plain_language_summary: (plain || plainFallback).trim(), creole_summary: (creole || creoleFallback).trim() };
  } catch {
    return { ...result, plain_language_summary: plainFallback, creole_summary: creoleFallback };
  }
}

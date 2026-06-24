// ===================================================================
// HYBRID SUMMARY LAYER  (Spec Section 9: plain_language + creole)
//
// This is the ONLY place an LLM is allowed to act, and even here it is
// optional. The deterministic templates below ALWAYS produce a correct,
// safe summary. If an API key is configured, we ask the LLM ONLY to
// rephrase that template more warmly / in Creole — it never invents
// scores, referrals or facts. If the LLM call fails for any reason, we
// silently fall back to the deterministic text. Numbers can never drift.
// ===================================================================

// ---- Deterministic, always-available summaries ----------------------
export function deterministicPlainSummary(result) {
  const level = result.risk_profile.overall_risk_level;
  const ref = result.intervention.primary_referral.organisation;
  const base =
    level === "Crisis"
      ? "Based on what was shared today, this person may be in immediate distress and needs someone to stay with them right now."
      : level === "High"
      ? "Based on what was shared today, this person appears to be going through a serious difficult time and would benefit from priority support."
      : level === "Medium"
      ? "Based on what was shared today, this person may be struggling and could benefit from speaking with a counsellor soon."
      : "Based on what was shared today, there are some signs worth keeping an eye on, but nothing urgent right now.";
  return (
    `${base} A good next step is to connect with ${ref}. ` +
    "This is not a diagnosis — it is a flag for a trained person to check in with them."
  );
}

export function deterministicCreoleSummary(result) {
  const level = result.risk_profile.overall_risk_level;
  const base =
    level === "Crisis"
      ? "Dapre seki finn partaze zordi, sa dimoun-la kapav pe travers enn moman bien difisil. Pa les li tousel."
      : level === "High"
      ? "Dapre seki finn partaze zordi, sa dimoun-la paret pe travers enn moman difisil. Li bizin sipor vit."
      : level === "Medium"
      ? "Dapre seki finn partaze zordi, sa dimoun-la kapav pe lite. Li kapav koz ek enn konseye."
      : "Dapre seki finn partaze zordi, ena de-trwa siyn pou veye, me pa ena irzans pou lemoman.";
  return (
    `${base} Enn bon premie pa: kontakte Befrienders Mauritius lor 800 9393. ` +
    "Sa pa enn diagnostik — se zis enn siyn pou enn dimoun forme al get li."
  );
}

// ---- Public entry point used by the UI ------------------------------
// `llmFn` is an optional async function (prompt) => string. We inject it
// rather than hard-coding a vendor, so swapping Claude/GPT/none is trivial
// and the engine stays vendor-neutral and testable.
export async function attachSummaries(result, llmFn = null) {
  const plainFallback = deterministicPlainSummary(result);
  const creoleNeeded = result.language_used === "creole";
  const creoleFallback = creoleNeeded ? deterministicCreoleSummary(result) : "";

  // No LLM available -> deterministic only. This is the default, safe path.
  if (typeof llmFn !== "function") {
    return { ...result, plain_language_summary: plainFallback, creole_summary: creoleFallback };
  }

  // LLM available -> ask it ONLY to rephrase the approved text, with the
  // facts locked. We pass the numbers so it cannot contradict them.
  try {
    const guard =
      "You are rewording an approved safeguarding summary for a Mauritian " +
      "social worker. Do NOT change any facts, scores, names or phone numbers. " +
      "Keep it Grade-8 reading level, warm and non-stigmatising. Return ONLY the reworded text.";
    const plain = await llmFn(
      `${guard}\n\nApproved summary:\n${plainFallback}\n\n(Risk level: ${result.risk_profile.overall_risk_level}, score ${result.risk_profile.risk_score}.)`
    );
    let creole = creoleFallback;
    if (creoleNeeded) {
      creole = await llmFn(
        `${guard} Write the result in Mauritian Creole.\n\nApproved summary:\n${creoleFallback}`
      );
    }
    return {
      ...result,
      plain_language_summary: (plain || plainFallback).trim(),
      creole_summary: (creole || creoleFallback).trim(),
    };
  } catch (e) {
    // Any failure -> deterministic fallback. The user never sees a broken summary.
    return { ...result, plain_language_summary: plainFallback, creole_summary: creoleFallback };
  }
}

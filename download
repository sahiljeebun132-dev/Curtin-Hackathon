// Plain Node test (no framework) — proves the engine runs, is
// deterministic, and that the crisis override fires. Run: npm run test:engine
import { runAriaAssessment } from "./engine.js";
import { attachSummaries } from "./summaries.js";
import { SAMPLE_INPUT } from "./sampleInput.js";

let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
};

console.log("\n--- Case 1: sample mid/high-risk case ---");
const r1 = runAriaAssessment(SAMPLE_INPUT);
const b = r1.risk_profile.score_breakdown;
console.log(`  score=${r1.risk_profile.risk_score} level=${r1.risk_profile.overall_risk_level}`);
console.log(`  breakdown=`, b);
console.log(`  flags=`, r1.flags);
check("score is within 0-100", r1.risk_profile.risk_score >= 0 && r1.risk_profile.risk_score <= 100);
check("every sub-score within 0-25",
  [b.behavioural, b.emotional, b.physical, b.environmental].every((x) => x >= 0 && x <= 25));
check("Roche Bois raised geographic_risk_flag", r1.flags.geographic_risk_flag === true);
check("alcohol + sousou raised poly_substance_flag", r1.flags.poly_substance_flag === true);
check("no self-harm -> crisis_flag false", r1.flags.crisis_flag === false);
check("human_review_required is always true", r1.intervention.human_review_required === true);

console.log("\n--- Case 2: determinism (same input twice) ---");
const a = runAriaAssessment(SAMPLE_INPUT).risk_profile.risk_score;
const c = runAriaAssessment(SAMPLE_INPUT).risk_profile.risk_score;
check("same input -> identical score", a === c);

console.log("\n--- Case 3: self-harm forces Crisis override ---");
const crisisInput = {
  ...SAMPLE_INPUT,
  answers: { ...SAMPLE_INPUT.answers, self_harm_ideation: 2 },
};
const r3 = runAriaAssessment(crisisInput);
check("crisis_flag true", r3.flags.crisis_flag === true);
check("level overridden to Crisis", r3.risk_profile.overall_risk_level === "Crisis");
check("urgency Immediate", r3.intervention.urgency === "Immediate");
check("crisis_message mentions Befrienders 800 9393", r3.crisis_message.includes("800 9393"));
check("crisis_message says do NOT leave alone", /do not leave/i.test(r3.crisis_message));

console.log("\n--- Case 4: emotional-numbing timeline pattern ---");
const numbingInput = {
  ...SAMPLE_INPUT,
  answers: { ...SAMPLE_INPUT.answers, self_harm_ideation: 0 },
  facial: { ...SAMPLE_INPUT.facial, emotion_timeline: ["angry", "fearful", "fearful", "neutral"] },
};
const r4 = runAriaAssessment(numbingInput);
check("emotional_numbing_flag true", r4.flags.emotional_numbing_flag === true);

console.log("\n--- Case 5: deterministic summaries attach (no LLM) ---");
const withSummary = await attachSummaries(r1, null);
check("plain_language_summary populated", withSummary.plain_language_summary.length > 20);
check("english case has empty creole summary", withSummary.creole_summary === "");

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);

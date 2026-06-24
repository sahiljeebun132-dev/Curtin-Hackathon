import { runAriaAssessment } from "./engine.js";
import { attachSummaries } from "./summaries.js";
import { BEHAVIOURAL_QUESTIONS } from "./constants.js";
const ALL_IDS = BEHAVIOURAL_QUESTIONS.map((q) => q.id);

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  FAIL:", name); } };

const REQUIRED = ["aria_version","assessment_id","timestamp","language_used","risk_profile","flags",
  "facial_analysis_summary","explainability","recovery_readiness","intervention","follow_up",
  "fairness_audit","plain_language_summary","system_footer"];

function checkShape(label, r) {
  REQUIRED.forEach((k) => ok(`${label}: has ${k}`, r[k] !== undefined));
  const s = r.risk_profile.risk_score;
  ok(`${label}: score 0-100`, Number.isFinite(s) && s >= 0 && s <= 100);
  const b = r.risk_profile.score_breakdown;
  ok(`${label}: subscores 0-25`, [b.behavioural,b.emotional,b.physical,b.environmental].every(x=>x>=0&&x<=25));
  ok(`${label}: flags all boolean`, Object.values(r.flags).every((v)=>typeof v==="boolean"));
  ok(`${label}: human_review_required true`, r.intervention.human_review_required === true);
  ok(`${label}: referral has contact`, !!r.intervention.primary_referral.contact);
  ok(`${label}: readiness 0-10`, r.recovery_readiness.score>=0 && r.recovery_readiness.score<=10);
}

const scenarios = {
  empty: {},
  allMin: { answers:{}, protective:{}, metadata:{} },
  allMax: { answers: Object.fromEntries(ALL_IDS.map((k) => [k, 3])),
    protective:{}, metadata:{ subject_age_group:"19_to_25", geographic_zone:"Roche Bois", substances_mentioned:["heroin","sousou"], children_in_household:true } },
  crisis: { answers:{ self_harm_ideation:2 }, metadata:{} },
  under15: { answers: Object.fromEntries(ALL_IDS.map((k) => [k, 3])), metadata:{ subject_age_group:"under_15", substances_mentioned:["heroin"] } },
  noFacial: { answers:{ sleep_disruption:2 }, metadata:{}, facial:null },
  numbing: { answers:{}, metadata:{}, facial:{ face_detected:true, dominant_emotion:"angry", confidence:0.8, emotion_timeline:["angry","fearful","fearful","neutral"] } },
  protectiveHeavy: { answers:{ sleep_disruption:1 }, protective:{ family_support:2, education_employment:2, community_involvement:2, motivation_to_change:2, prior_recovery:2 }, metadata:{ referrer_type:"self" } },
};

for (const [name, input] of Object.entries(scenarios)) {
  let r;
  try { r = runAriaAssessment(input); } catch(e){ fail++; console.log(`  THREW (${name}):`, e.message); continue; }
  checkShape(name, r);
}

// crisis behaviour
const c = runAriaAssessment(scenarios.crisis);
ok("crisis: flag true", c.flags.crisis_flag === true);
ok("crisis: level Crisis", c.risk_profile.overall_risk_level === "Crisis");
ok("crisis: message has 800 9393", c.crisis_message.includes("800 9393"));
ok("under15 high: crisis flag", runAriaAssessment(scenarios.under15).flags.crisis_flag === true);
ok("numbing flag", runAriaAssessment(scenarios.numbing).flags.emotional_numbing_flag === true);
ok("allMax: poly flag", runAriaAssessment(scenarios.allMax).flags.poly_substance_flag === true);
ok("allMax: geo flag", runAriaAssessment(scenarios.allMax).flags.geographic_risk_flag === true);

// summaries (deterministic + creole)
const eng = await attachSummaries(runAriaAssessment({ metadata:{ language_preference:"english" }}), null);
ok("english plain summary present", eng.plain_language_summary.length > 20);
ok("english creole empty", eng.creole_summary === "");
const cre = await attachSummaries(runAriaAssessment({ metadata:{ language_preference:"creole" }}), null);
ok("creole summary present", cre.creole_summary.length > 20);

// determinism
ok("deterministic", runAriaAssessment(scenarios.allMax).risk_profile.risk_score === runAriaAssessment(scenarios.allMax).risk_profile.risk_score);

console.log(`\nENGINE VERIFY: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

// ===================================================================
// ARIA CONSTANTS - questions now adapted from VALIDATED screening tools:
//   CRAFFT (under-18), DAST-10 and AUDIT-C (18+).
// Items are PARAPHRASED (not copied verbatim) and used for screening only -
// never a diagnosis. `applies` = which age group sees the item; the engine
// normalises each sub-score dynamically from the items that actually apply.
// ===================================================================

export function isYouth(ageGroup) {
  return ageGroup === "under_15" || ageGroup === "15_to_18";
}
export function appliesToAge(q, ageGroup) {
  if (!q.applies || q.applies === "all") return true;
  return q.applies === "youth" ? isYouth(ageGroup) : !isYouth(ageGroup);
}

// score group + age applicability + source instrument (shown in UI).
export const BEHAVIOURAL_QUESTIONS = [
  // --- substance-use behaviour -> behavioural sub-score ---
  { id: "craft_car",     score: "behavioural", applies: "youth", source: "CRAFFT" },
  { id: "craft_alone",   score: "behavioural", applies: "youth", source: "CRAFFT" },
  { id: "craft_trouble", score: "behavioural", applies: "youth", source: "CRAFFT" },
  { id: "dast_cantstop", score: "behavioural", applies: "adult", source: "DAST-10" },
  { id: "dast_neglect",  score: "behavioural", applies: "adult", source: "DAST-10" },

  // --- emotional sub-score ---
  { id: "craft_relax",      score: "emotional", applies: "youth", source: "CRAFFT" },
  { id: "dast_guilt",       score: "emotional", applies: "adult", source: "DAST-10" },
  { id: "mood_volatility",  score: "emotional", applies: "all",   source: "general" },
  { id: "paranoia_anxiety", score: "emotional", applies: "all",   source: "general" },
  { id: "hopelessness",     score: "emotional", applies: "all",   source: "general" },

  // --- physical sub-score ---
  { id: "craft_forget",     score: "physical", applies: "youth", source: "CRAFFT" },
  { id: "dast_withdrawal",  score: "physical", applies: "adult", source: "DAST-10" },
  { id: "audit_alcohol",    score: "physical", applies: "all",   source: "AUDIT-C" },
  { id: "hygiene_decline",  score: "physical", applies: "all",   source: "general" },
  { id: "weight_loss",      score: "physical", applies: "all",   source: "general" },
  { id: "substance_mention",score: "physical", applies: "all",   source: "general" },

  // --- environmental signal (engine also uses metadata) ---
  { id: "family_concern",   score: "environmental", applies: "all", source: "general" },

  // --- safeguarding (NOT scored; a CRISIS trigger) ---
  { id: "self_harm_ideation", score: "crisis", applies: "all", source: "general" },
];

export const PROTECTIVE_QUESTIONS = [
  { id: "family_support",        label: "Strong, open family communication" },
  { id: "education_employment",  label: "Currently in school or employed" },
  { id: "community_involvement", label: "Active in religious or social groups" },
  { id: "motivation_to_change",  label: "Has expressed desire to improve" },
  { id: "prior_recovery",        label: "Has previously sought help or recovered" },
];

// --- Facial emotion weights (emotional sub-score) ---
export const EMOTION_WEIGHTS = { fearful: 6, angry: 5, disgusted: 4, sad: 3, surprised: 2, neutral: 1, happy: 0 };
export const FACIAL_CONTRIBUTION_CAP = 10;

// --- Environmental risk inputs ---
export const HIGH_RISK_ZONES = [
  "roche bois", "cite la cure", "cité la cure", "plaine verte", "mahebourg",
  "bambous", "riviere du rempart", "rivière du rempart", "cite martial", "cité martial",
];
export const AGE_VULNERABILITY = { under_15: 5, "15_to_18": 4, "19_to_25": 3, "26_to_35": 2, "36_plus": 1 };
export const REFERRER_ENV_WEIGHT = { self: 0, family: 1, school: 1, counsellor: 1, ngo: 1, anonymous: 2 };

// --- Substance modifiers ---
export const SUBSTANCE_RULES = [
  { match: ["sousou", "k2", "spice", "synthetic", "synthetic cannabinoid"], label: "synthetic cannabinoids", deltas: { emotional: 15 }, flags: ["psychosis_risk"], pathway: "Priority psychiatric referral" },
  { match: ["heroin", "brown sugar"], label: "opioids", deltas: { physical: 20 }, flags: ["needle_sharing_hiv_hepc_corisk", "withdrawal_danger"], pathway: "Harm-reduction programme referral" },
  { match: ["prescription", "tramadol", "benzodiazepine", "benzodiazepines", "benzo"], label: "prescription/sedatives", deltas: { behavioural: 10 }, flags: ["hidden_misuse_pattern", "check_doctor_shopping"], pathway: "Screen for doctor-shopping signals" },
  { match: ["alcohol"], label: "alcohol", deltas: {}, flags: ["alcohol_often_underreported", "check_morning_use"], pathway: "Weight family concern more heavily" },
];
export const POLY_SUBSTANCE = { threshold: 2, overallDelta: 10, flag: "poly_substance_complex_case" };

export const RISK_BANDS = [
  { max: 39, level: "Low",    action: "Monitor",             urgency: "Routine" },
  { max: 59, level: "Medium", action: "Counsellor Session",  urgency: "Priority" },
  { max: 79, level: "High",   action: "NGO Referral",        urgency: "Priority" },
  { max: 100, level: "Crisis",action: "Crisis Intervention", urgency: "Immediate" },
];
export const READINESS_STAGES = [
  { max: 2, stage: "Pre-contemplation" }, { max: 4, stage: "Contemplation" },
  { max: 6, stage: "Preparation" }, { max: 8, stage: "Action" }, { max: 10, stage: "Maintenance" },
];

// ===================================================================
// ARIA CONSTANTS — single source of truth for every weight & question.
// Nothing in the engine uses a "magic number"; it all lives here so a
// reviewer can audit exactly how a score is built. (Spec Sections 1-3)
// ===================================================================

// --- Behavioural questionnaire signals (each answered 0-3) -----------
// `score` = which sub-score this question feeds. This mapping IS the
// scoring model from Section 3, expressed as data instead of code.
export const BEHAVIOURAL_QUESTIONS = [
  // -> Behavioural sub-score (out of 25)
  { id: "sleep_disruption",      label: "Irregular sleep / staying out very late",         score: "behavioural" },
  { id: "academic_work_decline", label: "Drop in school/work performance or attendance",   score: "behavioural" },
  { id: "social_withdrawal",     label: "Withdrawing from family and friends",             score: "behavioural" },
  { id: "peer_group_change",     label: "New secretive or unknown peer group",            score: "behavioural" },
  { id: "financial_irregularity",label: "Asking for money, unexplained spending, theft",  score: "behavioural" },
  { id: "deceptive_behaviour",   label: "Lying, hiding activities, secrecy",              score: "behavioural" },
  { id: "legal_incidents",       label: "Run-ins with authorities or police",             score: "behavioural" },

  // -> Emotional sub-score (questionnaire portion)
  { id: "mood_volatility",       label: "Sudden anger, aggression or mood swings",        score: "emotional" },
  { id: "paranoia_anxiety",      label: "Expressed fear, paranoia or panic",              score: "emotional" },
  { id: "hopelessness",          label: "Expressed hopelessness or worthlessness",        score: "emotional" },

  // -> Physical sub-score
  { id: "hygiene_decline",       label: "Noticeable drop in self-care",                   score: "physical" },
  { id: "weight_loss",           label: "Unexplained or rapid weight loss reported",      score: "physical" },
  { id: "substance_mention",     label: "Direct/indirect mention of substance use",       score: "physical" },

  // -> Environmental sub-score
  { id: "family_concern",        label: "Family members have expressed worry",            score: "environmental" },

  // -> Safeguarding signal (NOT scored numerically — it is a CRISIS trigger)
  { id: "self_harm_ideation",    label: "Any mention of self-harm or suicide",            score: "crisis" },
];

// --- Protective factors (each answered 0-2) --------------------------
export const PROTECTIVE_QUESTIONS = [
  { id: "family_support",        label: "Strong, open family communication" },
  { id: "education_employment",  label: "Currently in school or employed" },
  { id: "community_involvement", label: "Active in religious or social groups" },
  { id: "motivation_to_change",  label: "Has expressed desire to improve" },
  { id: "prior_recovery",        label: "Has previously sought help or recovered" },
];

// Max raw points possible per sub-score, used to normalise to 0-25.
// (count of questions feeding it x 3, because each is 0-3)
export const RAW_MAX = {
  behavioural: 7 * 3,   // 21
  emotionalQuestionnaire: 3 * 3, // 9  -> normalised to 0-15
  physical: 3 * 3,      // 9
};

// --- Facial emotion weights (Spec Section 3, emotional sub-score) -----
// face-api returns these 7 expression probabilities; we weight the
// DOMINANT one, multiply by detection confidence, and cap at 10.
export const EMOTION_WEIGHTS = {
  fearful: 6,
  angry: 5,
  disgusted: 4,
  sad: 3,
  surprised: 2,
  neutral: 1,
  happy: 0,
};
export const FACIAL_CONTRIBUTION_CAP = 10;

// --- Environmental risk inputs ---------------------------------------
// Known higher-risk zones (Spec Section 2). Compared case-insensitively
// against geographic_zone. ONLY affects environmental score (fairness).
export const HIGH_RISK_ZONES = [
  "roche bois", "cite la cure", "cité la cure", "plaine verte",
  "mahebourg", "bambous", "riviere du rempart", "rivière du rempart",
  "cite martial", "cité martial",
];

// Age-group vulnerability weighting for environmental score.
export const AGE_VULNERABILITY = {
  under_15: 5,
  "15_to_18": 4,
  "19_to_25": 3,
  "26_to_35": 2,
  "36_plus": 1,
};

// Referrer context: self-referral lowers environmental risk slightly
// (engagement), anonymous/third-party raises uncertainty.
export const REFERRER_ENV_WEIGHT = {
  self: 0,
  family: 1,
  school: 1,
  counsellor: 1,
  ngo: 1,
  anonymous: 2,
};

// --- Substance modifiers (Spec Section 2) ----------------------------
// Each entry returns deltas applied to the relevant sub-scores plus the
// flags/pathways a reviewer must see. Matching is keyword-based so
// "brown sugar" and "heroin" both hit the opioid rule.
export const SUBSTANCE_RULES = [
  {
    match: ["sousou", "k2", "spice", "synthetic", "synthetic cannabinoid"],
    label: "synthetic cannabinoids",
    deltas: { emotional: 15 },
    flags: ["psychosis_risk"],
    pathway: "Priority psychiatric referral",
  },
  {
    match: ["heroin", "brown sugar"],
    label: "opioids",
    deltas: { physical: 20 },
    flags: ["needle_sharing_hiv_hepc_corisk", "withdrawal_danger"],
    pathway: "Harm-reduction programme referral",
  },
  {
    match: ["prescription", "tramadol", "benzodiazepine", "benzodiazepines", "benzo"],
    label: "prescription/sedatives",
    deltas: { behavioural: 10 },
    flags: ["hidden_misuse_pattern", "check_doctor_shopping"],
    pathway: "Screen for doctor-shopping signals",
  },
  {
    match: ["alcohol"],
    label: "alcohol",
    deltas: {}, // culturally normalised; handled via family_concern weighting
    flags: ["alcohol_often_underreported", "check_morning_use"],
    pathway: "Weight family concern more heavily",
  },
];

// Applied when 2+ distinct substances are named.
export const POLY_SUBSTANCE = {
  threshold: 2,
  overallDelta: 10,
  flag: "poly_substance_complex_case",
};

// --- Risk level bands (Spec Section 3) -------------------------------
export const RISK_BANDS = [
  { max: 39, level: "Low",    action: "Monitor",             urgency: "Routine" },
  { max: 59, level: "Medium", action: "Counsellor Session",  urgency: "Priority" },
  { max: 79, level: "High",   action: "NGO Referral",        urgency: "Priority" },
  { max: 100, level: "Crisis",action: "Crisis Intervention", urgency: "Immediate" },
];

// --- Recovery readiness (Spec Section 5) -----------------------------
export const READINESS_STAGES = [
  { max: 2,  stage: "Pre-contemplation" },
  { max: 4,  stage: "Contemplation" },
  { max: 6,  stage: "Preparation" },
  { max: 8,  stage: "Action" },
  { max: 10, stage: "Maintenance" },
];

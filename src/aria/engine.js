// ===================================================================
// ARIA DETERMINISTIC ENGINE  (Spec Sections 3, 4, 5, 7, 9)
//
// 100% pure functions: same input -> same output, every time. No AI,
// no randomness except the cosmetic assessment_id. This is the part you
// can fully trust and audit; the LLM only ever touches the wording of
// the human-readable summaries (see summaries.js), never the numbers.
//
// SCORING-MODEL DECISION (documented so it is not a hidden assumption):
//   The four sub-scores are each computed from observed signals and
//   capped at 0-25. Substance-specific weight is tracked SEPARATELY as
//   `substance_modifier`, not folded into the capped sub-scores. This
//   keeps the breakdown transparent and makes the fairness audit easy:
//   you can see exactly how much risk came from named substances.
//   FINAL = (sum of sub-scores) - protective_deduction + substance_modifier
// ===================================================================

import {
  BEHAVIOURAL_QUESTIONS, PROTECTIVE_QUESTIONS, RAW_MAX,
  EMOTION_WEIGHTS, FACIAL_CONTRIBUTION_CAP, HIGH_RISK_ZONES,
  AGE_VULNERABILITY, REFERRER_ENV_WEIGHT, SUBSTANCE_RULES,
  POLY_SUBSTANCE, RISK_BANDS, READINESS_STAGES,
} from "./constants.js";
import { REFERRALS, CRISIS_LINES } from "./referrals.js";

// ---- small helpers --------------------------------------------------
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n);
const ans = (answers, id) => Number(answers?.[id] ?? 0); // safe 0-default

// Normalise a raw point total onto a target scale (e.g. 21 raw -> 0-25).
const normalise = (raw, rawMax, target) => (rawMax === 0 ? 0 : (raw / rawMax) * target);

// ---- 1. BEHAVIOURAL sub-score (0-25) --------------------------------
function behaviouralScore(answers) {
  const ids = BEHAVIOURAL_QUESTIONS.filter((q) => q.score === "behavioural").map((q) => q.id);
  const raw = ids.reduce((s, id) => s + ans(answers, id), 0);
  return clamp(normalise(raw, RAW_MAX.behavioural, 25), 0, 25);
}

// ---- 2. EMOTIONAL sub-score (0-25) = questionnaire (0-15) + face (0-10)
function facialContribution(facial) {
  if (!facial || !facial.face_detected) return 0;
  const weight = EMOTION_WEIGHTS[facial.dominant_emotion] ?? 0;
  const confidence = clamp(Number(facial.confidence ?? 0), 0, 1);
  // weight is 0-6; scale to the 0-10 facial budget, apply confidence, cap.
  const scaled = (weight / 6) * FACIAL_CONTRIBUTION_CAP * confidence;
  return clamp(scaled, 0, FACIAL_CONTRIBUTION_CAP);
}

function emotionalScore(answers, facial) {
  const ids = BEHAVIOURAL_QUESTIONS.filter((q) => q.score === "emotional").map((q) => q.id);
  const raw = ids.reduce((s, id) => s + ans(answers, id), 0);
  const face = facialContribution(facial); // 0-10
  const hasFace = !!(facial && facial.face_detected);
  // Without facial data the questionnaire alone can reach the full 25, so
  // skipping the camera never lowers the emotional ceiling.
  const questionnaire = normalise(raw, RAW_MAX.emotionalQuestionnaire, hasFace ? 15 : 25);
  return { total: clamp(questionnaire + face, 0, 25), face };
}

// ---- 3. PHYSICAL sub-score (0-25) -----------------------------------
function physicalScore(answers) {
  const ids = BEHAVIOURAL_QUESTIONS.filter((q) => q.score === "physical").map((q) => q.id);
  const raw = ids.reduce((s, id) => s + ans(answers, id), 0);
  return clamp(normalise(raw, RAW_MAX.physical, 25), 0, 25);
}

// ---- 4. ENVIRONMENTAL sub-score (0-25) ------------------------------
// Builds from zone risk + age vulnerability + referrer context +
// family concern + children in household. Each capped so no single
// factor dominates; total capped at 25.
function environmentalScore(input) {
  const { metadata = {}, answers = {} } = input;
  let pts = 0;
  const zone = (metadata.geographic_zone ?? "").toLowerCase();
  const geographic_risk = HIGH_RISK_ZONES.some((z) => zone.includes(z));
  if (geographic_risk) pts += 8;
  pts += AGE_VULNERABILITY[metadata.subject_age_group] ?? 0;          // 1-5
  pts += REFERRER_ENV_WEIGHT[metadata.referrer_type] ?? 1;           // 0-2
  pts += ans(answers, "family_concern") * 2;                          // 0-6
  if (metadata.children_in_household) pts += 4;
  return { score: clamp(pts, 0, 25), geographic_risk };
}

// ---- 5. PROTECTIVE deduction (max 15) -------------------------------
function protectiveDeduction(protective) {
  const raw = PROTECTIVE_QUESTIONS.reduce((s, q) => s + clamp(ans(protective, q.id), 0, 2), 0); // 0-10
  return { deduction: (raw / 10) * 15, raw };
}

// ---- 6. SUBSTANCE modifiers (Spec Section 2) ------------------------
function substanceModifiers(substances = []) {
  const lower = substances.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
  const deltas = { behavioural: 0, emotional: 0, physical: 0 };
  const flags = [];
  const pathways = [];
  const matchedLabels = new Set();

  for (const rule of SUBSTANCE_RULES) {
    const hit = lower.some((sub) => rule.match.some((kw) => sub.includes(kw)));
    if (hit) {
      for (const [k, v] of Object.entries(rule.deltas)) deltas[k] += v;
      flags.push(...rule.flags);
      pathways.push(rule.pathway);
      matchedLabels.add(rule.label);
    }
  }

  let overall = 0;
  const poly = lower.length >= POLY_SUBSTANCE.threshold;
  if (poly) { overall += POLY_SUBSTANCE.overallDelta; flags.push(POLY_SUBSTANCE.flag); }

  const total = clamp(deltas.behavioural + deltas.emotional + deltas.physical + overall, 0, 45);
  return { total, deltas, overall, flags, pathways, poly, labels: [...matchedLabels] };
}

// ---- 7. CRISIS & SAFEGUARDING triggers (Spec Section 4) -------------
const SELF_HARM_WORDS = ["suicide", "suicidal", "kill myself", "end my life",
  "self-harm", "self harm", "harm myself", "want to die", "no reason to live"];

function emotionalNumbing(timeline = []) {
  // sustained fearful/angry that suddenly flips to neutral = numbing flag.
  if (timeline.length < 3) return false;
  const intense = (e) => e === "fearful" || e === "angry";
  const last = timeline[timeline.length - 1];
  const prev = timeline[timeline.length - 2];
  const hadSustained = timeline.slice(0, -1).filter(intense).length >= 2;
  return hadSustained && intense(prev) && last === "neutral";
}

function detectCrisis(input, baseScore, facial) {
  const notes = (input.metadata?.observer_notes ?? "").toLowerCase();
  const selfHarm = ans(input.answers, "self_harm_ideation") > 0;
  const notesSelfHarm = SELF_HARM_WORDS.some((w) => notes.includes(w));
  const numbing = emotionalNumbing(facial?.emotion_timeline);
  const under15Elevated =
    input.metadata?.subject_age_group === "under_15" && baseScore > 40;
  const triggered = selfHarm || notesSelfHarm || numbing || under15Elevated;
  return {
    crisis_flag: triggered,
    self_harm_flag: selfHarm || notesSelfHarm,
    emotional_numbing_flag: numbing,
    reasons: [
      selfHarm && "self-harm ideation reported in questionnaire",
      notesSelfHarm && "self-harm language in observer notes",
      numbing && "emotional-numbing pattern in facial timeline",
      under15Elevated && "under-15 subject with elevated score",
    ].filter(Boolean),
  };
}

// ---- 8. RECOVERY READINESS (Spec Section 5) -------------------------
function recoveryReadiness(input) {
  const p = input.protective ?? {};
  const a = input.answers ?? {};
  let score = 0;
  score += ans(p, "motivation_to_change");
  score += ans(p, "prior_recovery");
  score += ans(p, "family_support");
  score += ans(p, "education_employment");
  if (input.metadata?.referrer_type === "self") score += 2; // self-referred = readier
  if (ans(a, "self_harm_ideation") > 0) score -= 2;
  if (ans(a, "legal_incidents") > 1) score -= 1;
  if (ans(a, "social_withdrawal") === 3) score -= 1;
  const anyProtective = PROTECTIVE_QUESTIONS.some((q) => ans(p, q.id) > 0);
  if (!anyProtective) score -= 1;
  score = clamp(score, 0, 10);
  const stage = READINESS_STAGES.find((s) => score <= s.max).stage;
  return { score, stage };
}

const OPENING_LINES = {
  "Pre-contemplation": "I'm not here to judge — I'd just like to understand how things have been for you lately.",
  "Contemplation": "It sounds like part of you has been wondering whether something needs to change. Can we talk about that?",
  "Preparation": "You've been thinking about making a change — what would a small first step look like for you?",
  "Action": "You're already taking steps, and that takes courage. How can we support what you've started?",
  "Maintenance": "You've come a long way. Let's talk about what's been helping you stay on track.",
};

function primaryBarrier(input, readiness) {
  if (ans(input.answers, "self_harm_ideation") > 0) return "Immediate safety concern overrides engagement";
  if (readiness.score <= 2) return "Low awareness or denial of the problem";
  if (ans(input.protective, "family_support") === 0) return "Lack of family support at home";
  if (ans(input.answers, "social_withdrawal") === 3) return "Deep social withdrawal / isolation";
  return "Ambivalence about seeking help, often worsened by community stigma";
}

// ---- 9. REFERRAL selection (Spec Section 6) -------------------------
function selectReferral(level, metadata, substanceInfo) {
  const age = metadata?.subject_age_group;
  const minor = age === "under_15" || age === "15_to_18";

  if (level === "Crisis") return REFERRALS.befrienders;
  if (minor && metadata?.referrer_type === "school") return REFERRALS.school;
  if (minor) return REFERRALS.cdu;
  if (level === "High") return REFERRALS.nadc;
  if (level === "Medium") return REFERRALS.msasa;
  if (substanceInfo.labels.includes("opioids")) return REFERRALS.nadc;
  return REFERRALS.helpline_mauritius;
}

// ---- 10. CONFIDENCE & uncertainty ----------------------------------
function assessConfidence(input, facial) {
  const gaps = [];
  if (!facial || !facial.face_detected) gaps.push("no facial data (camera off or no face detected)");
  if (!input.metadata?.geographic_zone) gaps.push("geographic zone not provided");
  if (!input.metadata?.subject_age_group) gaps.push("age group not provided");
  const answered = BEHAVIOURAL_QUESTIONS.filter((q) => input.answers?.[q.id] != null).length;
  if (answered < BEHAVIOURAL_QUESTIONS.length) gaps.push("some questionnaire items left blank");
  const level = gaps.length === 0 ? "High" : gaps.length <= 2 ? "Medium" : "Low";
  return { level, note: gaps.length ? gaps.join("; ") : "All key inputs present." };
}

// ---- utility: id + timestamp ---------------------------------------
function assessmentId() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return `VELA-${s}`;
}

// ===================================================================
// MAIN ENTRY POINT
// ===================================================================
export function runAriaAssessment(input = {}) {
  const answers = input.answers ?? {};
  const protective = input.protective ?? {};
  const metadata = input.metadata ?? {};
  const facial = input.facial ?? null;
  const substances = metadata.substances_mentioned ?? [];

  // --- sub-scores ---
  const behavioural = behaviouralScore(answers);
  const emo = emotionalScore(answers, facial);
  const physical = physicalScore(answers);
  const env = environmentalScore(input);
  const prot = protectiveDeduction(protective);
  const sub = substanceModifiers(substances);

  const subScoreSum = behavioural + emo.total + physical + env.score;
  let finalScore = subScoreSum - prot.deduction + sub.total;
  finalScore = round(clamp(finalScore, 0, 100));

  // --- band lookup ---
  let band = RISK_BANDS.find((b) => finalScore <= b.max);

  // --- crisis override (Spec Section 4) ---
  const crisis = detectCrisis(input, finalScore, facial);
  if (crisis.crisis_flag) {
    band = RISK_BANDS.find((b) => b.level === "Crisis");
    finalScore = Math.max(finalScore, 80); // score must reflect a crisis, not read like a High
  }

  // --- safeguarding (children + High/Crisis) ---
  const safeguarding_flag =
    Boolean(metadata.children_in_household) &&
    (band.level === "High" || band.level === "Crisis");

  // --- readiness & referral ---
  const readiness = recoveryReadiness(input);
  const referral = selectReferral(band.level, metadata, sub);
  const confidence = assessConfidence(input, facial);

  // --- explainability: find the largest single contributor ---
  const contributors = {
    "behavioural signals": behavioural,
    "emotional indicators": emo.total,
    "physical indicators": physical,
    "environmental risk": env.score,
    "named substances": sub.total,
  };
  const topFactor = Object.entries(contributors).sort((a, b) => b[1] - a[1])[0][0];

  const protectiveNoted = PROTECTIVE_QUESTIONS
    .filter((q) => ans(protective, q.id) > 0)
    .map((q) => q.label);

  // --- facial summary ---
  const timeline = facial?.emotion_timeline ?? [];
  const distinctEmotions = new Set(timeline).size;
  const volatility = !timeline.length ? "Stable"
    : distinctEmotions >= 4 ? "Volatile"
    : distinctEmotions >= 2 ? "Mild" : "Stable";

  return {
    aria_version: "1.0",
    assessment_id: assessmentId(),
    timestamp: new Date().toISOString(),
    language_used: metadata.language_preference ?? "english",

    risk_profile: {
      overall_risk_level: band.level,
      risk_score: finalScore,
      confidence: confidence.level,
      score_breakdown: {
        behavioural: round(behavioural),
        emotional: round(emo.total),
        physical: round(physical),
        environmental: round(env.score),
        protective_deduction: round(prot.deduction),
        substance_modifier: round(sub.total),
      },
    },

    flags: {
      crisis_flag: crisis.crisis_flag,
      self_harm_flag: crisis.self_harm_flag,
      safeguarding_flag,
      poly_substance_flag: sub.poly,
      geographic_risk_flag: env.geographic_risk,
      emotional_numbing_flag: crisis.emotional_numbing_flag,
    },

    facial_analysis_summary: {
      dominant_emotion_detected: facial?.dominant_emotion ?? "n/a",
      emotional_volatility: volatility,
      face_detected: Boolean(facial?.face_detected),
      facial_contribution_to_score: round(emo.face),
      timeline_pattern: timeline.length ? timeline.join(" → ") : "no facial timeline captured",
    },

    explainability: {
      reasoning_summary:
        `This case scored ${finalScore}/100 (${band.level}). The largest driver was ${topFactor}. ` +
        `Protective factors reduced the score by ${round(prot.deduction)} points. ` +
        (sub.total ? `Named substances added ${sub.total} points (${sub.labels.join(", ")}). ` : "") +
        `This is a support flag, not a diagnosis — a human must review it.`,
      top_contributing_factor: topFactor,
      protective_factors_noted: protectiveNoted.length ? protectiveNoted : ["none reported"],
      uncertainty_note: confidence.note,
    },

    recovery_readiness: {
      score: readiness.score,
      stage: readiness.stage,
      opening_line_for_counsellor: OPENING_LINES[readiness.stage],
      primary_barrier: primaryBarrier(input, readiness),
    },

    intervention: {
      recommended_action: band.action,
      urgency: crisis.crisis_flag ? "Immediate" : band.urgency,
      primary_referral: {
        organisation: referral.organisation,
        contact: referral.contact,
        reason: referral.use + (referral.verified ? "" : " (NOTE: contact not yet verified — confirm before use)"),
      },
      supplementary_support: sub.pathways.length ? sub.pathways.join("; ") : "Community / faith support where a strong protective factor exists",
      stigma_sensitive_note:
        "Use non-judgemental, non-labelling language with the family. Avoid the word 'addict'. " +
        "Acknowledge that seeking help is a sign of strength, and reassure them about confidentiality given community stigma (\"ki dimoun pou dire\").",
      human_review_required: true,
    },

    follow_up: {
      reassessment_recommended_days:
        band.level === "Crisis" ? 7 : band.level === "High" ? 14 : band.level === "Medium" ? 30 : 90,
      monitoring_checkpoints: [
        "Confirm the person is safe and not alone (if crisis).",
        "Check whether the recommended referral was contacted.",
        "Reassess mood, sleep and engagement at the next session.",
      ],
    },

    fairness_audit: {
      bias_risk: env.geographic_risk ? "Medium" : "Low",
      bias_note:
        "Score derived only from behavioural, emotional, physical and environmental indicators plus named substances. " +
        "Gender, ethnicity and religion were NOT used. Geographic zone affected ONLY the environmental sub-score" +
        (env.geographic_risk ? ", which is why bias_risk is flagged Medium for review." : "."),
    },

    plain_language_summary: "", // filled by summaries.js (deterministic fallback or LLM)
    creole_summary: "",         // filled by summaries.js when language is creole
    crisis_message: crisis.crisis_flag
      ? buildCrisisMessage()
      : "",

    system_footer:
      "VELA Assessment powered by ARIA v1.0. This is an AI-assisted risk flag, not a clinical diagnosis. " +
      "All decisions must be reviewed and actioned by a qualified human professional. Data is session-only and not retained. " +
      "Developed for Game of Code 2026 — Towards Recovery, Curtin Mauritius.",

    // internal block (not part of the spec output) for the UI / tests.
    _debug: { subScoreSum, finalScore, crisisReasons: crisis.reasons, substanceFlags: sub.flags },
  };
}

function buildCrisisMessage() {
  const lines = CRISIS_LINES.map((l) => `${l.organisation}: ${l.contact}`).join("  |  ");
  return (
    "CRISIS FLAG ACTIVE. Stay calm and stay with this person — do NOT leave them alone. " +
    `Contact a crisis line now: ${lines}. If there is immediate medical danger, call SAMU 114. ` +
    "Remove access to means of harm where safe to do so, and hand over to a qualified professional as soon as possible."
  );
}

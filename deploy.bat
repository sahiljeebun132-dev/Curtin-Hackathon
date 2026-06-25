// Sample adult case (validated-instrument ids). Mid/high risk, no crisis.
export const SAMPLE_INPUT = {
  answers: {
    dast_cantstop: 2, dast_neglect: 3, dast_guilt: 2, dast_withdrawal: 2, audit_alcohol: 2,
    mood_volatility: 2, paranoia_anxiety: 1, hopelessness: 1,
    hygiene_decline: 1, weight_loss: 2, substance_mention: 2,
    family_concern: 3, self_harm_ideation: 0,
  },
  protective: { family_support: 1, education_employment: 2, community_involvement: 1, motivation_to_change: 1, prior_recovery: 0 },
  metadata: {
    subject_age_group: "19_to_25", subject_gender: "male", geographic_zone: "Roche Bois",
    language_preference: "english", referrer_type: "family",
    substances_mentioned: ["alcohol", "sousou"], children_in_household: false,
    observer_notes: "Li rant tar, li pe rod kas. Family say li change.",
  },
  facial: { dominant_emotion: "sad", face_detected: true, confidence: 0.82, session_duration_seconds: 90, emotion_timeline: ["neutral", "sad", "fearful", "sad", "neutral"] },
};

// ===================================================================
// MAURITIUS REFERRAL NETWORK — corrected & source-tagged.
//
// IMPORTANT: the original VELA spec listed "Line Lavi (139)" and
// "NATReSA (+230 208 8624)". Web verification (June 2026) found:
//   - No confirmable "Line Lavi / 139" crisis line. Replaced with the
//     verified Befrienders Mauritius and Helpline Mauritius numbers.
//   - NATReSA is DEFUNCT — replaced by the National Agency for Drug
//     Control (NADC), Act 8 of 2025 (in force 15 May 2025).
//
// Every entry carries `verified` + `source` so a human reviewer can see
// exactly what was confirmed and what still needs a primary-source check
// before it is shown to a person in crisis. (Spec Sections 4 & 6)
// ===================================================================

export const REFERRALS = {
  befrienders: {
    organisation: "Befrienders Mauritius",
    contact: "800 9393 (SMS +230 5483 7233)",
    use: "Suicide prevention, emotional crisis, any age",
    hours: "Daily, free & confidential",
    verified: true,
    source: "findahelpline.com/countries/mu (Apr 2026)",
  },
  helpline_mauritius: {
    organisation: "Helpline Mauritius",
    contact: "214 2451",
    use: "Free listening & counselling, Mauritius & Rodrigues",
    verified: true,
    source: "findahelpline.com/countries/mu (verified Jun 2, 2026)",
  },
  nadc: {
    organisation: "National Agency for Drug Control (NADC)",
    contact: "Confirm current number on consultations.nadc.mu",
    use: "Treatment & rehabilitation referral — replaces the former NATReSA",
    verified: false, // org confirmed; phone number NOT yet verified
    source: "National Agency for Drug Control Act 8 of 2025",
  },
  pils: {
    organisation: "PILS (Prévention Information Lutte contre le SIDA)",
    contact: "8999",
    use: "HIV/AIDS support — relevant for injecting-drug harm reduction",
    verified: true,
    source: "findahelpline.com/countries/mu (verified Apr 12, 2026)",
  },
  samu: {
    organisation: "SAMU (emergency medical service)",
    contact: "114",
    use: "Immediate medical danger, overdose",
    verified: false, // widely cited but NOT independently confirmed this session
    source: "Spec-provided; needs primary-source confirmation",
  },
  cdu: {
    organisation: "Child Development Unit (CDU), Ministry of Social Integration",
    contact: "Confirm current number before use",
    use: "Under-18 safeguarding referral",
    verified: false,
    source: "Spec-provided; needs primary-source confirmation",
  },
  msasa: {
    organisation: "MSASA (community substance-abuse support)",
    contact: "Confirm current number before use",
    use: "Medium-risk, community-based support",
    verified: false,
    source: "Spec-provided; needs primary-source confirmation",
  },
  idrice_goomany: {
    organisation: "Idrice Goomany Centre",
    contact: "Confirm current number before use",
    use: "Residential rehabilitation, severe cases",
    verified: false,
    source: "Spec-provided; needs primary-source confirmation",
  },
  school: {
    organisation: "School Counsellor / Dean",
    contact: "Via the subject's institution",
    use: "School-referred minors (under_15 / 15_to_18)",
    verified: true,
    source: "Internal pathway",
  },
  faith: {
    organisation: "Faith / Community Leader",
    contact: "Local community",
    use: "Supplementary support when community involvement is a strong protective factor",
    verified: true,
    source: "Internal pathway",
  },
};

// Always-show crisis lines (used in the crisis_message). These are the
// VERIFIED ones, so the most dangerous output path uses only confirmed data.
export const CRISIS_LINES = [REFERRALS.befrienders, REFERRALS.helpline_mauritius];

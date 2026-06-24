// Clinician-facing symptom map. NON-DIAGNOSTIC. Observable signs are
// grouped by the substance CATEGORY they are commonly associated with,
// so a qualified professional can consider and VERIFY - never an output
// that says "this person uses X".
export const SYMPTOM_CATEGORIES = [
  {
    id: "stimulant", label: "Stimulant-type (e.g. cocaine, amphetamine)",
    signs: ["Restlessness or agitation", "Reduced sleep / staying up late", "Rapid speech or racing thoughts", "Reduced appetite / weight loss", "Dilated pupils"],
  },
  {
    id: "opioid", label: "Opioid-type (e.g. heroin, some painkillers)",
    signs: ["Drowsiness / nodding off", "Very small (pinpoint) pupils", "Slowed breathing", "Withdrawal: sweating, cramps, runny nose", "Marks on arms"],
  },
  {
    id: "cannabinoid", label: "Cannabis / synthetic cannabinoids (e.g. sousou)",
    signs: ["Red eyes", "Disorientation or paranoia", "Sudden anxiety or panic", "Unusual aggression (synthetics)", "Memory or concentration lapses"],
  },
  {
    id: "sedative", label: "Sedatives (e.g. benzodiazepines, some prescriptions)",
    signs: ["Slurred speech", "Poor coordination / unsteady", "Excessive drowsiness", "Memory gaps", "Doctor-shopping signals"],
  },
  {
    id: "alcohol", label: "Alcohol",
    signs: ["Smell of alcohol", "Unsteady gait", "Morning drinking", "Mood swings", "Concealing bottles"],
  },
];

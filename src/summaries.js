// ===================================================================
// Localised summaries (EN / FR / Kreol), addressed to "you" when the
// person takes their own check-in. The summary follows the app's current
// language so read-aloud speaks the translated words, not an accent.
// ===================================================================
const BASE = {
  english: {
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
    tail_self: (r) => ` A kind next step is to reach out to ${r}. This is not a diagnosis - just a gentle reminder that support is there for you.`,
    tail_other: (r) => ` A good next step is to connect with ${r}. This is not a diagnosis - it is a flag for a trained person to check in.`,
  },
  french: {
    self: {
      Crisis: "D'apres ce que vous avez partage aujourd'hui, vous traversez peut-etre une grande detresse en ce moment, et vous meritez du soutien immediatement.",
      High: "D'apres ce que vous avez partage aujourd'hui, vous semblez traverser une periode difficile et parler a quelqu'un pourrait vraiment vous aider.",
      Medium: "D'apres ce que vous avez partage aujourd'hui, vous avez peut-etre quelques difficultes - en parler a un conseiller pourrait aider.",
      Low: "D'apres ce que vous avez partage aujourd'hui, tout semble globalement aller, avec quelques signes a surveiller doucement.",
    },
    other: {
      Crisis: "D'apres ce qui a ete partage aujourd'hui, cette personne est peut-etre en grande detresse et a besoin que quelqu'un reste avec elle maintenant.",
      High: "D'apres ce qui a ete partage aujourd'hui, cette personne traverse une periode serieusement difficile et beneficierait d'un soutien prioritaire.",
      Medium: "D'apres ce qui a ete partage aujourd'hui, cette personne a peut-etre des difficultes et gagnerait a parler bientot a un conseiller.",
      Low: "D'apres ce qui a ete partage aujourd'hui, il y a quelques signes a surveiller, mais rien d'urgent pour l'instant.",
    },
    tail_self: (r) => ` Une bonne premiere etape est de contacter ${r}. Ce n'est pas un diagnostic - juste un rappel bienveillant que du soutien existe pour vous.`,
    tail_other: (r) => ` Une bonne etape suivante est de contacter ${r}. Ce n'est pas un diagnostic - c'est un signal pour qu'une personne formee prenne des nouvelles.`,
  },
  creole: {
    self: {
      Crisis: "Dapre seki to finn partaze zordi, to kapav pe travers enn gran detres aster, ek to meriter sipor deswit.",
      High: "Dapre seki to finn partaze zordi, to paret pe travers enn moman difisil ek koz ar enn dimoun kapav vremem ed twa.",
      Medium: "Dapre seki to finn partaze zordi, to kapav pe lite enn tigit - koz ar enn konseye kapav ede.",
      Low: "Dapre seki to finn partaze zordi, globalman tou paret korek, ar de-trwa siyn pou veye dousman.",
    },
    other: {
      Crisis: "Dapre seki finn partaze zordi, sa dimoun la kapav pe travers enn gran detres ek bizin enn dimoun res ar li aster.",
      High: "Dapre seki finn partaze zordi, sa dimoun la pe travers enn moman bien difisil ek bizin sipor priorite.",
      Medium: "Dapre seki finn partaze zordi, sa dimoun la kapav pe lite ek li bon li koz ar enn konseye biento.",
      Low: "Dapre seki finn partaze zordi, ena de-trwa siyn pou veye, me pa ena irzans pou lemoman.",
    },
    tail_self: (r) => ` Enn bon premie pa: kontakte ${r}. Sa pa enn diagnostik - zis enn rapel ki ena sipor pou twa.`,
    tail_other: (r) => ` Enn bon prosin pa: kontakte ${r}. Sa pa enn diagnostik - se enn siyn pou enn dimoun forme al get li.`,
  },
};

export function localisedSummary(result, lang, self) {
  const L = BASE[lang] || BASE.english;
  const level = result.risk_profile.overall_risk_level;
  const ref = result.intervention.primary_referral.organisation;
  const base = (self ? L.self : L.other)[level] || L.other.Low;
  return base + (self ? L.tail_self(ref) : L.tail_other(ref));
}

export async function attachSummaries(result, llmFn = null, opts = {}) {
  const self = !!opts.self;
  const lang = opts.lang || result.language_used || "english";
  const summary = localisedSummary(result, lang, self);
  const out = { ...result, language_used: lang, plain_language_summary: summary, creole_summary: "" };
  if (typeof llmFn !== "function") return out;
  try {
    const guard = "Reword this approved safeguarding summary in the SAME language. Do NOT change facts, scores, names or numbers. Warm, Grade-8, non-stigmatising. Return ONLY the reworded text.";
    const reworded = await llmFn(`${guard}\n\n${summary}`);
    return { ...out, plain_language_summary: (reworded || summary).trim() };
  } catch { return out; }
}

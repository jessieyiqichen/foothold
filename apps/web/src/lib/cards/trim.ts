// What a card shows before "More": the company in one sentence and a handful of shared skills. The card ran to 2.3
// screens and the user asked for it shorter (2026-11-17); the full text stays one tap away.

/** The longest lead a card shows, in characters; a longer first sentence is cut at a word. */
export const LEAD_MAX = 180;
/** How many shared skills a card shows before "+N". */
export const SKILLS_SHOWN = 5;

/** Words whose dot does not end a sentence ("Acme Inc. Builds"). */
const ABBREVIATIONS = /(?:\b(?:Inc|Co|Corp|Ltd|Mr|Ms|Dr|St|vs|U\.S)|\b[A-Z])$/;
/** A sentence end: . ! or ? followed by space and a capital letter or digit. */
const SENTENCE_END = /[.!?](?=\s+[A-Z0-9])/g;

function firstSentence(text: string): string {
  for (const match of text.matchAll(SENTENCE_END)) {
    const before = text.slice(0, match.index);
    if (!ABBREVIATIONS.test(before)) return text.slice(0, match.index + 1);
  }
  return text;
}

/** The first sentence of a company's description, cut at a word past LEAD_MAX, and whether anything was left out. */
export function leadSentence(text: string): { lead: string; more: boolean } {
  const whole = text.trim();
  const first = firstSentence(whole);
  if (first.length <= LEAD_MAX) return { lead: first, more: first.length < whole.length };
  const cut = first.slice(0, LEAD_MAX);
  const atWord = cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).replace(/[\s,;:]+$/, "");
  return { lead: `${atWord}…`, more: true };
}

/** The first SKILLS_SHOWN shared skills, in the order they came, and how many more there are. */
export function someSkills(skills: readonly string[]): { shown: string[]; more: number } {
  return { shown: skills.slice(0, SKILLS_SHOWN), more: Math.max(skills.length - SKILLS_SHOWN, 0) };
}

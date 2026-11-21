// The tells of AI writing, checked in code on every draft (user, 2026-11-21: "humanize, it reads too AI"). Taken
// from the humanizer guide, which follows Wikipedia's "Signs of AI writing", and kept to what shows up in a short
// email. A draft with any of them goes back to the model with the reasons, as a wrong quote does (verify.ts).

/** Words and phrases models use far more than people do, matched as whole words, case aside. */
export const AI_WORDS = [
  "additionally", "furthermore", "moreover", "align with", "aligns with", "crucial", "delve", "delving", "enhance",
  "enhancing", "foster", "fostering", "garner", "intricate", "landscape", "pivotal", "showcase", "showcasing",
  "tapestry", "testament", "underscore", "underscores", "vibrant", "invaluable", "seamless", "seamlessly",
  "cutting edge", "innovative", "dynamic", "synergy", "leverage", "leveraging", "spearheaded", "meticulous",
  "realm", "navigate the", "game changer", "a deep dive", "eager to", "keen interest", "resonates",
] as const;

/** Phrases a chatbot says to the person it is talking to, which do not belong in their email. */
const CHATBOT = ["certainly!", "of course!", "i hope this helps", "let me know if", "feel free to"] as const;

/** ", highlighting ...": a sentence that trails off into a present participle to sound deeper than it is. */
const ING_TAIL = /,\s+(highlighting|underscoring|emphasizing|showcasing|reflecting|ensuring|demonstrating|fostering|contributing to|solidifying|cementing)\b/i;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordPattern = (w: string) => new RegExp(`(?<![a-z])${escape(w).replace(/ /g, "[\\s-]+")}(?![a-z])`, "i");
const AI_PATTERNS = AI_WORDS.map((w) => [w, wordPattern(w)] as const);

/** Curly quotes and apostrophes made straight: models write them, people typing an email mostly do not. */
export const straightQuotes = (s: string): string => s.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'");

/** Every AI tell in a draft's body, in a fixed order; empty when it reads like a person wrote it. A word that is part
 *  of a name in `allow` (the role's title, the company's name) is the name, not a tell (review, 2026-11-21: a "Dynamic
 *  Pricing Analyst" could never be named). */
export function humanProblems(body: string, allow: readonly string[] = []): string[] {
  const problems: string[] = [];
  for (const [word, pattern] of AI_PATTERNS) {
    if (pattern.test(body) && !allow.some((name) => pattern.test(name))) problems.push(`the body uses the AI-sounding word "${word}"`);
  }
  if (/\s[—–]\s|[a-z][—][a-z]/i.test(body)) problems.push("the body uses a dash as punctuation; use a comma or a full stop");
  if (/\bnot only\b[^.!?]*\bbut\b/i.test(body)) problems.push('the body uses "not only... but"; say the one thing plainly');
  if (/\bnot just\b[^.!?]*\bit'?s\b/i.test(straightQuotes(body))) problems.push('the body uses "not just... it\'s"; say the one thing plainly');
  const tail = ING_TAIL.exec(body);
  if (tail) problems.push(`the body ends a sentence on ", ${tail[1].toLowerCase()}"; cut it or make it its own sentence`);
  const lower = body.toLowerCase();
  for (const phrase of CHATBOT) if (lower.includes(phrase)) problems.push(`the body uses the chatbot phrase "${phrase}"`);
  return problems;
}

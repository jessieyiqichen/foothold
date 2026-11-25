// "What they ask for" on a role page (user, 2026-11-23): up to three one-line asks, read by rules from the posting's
// requirements section. No model call. Pure.

/** Asks shown. */
export const MAX_ASKS = 3;
/** A line longer than this is a paragraph, not a bullet (Figma's bullets run ~220 characters, 2026-11-23). */
export const ASK_MAX_LINE = 400;
/** Each ask is cut to about this many characters, at a word. */
export const ASK_MAX_CHARS = 70;

const APOSTROPHE = "['’]?";
/** Words a requirements heading uses (2026-11-23: matching only whole short headings found 47% of a 2,000-posting
 *  sample; these words, on a heading-shaped line, find about 80%; the fit, background and Spanish ones lift it again). */
const ASK_WORDS = new RegExp(
  [
    "requirement", "qualification", "you have", `you${APOSTROPHE}ll (?:bring|need|have)`, "you bring", "looking for", "about you",
    "who you are", "ideal candidate", "you might be", "must[- ]haves?", "what you need", "you should have",
    "skills (?:and|&) experience", "experience (?:and|&) education", "experience you", `we${APOSTROPHE}d love to hear from you`,
    "(?:good|great|strong|right|a) fit\\b", "thrives? (?:in this role |here )?if", "to thrive", "help you thrive", "match if", "right (?:person|candidate)", "expect from you", "your (?:expertise|background)",
    "^required\\b", "^you(?: are)?:?$", "buscamos",
  ].join("|"),
  "i",
);
/** Headings that name requirements but are not them. */
const NOT_ASK = /don['’]?t meet|do not meet|\bnot\b|why you|market fit/i;
/** An optional section is not what they ask for. */
const OPTIONAL = /preferred|nice[- ]to[- ]have|bonus|a plus|added plus|not required|pluses|desirable|deseable/i;
/** Other section headings, which end a requirements section even without a colon. */
const OTHER_HEADING = /^(?:benefits|perks|what we offer|compensation|about us|about the role|the role|responsibilities|what you(?:['’]?ll)? do|preferred|nice to have|bonus points|why join us|our values|equal opportunity)\b.{0,30}$/i;
const BULLET = /^(?:[-•*·▪●◦–]|\d+[.)])\s*/;
/** A line without a colon must be this short to be a heading rather than a sentence. */
const BARE_HEADING_MAX = 50;
/** A line with a colon at its end. */
const COLON_HEADING_MAX = 90;

/** A heading that opens the requirements: heading-shaped (ends in a colon, or short with no closing stop and no bullet
 *  mark; a question mark is fine, "Are you the person we're looking for?"), names what they ask for, and is not an
 *  optional section or another known one. */
export function isAskHeading(line: string): boolean {
  const t = line.trim();
  const shaped = t.endsWith(":") ? t.length <= COLON_HEADING_MAX : t.length <= BARE_HEADING_MAX && !/[.!]$/.test(t) && !BULLET.test(t);
  return shaped && ASK_WORDS.test(t) && !OPTIONAL.test(t) && !NOT_ASK.test(t) && !OTHER_HEADING.test(t);
}

/** A line that starts another section: a known heading, or a short line ending in a colon. A bare line that only
 *  sounds like an ask heading ("You have strong SQL") is an ask, not the end of the section. */
const isHeading = (line: string): boolean =>
  OTHER_HEADING.test(line) || (line.length <= COLON_HEADING_MAX && line.endsWith(":")) || (line.length <= COLON_HEADING_MAX && OPTIONAL.test(line) && !/[.!?]$/.test(line));

/** The line cut at a word near ASK_MAX_CHARS, with "…" when cut. */
function cut(line: string): string {
  if (line.length <= ASK_MAX_CHARS) return line;
  const head = line.slice(0, ASK_MAX_CHARS);
  const space = head.lastIndexOf(" ");
  return `${(space > 0 ? head.slice(0, space) : head).replace(/[\s,;:.]+$/, "")}…`;
}

/** The fallback shows nothing with fewer asks than this, so one stray line does not make a section. */
export const MIN_FALLBACK_ASKS = 2;
/** A line that reads as an ask wherever it is: years, a degree, experience with, proficiency, knowledge, ability. */
const ASK_LINE = /\d+\+? ?years|years of (?:experience|work)|experience (?:with|in|building|working|leading|as|using)|degree in|bachelor|master['’]?s|ph\.?d|proficien|fluen(?:t|cy) in|familiar(?:ity)? with|knowledge of|ability to|track record|strong (?:[\w-]+ ){0,3}skills|comfortable with|hands-on experience/i;
/** Sections whose lines are not what they ask for, though they may sound like it. */
const SKIP_SECTION = new RegExp(`${OPTIONAL.source}|^(?:benefits|perks|what we offer|compensation|equal opportunity|eeo|privacy|accommodation|about us|our values|why join)`, "i");
/** Lines that are about the company or the hiring process, not the person. */
const NOT_ASK_LINE = /^(?:we|our|at [\w.]+)\b|\bwe['’]ve\b|\braised\b|equal opportunity|accommodation|adjustments?\b|recruitment process|regardless of|a plus|bonus|nice[- ]to[- ]have/i;
/** A line shaped like a section heading: a known heading, or short with no bullet mark and no closing stop. */
const headingShaped = (line: string): boolean =>
  isHeading(line) || (line.length <= BARE_HEADING_MAX && !BULLET.test(line) && !/[.!]$/.test(line));

/** The asks of a posting with no requirements heading: lines anywhere that read as an ask (ASK_LINE), outside the
 *  optional, benefits and equal opportunity sections, and not about the company. At least MIN_FALLBACK_ASKS or none. */
function fallbackAsks(lines: readonly string[]): string[] {
  const asks: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const bare = line.replace(BULLET, "").trim();
    const ask = ASK_LINE.test(bare) && !NOT_ASK_LINE.test(bare) && bare.length <= ASK_MAX_LINE;
    if (!ask && headingShaped(line)) skipping = SKIP_SECTION.test(line);
    else if (ask && !skipping) asks.push(cut(bare));
    if (asks.length === MAX_ASKS) break;
  }
  return asks.length >= MIN_FALLBACK_ASKS ? asks : [];
}

/** Up to MAX_ASKS asks from the first requirements section: its bullet or short lines, bullet marks taken off, until
 *  the next heading. Without such a section, the lines anywhere that read as an ask (fallbackAsks). */
export function askBullets(text: string): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex(isAskHeading);
  if (start === -1) return fallbackAsks(lines);
  const asks: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (isAskHeading(line)) continue; // a sub-heading inside the section ("Experience & Education")
    if (isHeading(line)) break;
    const bare = line.replace(BULLET, "").trim();
    if (bare && bare.length <= ASK_MAX_LINE) asks.push(cut(bare));
    if (asks.length === MAX_ASKS) break;
  }
  return asks;
}

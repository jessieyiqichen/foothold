// Cuts a posting's text into the pieces a signal may quote: sentences and bullet lines, each an exact substring of
// the text (never rebuilt, never rejoined), 1..QUOTE_MAX characters, each tagged with the section heading above it.
// No Deno or Node imports.

export const QUOTE_MAX = 400;

/** required: under "Requirements", "Qualifications", "What you'll bring", "About you" and the like.
 *  preferred: under "Preferred", "Nice to have", "Bonus", "Plus". null: no such heading, or another heading since. */
export type Section = "required" | "preferred" | null;

export interface Segment {
  quote: string;
  section: Section;
}

const PREFERRED_HEADING = /^(?:preferred|nice[- ]to[- ]haves?|bonus|plus(?:es)?\b|extra credit|good to have|it'?s a plus|would be (?:great|nice))|preferred (?:qualifications|skills|experience)|nice[- ]to[- ]have|bonus points/i;
// "Desired skills" is preferred, but "Desired Skills & Qualifications" is often a posting's only requirements list
const DESIRED_HEADING = /^(?:desired|desirable)\b(?!.*\b(?:qualifications|requirements)\b)/i;
const REQUIRED_HEADING = /\b(?:requirements|qualifications|required|must[- ]haves?)\b|^(?:what you(?:'|’)?ll bring|what you bring|about you|who you are|what we(?:'|’)?re looking for|what you(?:'|’)?ll need|what you need|you have|must[- ]haves?|you might be a fit|is this you)/i;
const OTHER_HEADING = /^(?:responsibilities|what you(?:'|’)?ll do|what you will do|about (?:us|the (?:role|company|team|job))|benefits|perks|what we offer|compensation|the role|the internship|why (?:join|us|work)|our (?:stack|team|values|mission)|location|salary|how to apply|equal opportunity)/i;

const HEADING_MAX = 80;
const HEADING_WORDS = 6;
const BULLET = /^(?:[-*•·◦▪●–]|\+\+|\d{1,2}[.)])\s+/;

/** The section a heading line opens, or undefined when the line is not a heading. */
export function headingOf(line: string): Section | undefined {
  const text = line.trim();
  if (text.length === 0 || text.length > HEADING_MAX || BULLET.test(text)) return undefined;
  // "Benefits: 401(k), equity" is content under an inline heading, not a heading line (inlineHeadingOf)
  if (text.slice(0, -1).includes(":")) return undefined;
  const bare = text.replace(/:$/, "").trim();
  // A heading ends in a colon, or is a few words with no digits and no closing stop ("5+ years required" is not one)
  const looksLikeHeading = text.endsWith(":") || (!/[.!?]$/.test(text) && !/\d/.test(text) && bare.split(/\s+/).length <= HEADING_WORDS);
  if (!looksLikeHeading) return undefined;
  if (PREFERRED_HEADING.test(bare) || DESIRED_HEADING.test(bare)) return "preferred";
  if (REQUIRED_HEADING.test(bare)) return "required";
  // Any other heading ends the section: a line ending in a colon, a known one, or a short line in capitals
  if (text.endsWith(":") || OTHER_HEADING.test(bare) || (/[A-Z]{2}/.test(bare) && bare === bare.toUpperCase())) return null;
  return undefined;
}

/** A line that opens with a heading and goes on ("Requirements: 5+ years ..."): the section it opens, else undefined. */
function inlineHeadingOf(line: string): Section | undefined {
  const m = /^([^:]{1,40}):\s*\S/.exec(line.trim());
  return m ? headingOf(`${m[1]}:`) : undefined;
}

/** [start, end) ranges of `text` between `from` and `to`, cut where `cut` matches (the match itself is dropped). */
function splitRange(text: string, from: number, to: number, cut: RegExp): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const re = new RegExp(cut.source, cut.flags.includes("g") ? cut.flags : `${cut.flags}g`);
  re.lastIndex = from;
  let start = from;
  for (let m = re.exec(text); m !== null && m.index < to; m = re.exec(text)) {
    if (m.index + m[0].length > to) break;
    out.push([start, m.index]);
    start = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  out.push([start, to]);
  return out;
}

const ABBREVIATION = /(?:^|[\s(])(?:(?:[A-Za-z]\.)*[A-Za-z]|e\.g|i\.e|etc|inc|jr|sr|st|vs|no|mr|mrs|ms|dr|approx|incl|min|max|yrs?)$/i;

/** Sentence ends inside [from, to): after . ! ? followed by space, unless the word before is an abbreviation. */
function sentenceRanges(text: string, from: number, to: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let start = from;
  for (let i = from; i < to - 1; i++) {
    const c = text[i];
    if (c !== "." && c !== "!" && c !== "?") continue;
    if (!/\s/.test(text[i + 1])) continue;
    if (c === "." && ABBREVIATION.test(text.slice(Math.max(start, i - 12), i))) continue;
    out.push([start, i + 1]);
    start = i + 1;
  }
  out.push([start, to]);
  return out;
}

/** The range trimmed of spaces and of a leading bullet mark; null when nothing is left. */
function trimRange(text: string, start: number, end: number): [number, number] | null {
  let s = start;
  let e = end;
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  const bullet = BULLET.exec(text.slice(s, Math.min(e, s + 6)));
  if (bullet) s += bullet[0].length;
  while (s < e && /\s/.test(text[s])) s++;
  return e > s ? [s, e] : null;
}

/** Where an over-long sentence may still be cut, in order: "; ", then a lower-case word followed by a capitalised
 *  one ("... engineering experience Strong communication ..."), which is how run-on posts flatten their bullets. */
const LONG_CUTS = [/; /, /(?<=[a-z0-9)])\s(?=[A-Z][a-z])/];

/** A trimmed range as quotable pieces: itself when short enough, else cut by LONG_CUTS; a piece that is still too
 *  long is dropped, never truncated. */
function quotable(text: string, r: [number, number], cuts: readonly RegExp[] = LONG_CUTS): Array<[number, number]> {
  if (r[1] - r[0] <= QUOTE_MAX) return [r];
  const [cut, ...rest] = cuts;
  if (!cut) return [];
  return splitRange(text, r[0], r[1], cut).flatMap(([cs, ce]) => {
    const c = trimRange(text, cs, ce);
    return c ? quotable(text, c, rest) : [];
  });
}

/** Pieces of one line: header fields (" | "), inline bullets, then sentences, each made quotable. */
function pieces(text: string, start: number, end: number): Array<[number, number]> {
  return splitRange(text, start, end, / \| /)
    .flatMap(([fs, fe]) => splitRange(text, fs, fe, /\s(?:[-*•·]|\+\+)\s(?=[A-Z(])/))
    .flatMap(([bs, be]) => sentenceRanges(text, bs, be))
    .flatMap(([ss, se]) => {
      const r = trimRange(text, ss, se);
      return r ? quotable(text, r) : [];
    });
}

/** The text as quotable segments, in order. Every `quote` is `text.slice(a, b)` for some a, b. */
export function segmentsOf(text: string): Segment[] {
  const out: Segment[] = [];
  let section: Section = null;
  for (const [ls, le] of splitRange(text, 0, text.length, /\r?\n/)) {
    const line = text.slice(ls, le);
    const heading = headingOf(line);
    if (heading !== undefined) {
      section = heading;
      continue;
    }
    const inline = inlineHeadingOf(line);
    if (inline !== undefined) section = inline;
    for (const [s, e] of pieces(text, ls, le)) out.push({ quote: text.slice(s, e), section });
  }
  return out;
}

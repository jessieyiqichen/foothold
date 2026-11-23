// Years of experience a posting asks for, read from its segments (docs/judge-signals.md, "Thresholds").
// No Deno or Node imports.

import type { Segment } from "./sentences.ts";

/** The eval rule: 0 to 2 years is new grad, so a required minimum of this many years or more "needs years". */
export const NEEDS_YEARS_MIN = 3;
export const YEARS_MAX = 40;

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
};
const NUM = `(\\d{1,2}(?:\\.\\d)?|${Object.keys(WORDS).join("|")})`;
const PAREN = `(?:\\s*\\(\\d{1,2}\\))?`;
/** "3+ years", "3 - 5 years", "three (3) or more years", "at least 4 yrs", "5+ YOE". Group 1: the minimum. */
const MENTION = new RegExp(
  `\\b${NUM}${PAREN}\\s*(?:\\+|plus\\b)?\\s*(?:(?:-|–|—|to)\\s*${NUM}${PAREN}\\s*\\+?\\s*)?(?:or more\\s+|or greater\\s+)?(years?|yrs?|YOE)\\b`,
  "gi",
);

export type Requiredness = "required" | "preferred" | "unknown";
export type Experience = "yes" | "no" | "unclear";

export interface Mention {
  min: number;
  experience: Experience;
  requiredness: Requiredness;
  quote: string;
}

export interface YearsValue {
  min: number;
  required: boolean;
  quote: string;
}

export interface YearsPending {
  kind: "years";
  sentence: string;
  value: number;
}

// Never experience, anywhere near the number: the company's age, vesting, runway, a person's age, time at school
const NOT_AROUND = /\b(?:founded|ago|vest(?:s|ed|ing)?|cliff|runway|(?:years?|yrs?) old|over the (?:past|last)|in the (?:past|last)|anniversary|year-round|left (?:of|in) school|in business|since (?:19|20)\d\d)\b/i;
// Never experience, right after the number: "4 year degree", "3 years of runway", "a 2 year contract"
const NOT_AFTER = /^\W{0,3}(?:degree|program|programme|course|plan|contract|term|warranty|lease|vesting|cliff|guarantee|of (?:runway|school|college|university|study|age|funding|growth|profitab\w*|history|operation|existence))\b/i;
// The company talking about itself: "profitable for 10 years", "we've been doing this". Experience only if a cue says so
const FOR_BEFORE = /(?<!\b(?:looking|searching|hiring|look|search|hire|ask|asking) )\bfor (?:over |more than |nearly |almost |the (?:past|last) )?$/i;
const COMPANY_TIME = /\b(?:we(?:'|’)?ve been|we have been|(?:company|business) (?:has|have) been)\b/i;
const EXPERIENCE_AFTER = /^\W{0,3}(?:in\s+[\w&/+.-]|(?:of\s+)?(?:[\w&/+.-]+\s+){0,6}?(?:experien|exp\b|work|professional|industry|hands-on|track record|building|developing|selling|managing|leading|shipping|writing|designing|running|engineering|programming|coding|in (?:a|an|the)?\s*(?:[\w-]+\s+){0,3}(?:roles?|positions?|settings?|environments?|capacity|teams?|field|industry|space)\b))/i;
const EXPERIENCE_BEFORE = /(?:experien\w*|exp\.?)\s*(?:of|:|-|–|,|with)?\s*(?:at least|a minimum of|minimum of|min\.?|over|more than)?\s*$/i;
const PREFERRED_CUE = /\b(?:preferred|nice[- ]to[- ]have|bonus|a plus|is a plus|plus if|desir(?:ed|able)|advantage(?:ous)?|helpful|not required|would be great)\b/i;
/** "ideally 10+ years" is preferred; "2-4 years in FP&A, ideally at a lender" is not: ideally counts only just before the number */
const IDEALLY_BEFORE = /\b(?:ideally|ideal(?:ly)? candidates? (?:has|have|will have|brings?))\b[^.;]{0,25}$/i;
const REQUIRED_CUE = /\b(?:required|requires?|requirement|must|minimum|at least|need(?:s|ed)?|looking for|you have|you(?:'|’)ve|you bring|you(?:'|’)ll bring|you should have|should have|we(?:'|’)?re hiring)\b/i;

const numberOf = (raw: string): number => {
  const w = WORDS[raw.toLowerCase()];
  return w !== undefined ? w : Math.floor(Number(raw));
};

/** Whether this mention, at [start, end) of the sentence, is about experience. */
export function experienceOf(sentence: string, start: number, end: number, unit: string): Experience {
  const before = sentence.slice(Math.max(0, start - 40), start);
  const after = sentence.slice(end, end + 80);
  if (NOT_AROUND.test(`${before}${sentence.slice(start, end)}${after}`) || NOT_AFTER.test(after)) return "no";
  const cued = /^yoe$/i.test(unit)
    || EXPERIENCE_AFTER.test(after.split(/[.;,]| and | but /)[0] ?? "")
    || EXPERIENCE_BEFORE.test(before);
  if (FOR_BEFORE.test(before) || COMPANY_TIME.test(`${before}${after}`)) return cued ? "unclear" : "no";
  return cued ? "yes" : "unclear";
}

/** The part of the sentence a cue must sit in to govern the years at [start, end): between semicolons, with any
 *  parenthesis taken out ("5+ years of database work (PostgreSQL preferred)" is not about the years). */
function clauseOf(sentence: string, start: number, end: number): string {
  const from = sentence.lastIndexOf(";", start) + 1;
  const stop = sentence.indexOf(";", end);
  return sentence.slice(from, stop === -1 ? sentence.length : stop).replace(/\([^)]*\)/g, " ");
}

function requirednessOf(sentence: string, start: number, end: number, section: Segment["section"]): Requiredness {
  if (PREFERRED_CUE.test(clauseOf(sentence, start, end)) || IDEALLY_BEFORE.test(sentence.slice(Math.max(0, start - 40), start))) return "preferred";
  if (REQUIRED_CUE.test(sentence)) return "required";
  if (section === "preferred") return "preferred";
  if (section === "required") return "required";
  // A line that opens with its years ("7+ years of product experience, ...") is a requirement line
  if (start === 0) return "required";
  return "unknown";
}

interface Raw extends Mention {
  start: number;
  end: number;
}

// "12+ years in X, including 5+ years leading teams", "9+ years, 4 years of which in management": the sub-clause's
// number is a part of the main one, not the requirement
const SUB_BEFORE = /\b(?:including|incl\.?|of which|with)\s+(?:at least\s+|over\s+)?$/i;
const SUB_AFTER = /^\s*of which\b/i;

/** Alternatives joined by "or" ("2-5 years at startups, or more than 4 years overall") ask for the smallest. */
function merge(a: Raw, b: Raw): Raw {
  return {
    ...a, min: Math.min(a.min, b.min), end: b.end,
    experience: a.experience === "yes" || b.experience === "yes" ? "yes" : "unclear",
    requiredness: a.requiredness === "unknown" ? b.requiredness : a.requiredness,
  };
}

function rawMentions(seg: Segment): Raw[] {
  const out: Raw[] = [];
  for (const m of seg.quote.matchAll(MENTION)) {
    const min = numberOf(m[1]);
    if (!Number.isInteger(min) || min < 0 || min > YEARS_MAX) continue;
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const experience = experienceOf(seg.quote, start, end, m[3]);
    if (experience === "no") continue;
    out.push({ min, experience, requiredness: requirednessOf(seg.quote, start, end, seg.section), quote: seg.quote, start, end });
  }
  return out;
}

/** Every years mention in one segment, sub-clauses dropped and "or" alternatives merged. */
export function mentionsOf(seg: Segment): Mention[] {
  const kept: Raw[] = [];
  for (const m of rawMentions(seg)) {
    const prev = kept[kept.length - 1];
    if (!prev) { kept.push(m); continue; }
    const between = seg.quote.slice(prev.end, m.start);
    if (SUB_BEFORE.test(between) || SUB_AFTER.test(seg.quote.slice(m.end))) continue;
    if (/\bor\b/i.test(between)) kept[kept.length - 1] = merge(prev, m);
    else kept.push(m);
  }
  return kept.map(({ min, experience, requiredness, quote }) => ({ min, experience, requiredness, quote }));
}

const largest = (ms: Mention[]): Mention | null => ms.reduce<Mention | null>((best, m) => (best === null || m.min > best.min ? m : best), null);

/** The years a posting asks for, and the sentences only the model can settle. A mention the rules are unsure of (not
 *  surely experience, or with no required/preferred cue or heading) is pending only where it changes the answer:
 *  it says 3 years or more and nothing settled already does. Below that it changes nothing and counts as required. */
export function yearsOf(segments: readonly Segment[]): { years: YearsValue | null; pending: YearsPending[] } {
  const all = segments.flatMap(mentionsOf);
  const sure = all.filter((m) => m.experience === "yes");
  const required = sure.filter((m) => m.requiredness === "required" || (m.requiredness === "unknown" && m.min < NEEDS_YEARS_MIN));
  const best = largest(required);
  const settled = best !== null && best.min >= NEEDS_YEARS_MIN;
  const unsure = all.filter((m) => m.min >= NEEDS_YEARS_MIN && (m.experience === "unclear" || m.requiredness === "unknown"));
  const pending: YearsPending[] = [];
  if (!settled) {
    for (const m of unsure) {
      if (m.requiredness === "preferred") continue;
      const same = pending.findIndex((p) => p.sentence === m.quote);
      if (same === -1) pending.push({ kind: "years", sentence: m.quote, value: m.min });
      else if (m.min > pending[same].value) pending[same] = { ...pending[same], value: m.min };
    }
  }
  if (best) return { years: { min: best.min, required: true, quote: best.quote }, pending };
  const preferred = largest(sure.filter((m) => m.requiredness === "preferred"));
  return { years: preferred ? { min: preferred.min, required: false, quote: preferred.quote } : null, pending };
}

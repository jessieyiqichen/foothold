// The check that turns the model's draft into something Foothold can stand behind: both quotes must appear word for
// word in their sources, the body must be a short email, and it must carry no address or link (the user adds their
// own). The model writes; this code decides whether what it wrote may be shown (user, 2026-11-16).

import { humanProblems } from "./humanize";

export interface DraftText { subject: string; body: string; resumeQuote: string; companyQuote: string }

export const BODY_WORDS = { min: 40, max: 160 } as const;
/** A short subject is opened more (Boomerang: 3 to 4 words best, 2016); 8 leaves room for the role's title. */
export const SUBJECT_WORDS = 8;
/** Character caps, below the database's own checks, so a draft that passes here can always be saved. */
export const CHARS = { subject: 150, body: 1500, quote: 300 } as const;
/** A quote shorter than this says nothing a reader could check. */
const QUOTE_MIN_CHARS = 12;

/** Lower case, one space between words, and the dashes and quote marks a model swaps in made plain. */
function normal(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether `quote` appears in `source` word for word (case, spacing and dash style aside). */
export function quotedIn(quote: string, source: string): boolean {
  const q = normal(quote).replace(/^["']|["'.]$/g, "");
  return q.length >= QUOTE_MIN_CHARS && normal(source).includes(q);
}

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/** An address, a URL, or a bare domain or short link ("acme-careers.co/verify", "bit.ly/x9"): a name followed by a dot
 *  and a known ending. Ordinary words with dots ("Node.js", "e.g.") end in letters that are not domain endings. */
export const ADDRESS_OR_LINK = /[^\s@]+@[^\s@]+\.[a-z]{2,}|https?:\/\/|www\.|\b[a-z0-9-]{2,63}\.(?:com|co|io|ai|ly|me|net|org|app|dev|xyz|link|gl|gg|to|info|biz|us|uk|in)\b(?:\/\S*)?/i;
/** A phone number: seven or more digits, with the usual separators and an optional country code. */
export const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{3}[\s.-]?\d{3,4}\b/;

/** A job title claimed as the writer's own: "I am a product manager", "I'm an experienced PM", or a sentence opening
 *  "As a software engineer". A title followed by "intern", or with "aspiring" before it, is left alone. */
const OWN_TITLE = /(?:\bI am|\bI'm|(?:^|[.!?]\s+)As)\s+(?:an?\s+)?(?:(?:experienced|seasoned|senior)\s+)?(?:product manager|pm|software engineer|engineer|data scientist|data analyst|analyst|researcher|designer|founder|consultant|product leader)\b(?!\s+intern)/i;
/** Phrases that make a first email read like a template (user, 2026-11-17). Checked in this order. */
export const STOCK_PHRASES = [
  "hope this email finds you well", "i am writing to", "reaching out", "long admired", "always admired", "passionate about",
  "i would love to bring", "excited to", "thrilled", "pick your brain", "leverage", "synergy", "cutting-edge", "game-changer",
  "delve", "in today's", "metric-driven", "results-driven", "a unique blend",
  // Generic openers and apologies (First Round, 530 recruiter emails; career centres, 2026-11-22)
  "sorry to bother", "i know you're busy", "hope you don't mind", "impressed with your", "came across your profile",
] as const;

/** A request for a referral: the user wants a first email to ask only for a chat (2026-11-17). */
const REFERRAL = /\b(?:refer|referral|referrals|referring|referred)\b|\bpass(?:ing)? (?:my|this) (?:resume|cv|name|profile) (?:along|on)\b|\bpass along my\b/i;

/** The ways a draft may name a role: the title without brackets ("(2027)"), or one part of a title joined by commas
 *  or dashes ("AI Applied Scientist"), compared in normal form. */
export function roleNames(title: string): string[] {
  const plain = normal(title.replace(/\([^)]*\)|\[[^\]]*\]/g, " ")).replace(/[\s,;:-]+$/, "");
  const parts = plain.split(/\s*(?:,|\s-\s|\|)\s*/).map((p) => p.trim()).filter((p) => p.length >= 8);
  return [...new Set([plain, ...parts])].filter((p) => p.length >= 4);
}

/** The role and the ask: one role named, a chat and never a referral. */
function askProblems(body: string, roles: readonly string[]): string[] {
  const problems: string[] = [];
  const text = normal(body);
  if (roles.length > 0 && !roles.some((title) => roleNames(title).some((name) => text.includes(name)))) {
    problems.push(`the body must name one of the roles they hire for: ${roles.map((r) => `"${r}"`).join("; ")}`);
  }
  if (REFERRAL.test(body)) problems.push("the body must not ask for a referral; ask only for a short chat");
  return problems;
}

function voiceProblems(body: string): string[] {
  const problems: string[] = [];
  const claim = OWN_TITLE.exec(body);
  if (claim) problems.push(`the body calls the writer "${claim[0].replace(/^[.!?]\s+/, "").trim()}"; describe them only as the resume does (a student, an intern)`);
  const text = normal(body);
  for (const phrase of STOCK_PHRASES) if (text.includes(phrase)) problems.push(`the body uses the stock phrase "${phrase}"`);
  return problems;
}

/** The first sentence, after any greeting line. */
const firstSentence = (body: string) => body.replace(/^\s*(?:hi|hello|hey|dear)\b[^\n,]*,?\s*/i, "").split(/(?<=[.!?])\s/)[0] ?? "";
/** A company quote this long, pasted into the body, reads as their marketing copy (2026-11-21, a real draft). */
const PASTE_WORDS = 5;

/** How it reads: written by the person ("I"), and the company's own words not pasted in (2026-11-21: a real draft
 *  opened "An M.A. student ... is writing" and ended on "faster, better, and cheaper, at scale"). */
/** A resume bullet's opening verb: a sentence that starts with one has no subject (eval baseline, 2026-11-22). */
const RESUME_VERB = /^(Built|Owned|Shipped|Led|Designed|Created|Launched|Developed|Managed|Drove|Analy[sz]ed|Ran|Delivered|Prototyped|Wrote|Reduced|Increased|Improved|Implemented|Founded|Grew|Diagnosed|Automated|Conducted|Defined)\b/;
/** Six words in a row from the company's own text is their copy, even when the words around it change. */
const COPY_WORDS = 6;

const words = (s: string) => normal(s).replace(/[^a-z0-9' ]+/g, " ").split(" ").filter(Boolean);

/** The first run of COPY_WORDS words the body shares with the company's text, or null. */
function copiedRun(body: string, company: string): string | null {
  const from = words(company);
  const runs = new Set<string>();
  for (let i = 0; i + COPY_WORDS <= from.length; i++) runs.add(from.slice(i, i + COPY_WORDS).join(" "));
  const mine = words(body);
  for (let i = 0; i + COPY_WORDS <= mine.length; i++) {
    const run = mine.slice(i, i + COPY_WORDS).join(" ");
    if (runs.has(run)) return run;
  }
  return null;
}

function readingProblems(d: DraftText, company: string): string[] {
  const problems: string[] = [];
  if (!/\b(?:I|I'm|I've|my)\b/.test(firstSentence(d.body))) problems.push("the first sentence must be in the first person (\"I'm ...\"), not about the writer in the third person");
  const bare = d.body.split(/(?<=[.!?])\s+/).map((s) => RESUME_VERB.exec(s.trim())).find(Boolean);
  if (bare) problems.push(`a sentence starts "${bare[1]}" with no subject, like a resume line; write it as "I ${bare[1].toLowerCase()} ..."`);
  const pasted = wordCount(d.companyQuote) >= PASTE_WORDS && normal(d.body).includes(normal(d.companyQuote)) ? normal(d.companyQuote) : copiedRun(d.body, company);
  if (pasted) problems.push(`the body reuses the company's own words ("${pasted}"); say what they do in a few words of your own, or leave it out`);
  return problems;
}

/** Every problem with a draft, in a fixed order; an empty list means it may be shown. */
export function checkDraft(d: DraftText, sources: { resume: string; company: string; roles?: readonly string[]; allow?: readonly string[] }): string[] {
  const problems: string[] = [];
  if (d.subject.trim().length === 0) problems.push("the subject is empty");
  if (d.subject.length > CHARS.subject) problems.push(`the subject is longer than ${CHARS.subject} characters`);
  if (ADDRESS_OR_LINK.test(d.subject)) problems.push("the subject must not contain an email address or a link");
  if (wordCount(d.subject) > SUBJECT_WORDS) problems.push(`the subject has ${wordCount(d.subject)} words; keep it to ${SUBJECT_WORDS}`);
  if (d.body.length > CHARS.body) problems.push(`the body is longer than ${CHARS.body} characters`);
  const words = wordCount(d.body);
  if (words < BODY_WORDS.min || words > BODY_WORDS.max) {
    problems.push(`the body has ${words} words; it must have ${BODY_WORDS.min} to ${BODY_WORDS.max}`);
  }
  if (ADDRESS_OR_LINK.test(d.body)) problems.push("the body must not contain an email address or a link");
  if (PHONE.test(d.body)) problems.push("the body must not contain a phone number");
  problems.push(...askProblems(d.body, sources.roles ?? []), ...readingProblems(d, sources.company), ...voiceProblems(d.body), ...humanProblems(d.body, sources.allow ?? sources.roles ?? []));
  if (d.resumeQuote.length > CHARS.quote || d.companyQuote.length > CHARS.quote) problems.push(`a quote is longer than ${CHARS.quote} characters`);
  if (!quotedIn(d.resumeQuote, sources.resume)) problems.push("the resume quote is not word for word in the resume");
  if (!quotedIn(d.companyQuote, sources.company)) problems.push("the company quote is not word for word in the company description");
  return problems;
}

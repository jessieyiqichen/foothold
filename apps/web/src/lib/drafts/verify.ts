// The check that turns the model's draft into something Foothold can stand behind: both quotes must appear word for
// word in their sources, the body must be a short email, and it must carry no address or link (the user adds their
// own). The model writes; this code decides whether what it wrote may be shown (user, 2026-11-16).

export interface DraftText { subject: string; body: string; resumeQuote: string; companyQuote: string }

export const BODY_WORDS = { min: 40, max: 160 } as const;
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
const ADDRESS_OR_LINK = /[^\s@]+@[^\s@]+\.[a-z]{2,}|https?:\/\/|www\.|\b[a-z0-9-]{2,63}\.(?:com|co|io|ai|ly|me|net|org|app|dev|xyz|link|gl|gg|to|info|biz|us|uk|in)\b(?:\/\S*)?/i;
/** A phone number: seven or more digits, with the usual separators and an optional country code. */
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{3}[\s.-]?\d{3,4}\b/;

/** Every problem with a draft, in a fixed order; an empty list means it may be shown. */
export function checkDraft(d: DraftText, sources: { resume: string; company: string }): string[] {
  const problems: string[] = [];
  if (d.subject.trim().length === 0) problems.push("the subject is empty");
  if (d.subject.length > CHARS.subject) problems.push(`the subject is longer than ${CHARS.subject} characters`);
  if (ADDRESS_OR_LINK.test(d.subject)) problems.push("the subject must not contain an email address or a link");
  if (d.body.length > CHARS.body) problems.push(`the body is longer than ${CHARS.body} characters`);
  const words = wordCount(d.body);
  if (words < BODY_WORDS.min || words > BODY_WORDS.max) {
    problems.push(`the body has ${words} words; it must have ${BODY_WORDS.min} to ${BODY_WORDS.max}`);
  }
  if (ADDRESS_OR_LINK.test(d.body)) problems.push("the body must not contain an email address or a link");
  if (PHONE.test(d.body)) problems.push("the body must not contain a phone number");
  if (d.resumeQuote.length > CHARS.quote || d.companyQuote.length > CHARS.quote) problems.push(`a quote is longer than ${CHARS.quote} characters`);
  if (!quotedIn(d.resumeQuote, sources.resume)) problems.push("the resume quote is not word for word in the resume");
  if (!quotedIn(d.companyQuote, sources.company)) problems.push("the company quote is not word for word in the company description");
  return problems;
}

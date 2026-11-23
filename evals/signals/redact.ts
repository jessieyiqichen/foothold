// Takes email addresses and phone numbers out of a posting's text before it is written to a file in this (public)
// repo. Deterministic: the same text always gives the same result. Disguised addresses count only in clear forms
// ("x (at) y (dot) com", "x [at] y.com", "x at y dot com"); "learn more at chalk.ai" is not an address.
// Phone patterns refuse digits glued to a word, a slash or a dot, so ids and numbers inside URLs stay.
// No Deno or Node imports.

export const EMAIL_MASK = "[email]";
export const PHONE_MASK = "[phone]";

const AT = String.raw`\s*[\(\[\{<]\s*(?:at|@)\s*[\)\]\}>]\s*`;
const DOT = String.raw`\s*(?:[\(\[\{<]\s*dot\s*[\)\]\}>]|\.)\s*`;
const EMAIL_PATTERNS: readonly RegExp[] = [
  // x (at) y (dot) com, x [at] y.com
  new RegExp(String.raw`[\w.+-]+${AT}[\w-]+(?:${DOT}[\w-]+)+`, "gi"),
  // x at y dot com (the word "dot" is required, so "at chalk.ai" stays)
  /\b[\w.+-]+\s+at\s+[\w-]+(?:\s+dot\s+[a-z]{2,})+\b/gi,
  // x@y.com, or x @ y.com with a space on both sides ("from an @blee.com address" names a domain, not an address)
  /[\w.+-]+(?:@|\s@\s)[\w-]+(?:\.[\w-]+)+/g,
];

const EDGE_BEFORE = String.raw`(?<![\w/.@-])`;
const EDGE_AFTER = String.raw`(?![\w/@-]|\.\d)`;
const PHONE_PATTERNS: readonly RegExp[] = [
  // (555) 555-5555, 555-555-5555, 555.555.5555, +1 555 555 5555, 1-800-555-5555
  new RegExp(String.raw`${EDGE_BEFORE}(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}${EDGE_AFTER}`, "g"),
  // International with a plus: +44 20 7946 0958, +49 (0) 30 1234567
  new RegExp(String.raw`${EDGE_BEFORE}\+\d{1,3}(?:[\s.-]?\(?\d{1,5}\)?){2,5}${EDGE_AFTER}`, "g"),
];
const PHONE_DIGITS_MIN = 8;
const PHONE_DIGITS_MAX = 15;

export interface Redacted {
  text: string;
  emails: number;
  phones: number;
}

function replaceAll(text: string, patterns: readonly RegExp[], mask: string, keep: (m: string) => boolean): [string, number] {
  return patterns.reduce<[string, number]>(([t, n], re) => {
    let count = n;
    const next = t.replace(re, (m) => {
      if (!keep(m)) return m;
      count++;
      return mask;
    });
    return [next, count];
  }, [text, 0]);
}

/** The text with every email address and phone number masked, and how many of each were masked. */
export function redact(text: string): Redacted {
  const [noEmails, emails] = replaceAll(text, EMAIL_PATTERNS, EMAIL_MASK, () => true);
  const digits = (m: string) => m.replace(/\D/g, "").length;
  const [clean, phones] = replaceAll(noEmails, PHONE_PATTERNS, PHONE_MASK,
    (m) => digits(m) >= PHONE_DIGITS_MIN && digits(m) <= PHONE_DIGITS_MAX);
  return { text: clean, emails, phones };
}

// What of a resume goes to the model: the experience, not the person's identity. The user agreed on 2026-11-16 that
// only the resume's experience lines are sent, because Gemini's free tier may keep and show prompts to reviewers
// (log.md, Gemini's terms). The name line and every address, link, phone number and contact line are taken out first.

import { ADDRESS_OR_LINK, PHONE } from "./verify";

const everywhere = (re: RegExp) => new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
const LINKS = everywhere(ADDRESS_OR_LINK);
const PHONES = everywhere(PHONE);
/** A line that names a way to reach the person, in English or Chinese. */
const CONTACT_LABEL = /^\s*(?:e-?mail|phone|tel|mobile|cell|address|linkedin|github|wechat|website|portfolio|邮箱|电话|手机|微信|地址|主页)\s*[:：]/i;
/** A US state and ZIP code ("IL 60637"), the part of a postal address a resume usually carries. */
const STATE_ZIP = /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/;
const HAS_LETTER = /\p{L}/u;

/** The first line, when it is short, has no digits and is not an all-capitals heading, is taken as the name. */
function looksLikeName(line: string): boolean {
  const t = line.trim();
  return t.split(/\s+/).length <= 4 && !/\d/.test(t) && t !== t.toUpperCase() || /^[\p{Script=Han}·]{2,5}$/u.test(t);
}

/** The resume with the name line and all contact details removed; experience lines are kept word for word. */
export function resumeForModel(text: string): string {
  const lines = text.split(/\r?\n/);
  const first = lines.findIndex((l) => l.trim() !== "");
  return lines
    .filter((l, i) => !(i === first && looksLikeName(l)))
    .filter((l) => !CONTACT_LABEL.test(l) && !STATE_ZIP.test(l))
    .map((l) => l.replace(LINKS, "").replace(PHONES, "").replace(/\s+$/, ""))
    .filter((l) => l.trim() === "" || HAS_LETTER.test(l.replace(/[|•·,;]/g, "")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A closing line after which an email's sign-off follows: the name, a title, contact lines. */
const SIGN_OFF = /^\s*(?:best|best regards|regards|kind regards|warm regards|thanks|thank you|many thanks|cheers|sincerely|all the best|yours)\b[^\n]{0,20}$/i;
/** An email's greeting line ("Hi Dana,"): it names the recipient. */
const GREETING = /^\s*(?:hi|hello|hey|dear)\b[^\n]{0,60}[,!:]?\s*$/i;

/** The person's name from the first line of their resume, when that line looks like one; null otherwise. */
export function nameFrom(resume: string): string | null {
  const first = resume.split(/\r?\n/).find((l) => l.trim() !== "")?.trim() ?? "";
  return first && looksLikeName(first) ? first : null;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Text the person wrote themself (their one-line intro, their edits to drafts) as it may go to the model: no
 *  greeting line, nothing from a sign-off on, no line naming a way to reach them, no address, link or phone number,
 *  and not their name, as the resume's first line gives it, nor any word of it (review, 2026-11-21: a sign-off carried
 *  the name and a WeChat id). */
export function withoutContacts(text: string, name: string | null = null): string {
  const lines = text.split(/\r?\n/);
  const end = lines.findIndex((l) => SIGN_OFF.test(l));
  const kept = (end === -1 ? lines : lines.slice(0, end))
    // A greeting only when more follows it: a one-line subject "Hello" is kept
    .filter((l, i) => !(i === lines.findIndex((x) => x.trim() !== "") && GREETING.test(l) && lines.filter((x) => x.trim() !== "").length > 1))
    .filter((l) => !CONTACT_LABEL.test(l));
  let out = kept.join("\n").replace(LINKS, "").replace(PHONES, "");
  const words = (name ?? "").split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) out = out.replace(new RegExp(`(?<![\\p{L}])${escape(w)}(?![\\p{L}])`, "giu"), "");
  return out.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
}

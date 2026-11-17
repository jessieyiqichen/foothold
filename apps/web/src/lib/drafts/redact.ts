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

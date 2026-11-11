// Tags a posting (or a resume) with the skills in the vocabulary. One function for both sides, so a person and a
// role are matched on the same words. No Deno or Node imports.

import { SKILLS } from "./skills.ts";

/** A posting keeps at most this many tags; a text that hits more is too generic to rank by. */
export const MAX_TAGS = 60;

/** A whole word: not glued to a letter or digit on either side ("sql" in "nosql" does not count). */
const whole = (pattern: string, flags: string) => new RegExp(`(?<![A-Za-z0-9])(?:${pattern})(?![A-Za-z0-9])`, flags);

const MATCHERS: { tag: string; re: RegExp }[] = SKILLS.map(([, tag, pattern, flag]) => ({
  tag,
  re: whole(pattern, flag === "cs" ? "" : "i"),
}));

/** The vocabulary tags found in a title and a text, each once, sorted. */
export function tagsOf(title: string | null, text: string | null): string[] {
  const haystack = `${title ?? ""}\n${text ?? ""}`;
  if (haystack.trim().length === 0) return [];
  const found = new Set<string>();
  for (const { tag, re } of MATCHERS) {
    if (!found.has(tag) && re.test(haystack)) found.add(tag);
  }
  return [...found].sort().slice(0, MAX_TAGS);
}

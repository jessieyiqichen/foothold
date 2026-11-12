// The kind of work a person wants (up to three families) and the levels they filter matches by. Skill tags say what
// a person can do, not what job they want (log.md, 2026-11-12), so the person says it, starting from a guess.
import { GROUP_FAMILIES, MAX_FAMILIES, MAX_SUGGESTED_FAMILIES, SUGGESTION_MIN_RATIO, SUGGESTION_MIN_TAGS } from "./constants";
import { PROFILE_COPY } from "./copy";
import { FAMILIES, LEVELS, type Family, type Level } from "./roles";
import { fail, ok, type Result } from "./types";
import { SKILLS } from "./vocabulary";

const FAMILY_IDS: ReadonlySet<string> = new Set(FAMILIES.map((family) => family.id));
const LEVEL_IDS: ReadonlySet<string> = new Set(LEVELS.map((level) => level.id));

const isFamily = (value: unknown): value is Family => typeof value === "string" && FAMILY_IDS.has(value);
const isLevel = (value: unknown): value is Level => typeof value === "string" && LEVEL_IDS.has(value);

/** Families as they are stored and used: known ids only, each once, in the order picked, at most MAX_FAMILIES.
 *  Takes anything, so a row's column (absent on a row from before it existed) can be passed as it comes. */
export function cleanFamilies(value: unknown): Family[] {
  return Array.isArray(value) ? [...new Set(value.filter(isFamily))].slice(0, MAX_FAMILIES) : [];
}

/** Levels as they are stored and used: known ids only, each once, in the order the levels are listed. */
export function cleanLevels(value: unknown): Level[] {
  const picked = new Set(Array.isArray(value) ? value.filter(isLevel) : []);
  return LEVELS.map((level) => level.id).filter((id) => picked.has(id));
}

/** Picks a family or takes it off. A pick past MAX_FAMILIES is refused, with the line to show. */
export function toggleFamily(picked: readonly Family[], family: Family): Result<Family[]> {
  if (picked.includes(family)) return ok(picked.filter((id) => id !== family));
  if (picked.length >= MAX_FAMILIES) return fail(PROFILE_COPY.tooManyFamilies);
  return ok(cleanFamilies([...picked, family]));
}

/** Adds a level to the filter or takes it off. No levels means every level. */
export const toggleLevel = (picked: readonly Level[], level: Level): Level[] =>
  cleanLevels(picked.includes(level) ? picked.filter((id) => id !== level) : [...picked, level]);

/** Whether two picks are the same, whatever their order. */
export const sameChoice = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/** A first guess at the work a person wants, from the vocabulary group of each skill on their profile. A group
 *  counts by the share of its skills the person has, not by how many: engineering has 39 skills and product 5, so a
 *  plain count would call nearly everyone an engineer. A second family is suggested only when it is nearly as strong
 *  as the first. It is only ever a suggestion: nothing is saved until the person confirms. */
export function suggestFamilies(tags: readonly string[], skills: readonly (readonly [group: string, tag: string, ...rest: unknown[]])[] = SKILLS): Family[] {
  const has = new Set(tags);
  const sizes = new Map<Family, { all: Set<string>; mine: Set<string> }>();
  for (const [group, tag] of skills) {
    const family = GROUP_FAMILIES[group];
    if (!family) continue;
    const size = sizes.get(family) ?? { all: new Set<string>(), mine: new Set<string>() };
    size.all.add(tag);
    if (has.has(tag)) size.mine.add(tag);
    sizes.set(family, size);
  }
  const ranked = [...sizes]
    .map(([family, { all, mine }]) => ({ family, count: mine.size, share: mine.size / all.size }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.share - a.share || b.count - a.count);
  const [first, ...rest] = ranked;
  if (!first) return [];
  const close = rest.filter(({ count, share }) => count >= SUGGESTION_MIN_TAGS && share >= first.share * SUGGESTION_MIN_RATIO);
  return [first, ...close].slice(0, MAX_SUGGESTED_FAMILIES).map(({ family }) => family);
}

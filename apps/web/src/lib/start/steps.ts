// The first visit's rules: where a person picks up, what each step starts from, and what the last step says. Each
// Next saves before moving on (the screens do that); everything here is pure.
//
// Where a person picks up is read from the saved profile plus one small mark the browser keeps, because two of the
// steps leave no trace in a column: confirming the skills (the profile row looks the same before and after), and
// having been asked about levels (none picked means every level). The mark names the step just saved and the row's
// `updated_at` after that save, and is trusted only while the row is unchanged, so an edit made elsewhere, or on
// another device, never skips a step wrongly. Without a mark, anyone with a resume and kinds of work counts as done
// (log.md, 2026-11-13: people set up before the wizard skip it).
import { MAX_FAMILIES } from "../profile/constants";
import { suggestFamilies } from "../profile/directions";
import type { Family, Level } from "../profile/roles";
import { effectiveTags, type TagEdits } from "../profile/tagEdits";
import type { Profile } from "../profile/types";
import { SUGGESTED_LEVELS, type Step } from "./constants";
import { foundHeading, START_COPY } from "./copy";

/** The step just saved, and the row's `updated_at` after saving it. */
export interface Mark {
  step: "skills" | "directions" | "levels";
  at: string;
}

const MARK_STEPS: readonly string[] = ["skills", "directions", "levels"];

/** Where the first visit picks up, or "done" when there is nothing left to ask. Never step 5: the number found is
 *  shown, not saved, so coming back after step 4 is done. */
export function resumeStep(profile: Profile | null, mark: Mark | null): Step | "done" {
  if (!profile) return 1;
  const current = mark !== null && mark.at === profile.updatedAt ? mark.step : null;
  if (profile.families.length === 0) return current === "skills" ? 3 : 2;
  return current === "directions" ? 4 : "done";
}

/** The mark as the browser stored it, or null when it is missing or not one. */
export function readMark(raw: string | null): Mark | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { step, at } = value as Record<string, unknown>;
    if (typeof step !== "string" || !MARK_STEPS.includes(step) || typeof at !== "string" || Number.isNaN(Date.parse(at))) return null;
    return { step: step as Mark["step"], at };
  } catch {
    return null;
  }
}

/** The mark to keep after a step was saved on `saved`, the row as the database returned it. */
export const markAfter = (step: Mark["step"], saved: Profile): Mark => ({ step, at: saved.updatedAt });

/** Step 2's chips: every skill the resume yielded or the person added, sorted, each on unless taken off. A skill
 *  taken off stays in its place, off, so a second tap puts it back and nothing on the screen jumps. */
export function skillChips(found: readonly string[], edits: TagEdits): { tag: string; on: boolean }[] {
  const on = new Set(effectiveTags([...found], edits));
  const shown = [...new Set([...found, ...edits.added])].sort();
  return shown.map((tag) => ({ tag, on: on.has(tag) }));
}

/** Step 3 starts from the saved kinds of work, or from the guess made from the skills, said to be a guess. */
export function familiesDraft(profile: Profile): { families: Family[]; suggested: boolean } {
  if (profile.families.length > 0) return { families: [...profile.families], suggested: false };
  const suggestion = suggestFamilies(profile.tags);
  return { families: suggestion, suggested: suggestion.length > 0 };
}

/** Step 3 goes on with one to three kinds of work: the first visit is done once there are some. */
export function checkFamilies(picked: readonly Family[]): string | null {
  return picked.length === 0 || picked.length > MAX_FAMILIES ? START_COPY.pickOne : null;
}

/** Step 4 starts from the saved levels, or the suggestion for someone starting out. */
export function levelsDraft(profile: Profile): { levels: Level[]; suggested: boolean } {
  if (profile.levels.length > 0) return { levels: [...profile.levels], suggested: false };
  return { levels: [...SUGGESTED_LEVELS], suggested: true };
}

/** What step 5 shows for the number of matches: the number, or, for none, a way back to the kinds of work. */
export function foundResult(total: number):
  | { kind: "found"; total: number; heading: string }
  | { kind: "zero"; total: 0; heading: string; backTo: Step } {
  if (total <= 0) return { kind: "zero", total: 0, heading: START_COPY.zeroHeading, backTo: 3 };
  return { kind: "found", total, heading: foundHeading(total) };
}

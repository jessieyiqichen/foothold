import type { Level } from "../profile/roles";

/** The first visit: five steps, one question a screen (user, 2026-11-13, after Nudge's rules). */
export const START_PATH = "/start";
export const STEP_COUNT = 5;
export type Step = 1 | 2 | 3 | 4 | 5;

/** Step 4's suggestion: roles a student can apply to, and roles whose title states no level. Senior and management
 *  are one tap away. */
export const SUGGESTED_LEVELS: Level[] = ["intern", "entry", "unspecified"];

/** Where the browser keeps the person's place in the first visit, one key a person (no column: see steps.ts). */
export const MARK_KEY_PREFIX = "foothold.start.";

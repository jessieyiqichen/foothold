import { formatShortDate } from "./dates";
import type { GoalType } from "./types";

/** Makes the counted noun singular: the first word that is "people" or a plural ending in s. */
export function singular(unit: string): string {
  const words = unit.split(" ");
  const i = words.findIndex((w) => w === "people" || (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")));
  if (i < 0) return unit;
  const one = words[i] === "people" ? "person" : words[i].slice(0, -1);
  return [...words.slice(0, i), one, ...words.slice(i + 1)].join(" ");
}

export function countOf(n: number, unit: string): string {
  return `${n} ${n === 1 ? singular(unit) : unit}`;
}

/** "Send 11 connection requests": what to do, how many. */
export function headline(verb: string, n: number, unit: string): string {
  return verb ? `${verb} ${countOf(n, unit)}` : countOf(n, unit);
}

interface SentenceParts {
  verb: string;
  unit: string;
  type: GoalType;
  /** Null while the number isn't valid yet. */
  target: number | null;
  deadline: string | null;
}

/** The goal in the person's own words: "I want to send 500 connection requests by Dec 1" (no full stop, house style). */
export function goalSentence({ verb, unit, type, target, deadline }: SentenceParts): string {
  if (!verb.trim()) return "I want to \u2026";
  const amount = target === null ? `some ${unit}` : countOf(target, unit);
  const what = `${verb.trim().toLowerCase()} ${amount}`;
  const when = type === "daily" ? "every day" : deadline ? `by ${formatShortDate(deadline)}` : "by a date you pick";
  return `I want to ${what} ${when}`;
}

/** One-tap amounts for "How many did you do?": about a quarter, half, three quarters, and all that's left. */
/** Steps for "Did several at once?": the same small ones every time (2, 3, 5), at most three below what is left, then
 *  all that is left, so the chips read as a pattern, not as arbitrary fractions. */
const STEPS = [2, 3, 5];

export function quickAmounts(left: number): number[] {
  if (left <= 0) return [1, 2, 5];
  return [...STEPS.filter((n) => n < left), left];
}

/** The past of the verbs Nudge's goals use; anything else says "I did one". */
const PAST: Record<string, string> = { send: "sent", message: "messaged", practice: "practiced", write: "wrote", apply: "applied to", make: "made", do: "did", read: "read", call: "called", email: "emailed", submit: "submitted" };

/** "I sent one": the one button that logs, in the task's own words, so it is plain what tapping it means. */
export function didOne(verb: string): string {
  const past = PAST[verb.trim().toLowerCase()];
  return `I ${past ?? "did"} one`;
}

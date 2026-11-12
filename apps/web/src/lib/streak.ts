import { addDays, weekKey } from "./dates";
import { isPaused } from "./quota";
import type { Entry, Goal } from "./types";

export interface Streak {
  days: number;
  /** Missed days forgiven as the week's one rest day. */
  restDays: string[];
}

interface Run {
  /** Days with at least one entry. */
  active: Set<string>;
  /** Days that neither count nor break the run (paused). */
  skip: (date: string) => boolean;
  /** The first day that can count. */
  from: string;
}

/** Walks back from today: active days count, skipped days pass, and the first missed day in a week is a rest day. */
function run({ active, skip, from }: Run, today: string): Streak {
  const restWeeks = new Set<string>();
  const restDays: string[] = [];
  let days = 0;
  for (let d = active.has(today) ? today : addDays(today, -1); d >= from; d = addDays(d, -1)) {
    if (active.has(d)) {
      days += 1;
    } else if (!skip(d)) {
      const week = weekKey(d);
      if (restWeeks.has(week)) break;
      restWeeks.add(week);
      restDays.push(d);
    }
  }
  return { days, restDays };
}

/**
 * Consecutive days with at least one entry. Today only counts once something is logged,
 * paused days are skipped, and the first missed day in each week is a rest day.
 */
export function streak(goal: Goal, entries: Entry[], today: string): Streak {
  const active = new Set(entries.filter((e) => e.goalId === goal.id && e.amount > 0).map((e) => e.date));
  return run({ active, skip: (d) => isPaused(goal, d), from: goal.startDate }, today);
}

/** One streak for the whole app, like Duolingo's: a day counts when any goal got at least one.
 *  A day is skipped only when every goal was paused. */
export function overallStreak(goals: Goal[], entries: Entry[], today: string): Streak {
  if (goals.length === 0) return { days: 0, restDays: [] };
  const ids = new Set(goals.map((g) => g.id));
  const active = new Set(entries.filter((e) => ids.has(e.goalId) && e.amount > 0).map((e) => e.date));
  const from = goals.map((g) => g.startDate).sort()[0];
  return run({ active, skip: (d) => goals.every((g) => isPaused(g, d)), from }, today);
}

export type WeekDayKind = "done" | "rest" | "missed" | "today";

/** The last seven days for the done screen, oldest first, matching overallStreak. */
export function overallWeek(goals: Goal[], entries: Entry[], today: string): { date: string; kind: WeekDayKind }[] {
  const ids = new Set(goals.map((g) => g.id));
  const active = new Set(entries.filter((e) => ids.has(e.goalId) && e.amount > 0).map((e) => e.date));
  const { restDays } = overallStreak(goals, entries, today);
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((date) => ({
    date,
    kind: active.has(date) ? "done" : date === today ? "today" : restDays.includes(date) ? "rest" : "missed",
  }));
}

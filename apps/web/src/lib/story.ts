import { addDays, weekKey } from "./dates";
import { cumulativeSeries } from "./progress";
import type { BowlDay } from "./scene";
import { goalOn } from "./goals";
import type { Entry, Goal } from "./types";

/** A by-date goal told as a road: how far Titi has walked, where the even pace would be, and the milestones. */
export interface RoadStory {
  done: number;
  /** 0 to 1 along the road. */
  at: number;
  /** Where she stood before today's logs, 0 to 1: she walks from here to `at` when the road opens. */
  from: number;
  /** Where the even plan says you'd be by today, 0 to 1. */
  pace: number;
  ahead: boolean;
  milestones: { at: number; reached: boolean }[];
}

const MILESTONES = [0.25, 0.5, 0.75];

export function roadStory(goal: Goal, entries: Entry[], today: string): RoadStory {
  const { plan, actual } = cumulativeSeries(goal, entries, today);
  const done = actual[actual.length - 1]?.value ?? 0;
  // The pace flag stands where the even plan was at the end of yesterday, the same yardstick as "behind by" on Today
  const yesterday = addDays(today, -1);
  const planned = yesterday < goal.startDate ? 0 : (plan.find((p) => p.date === yesterday)?.value ?? plan[plan.length - 1]?.value ?? 0);
  const target = Math.max(goal.target, 1);
  const at = Math.min(done / target, 1);
  const todays = entries.filter((e) => e.goalId === goal.id && e.date === today).reduce((sum, e) => sum + e.amount, 0);
  return {
    done,
    at,
    from: Math.min(Math.max(done - todays, 0) / target, at),
    pace: Math.min(planned / target, 1),
    ahead: done >= planned,
    milestones: MILESTONES.map((m) => ({ at: m, reached: at >= m })),
  };
}

/** A daily goal told as Titi's diary: the last `weeks` calendar weeks, one bowl a day, for this goal alone. */
export function diaryWeeks(goal: Goal, entries: Entry[], today: string, weeks: number): BowlDay[][] {
  const totals = new Map<string, number>();
  for (const e of entries) if (e.goalId === goal.id && e.amount > 0) totals.set(e.date, (totals.get(e.date) ?? 0) + e.amount);
  const thisMonday = weekKey(today);
  return Array.from({ length: weeks }, (_, w) => addDays(thisMonday, -7 * (weeks - 1 - w))).map((monday) =>
    Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((date) => {
      const amount = totals.get(date) ?? 0;
      const future = date > today;
      // Judged by the number the goal had that day, so raising it later does not undo finished days
      return { date, fill: future || amount === 0 ? "empty" : amount >= goalOn(goal, date).target ? "full" : "some", today: date === today, future, before: date < goal.startDate };
    }),
  );
}

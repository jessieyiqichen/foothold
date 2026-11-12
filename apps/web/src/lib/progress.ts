import { addDays, eachDay, formatShortDate } from "./dates";
import { formatCount } from "./format";
import { isPaused, type TodayPlan } from "./quota";
import { streak } from "./streak";
import type { Entry, Goal } from "./types";

export interface Point {
  date: string;
  value: number;
}

function dailyTotals(goal: Goal, entries: Entry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of entries) if (e.goalId === goal.id) totals.set(e.date, (totals.get(e.date) ?? 0) + e.amount);
  return totals;
}

/** For a by-date goal: the even plan from start to deadline, and what was actually done up to today. */
export function cumulativeSeries(goal: Goal, entries: Entry[], today: string): { plan: Point[]; actual: Point[] } {
  const deadline = goal.deadline ?? today;
  const days = eachDay(goal.startDate, deadline);
  const active = days.filter((d) => !isPaused(goal, d));
  let activeSoFar = 0;
  const plan = days.map((date) => {
    if (!isPaused(goal, date)) activeSoFar += 1;
    return { date, value: Math.round((goal.target * activeSoFar) / Math.max(active.length, 1)) };
  });

  const totals = dailyTotals(goal, entries);
  let running = 0;
  const actual = eachDay(goal.startDate, today < deadline ? today : deadline).map((date) => {
    running += totals.get(date) ?? 0;
    return { date, value: running };
  });
  return { plan, actual };
}

export type DayKind = "today" | "done" | "rest" | "paused" | "missed";

export interface HistoryRow {
  date: string;
  amount: number;
  kind: DayKind;
}

/** The last `days` days since the goal started, newest first. */
export function history(goal: Goal, entries: Entry[], today: string, days: number): HistoryRow[] {
  const totals = dailyTotals(goal, entries);
  const { restDays } = streak(goal, entries, today);
  const from = addDays(today, -(days - 1));
  return eachDay(from > goal.startDate ? from : goal.startDate, today)
    .reverse()
    .map((date) => {
      const amount = totals.get(date) ?? 0;
      const kind: DayKind =
        amount > 0 ? "done"
        : date === today ? "today"
        : isPaused(goal, date) ? "paused"
        : restDays.includes(date) ? "rest"
        : "missed";
      return { date, amount, kind };
    });
}

export function withPause(goal: Goal, days: number, today: string): Goal {
  return { ...goal, pauses: [...goal.pauses, { from: today, to: addDays(today, days - 1) }] };
}

export function withoutPause(goal: Goal, today: string): Goal {
  const yesterday = addDays(today, -1);
  const pauses = goal.pauses.flatMap((p) => {
    if (!(p.from <= today && today <= p.to)) return [p];
    return p.from === today ? [] : [{ ...p, to: yesterday }];
  });
  return { ...goal, pauses };
}

/** The sentence under the big number on Progress. It counts what was logged today, so it says the same as Titi's place
 *  on the road: "behind" is the gap left after today's logs, and closing it today says so. */
export function paceLine(goal: Goal, plan: TodayPlan, today: string): string {
  if (plan.status === "complete") return "Goal reached, Titi is proud!";
  if (plan.daysLeft === null) return "";
  const until = formatShortDate(goal.deadline ?? today).replace(" ", "\u00a0");
  const behind = plan.behindBy - plan.doneToday;
  if (behind > 0 && plan.doneToday > 0) return `${behind} behind the steady pace, spread over ${plan.daysLeft} days`;
  if (behind > 0) return `${behind} behind the steady pace, spread over ${plan.daysLeft} days, so today is ${formatCount(plan.quota, goal.unit)}`;
  if (plan.behindBy > 0) return `Caught up today! ${plan.daysLeft} days left until ${until}`;
  return `On pace! ${plan.daysLeft} days left until ${until}`;
}

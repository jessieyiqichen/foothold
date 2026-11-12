import { addDays, daysBetween, weekKey } from "./dates";
import { overallStreak } from "./streak";
import type { Entry, Goal } from "./types";

interface WelcomeInput {
  prevVisit: string | null;
  today: string;
  fromNudge: boolean;
  /** Every goal: the streak and the last active day are for the whole app, like the streak chip. */
  goals: Goal[];
  entries: Entry[];
}

function lastActiveDay(goals: Goal[], entries: Entry[], today: string): string {
  const ids = new Set(goals.map((g) => g.id));
  const days = entries.filter((e) => ids.has(e.goalId) && e.date < today).map((e) => e.date);
  const firstStart = goals.map((g) => g.startDate).sort()[0] ?? today;
  return days.length > 0 ? days.reduce((a, b) => (a > b ? a : b)) : firstStart;
}

/** Back after days away: three or more days since anything was logged, and a visit before today (Titi stretches). The
 *  same count as the "It's been N days" line, so the picture and the words agree. */
export function backAfterDays({ prevVisit, today, goals, entries }: Omit<WelcomeInput, "fromNudge">): boolean {
  if (prevVisit === null || prevVisit >= today) return false;
  return daysBetween(lastActiveDay(goals, entries, today), today) >= 3;
}

/** The line shown at the top when someone comes back. Null when there is nothing to say. */
export function welcomeMessage({ prevVisit, today, fromNudge, goals, entries }: WelcomeInput): string | null {
  if (fromNudge) return "You came back! That's the hardest part";
  if (prevVisit === null || prevVisit >= today) return null;

  const sinceActive = daysBetween(lastActiveDay(goals, entries, today), today);
  const run = overallStreak(goals, entries, today);

  // Short: the headline below already says what to do today.
  if (sinceActive <= 1) return run.days > 1 ? `Welcome back · ${run.days} days in a row!` : "Welcome back · yesterday counted!";
  if (sinceActive === 2) {
    return run.restDays.includes(addDays(today, -1)) && run.days > 0
      ? "Welcome back · yesterday was a rest day"
      : "Welcome back! Fresh start today";
  }
  return `Welcome back! It's been ${sinceActive} days, and that's okay`;
}

/** On the first open of a new week: what last week added up to, for Titi. Null when it isn't the first open or nothing happened. */
export function weekSummary(
  goals: Goal[],
  entries: Entry[],
  today: string,
  { prevVisit, seenFor }: { prevVisit: string | null; seenFor: string | null },
): string | null {
  const monday = weekKey(today);
  // Once a week, remembered by the week it was said for (not by the last visit, which a reminder visit also moves), and
  // never on a first-ever visit
  if (prevVisit === null || seenFor === monday) return null;
  const from = addDays(monday, -7);
  const ids = new Set(goals.map((g) => g.id));
  const last = entries.filter((e) => ids.has(e.goalId) && e.date >= from && e.date < monday && e.amount > 0);
  const fish = last.reduce((sum, e) => sum + e.amount, 0);
  if (fish === 0) return null;
  const days = new Set(last.map((e) => e.date)).size;
  return `Last week: ${fish} fish for Titi over ${days === 1 ? "1 day" : `${days} days`}!`;
}

/** Titi's one-time pointer at the streak chip, on the first visit after a day with something done (never on the first
 *  day), like Week 3's "second week: your streak is here" (reviewer, user 2026-10-19). Null once seen or with no run. */
export function streakTip({ goals, entries, today, seen, days }: { goals: Goal[]; entries: Entry[]; today: string; seen: boolean; days: number }): string | null {
  if (seen || days < 1) return null;
  const ids = new Set(goals.map((g) => g.id));
  const earlier = entries.some((e) => ids.has(e.goalId) && e.date < today);
  return earlier ? `Your streak lives here, ${days} ${days === 1 ? "day" : "days"}!` : null;
}

/** What Titi says first on Today. From a reminder it is always "You came back!", even on a Monday; last week's summary
 *  then waits for the next normal visit (user, 2026-10-19). `summaryFor` is the week to mark as told, when the summary is
 *  what is said. */
export function greeting({
  goals,
  entries,
  today,
  prevVisit,
  fromNudge,
  summarySeenFor,
}: WelcomeInput & { summarySeenFor: string | null }): { text: string | null; summaryFor: string | null } {
  const input = { goals, entries, today, prevVisit, fromNudge };
  if (fromNudge) return { text: welcomeMessage(input), summaryFor: null };
  const summary = weekSummary(goals, entries, today, { prevVisit, seenFor: summarySeenFor });
  if (summary) return { text: summary, summaryFor: weekKey(today) };
  return { text: welcomeMessage(input), summaryFor: null };
}

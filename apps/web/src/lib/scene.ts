import { addDays, weekKey } from "./dates";
import { goalOn } from "./goals";
import { planToday } from "./quota";
import type { BowlFill } from "./session";
import type { Entry, Goal } from "./types";

/** Titi's room: which painting shows depends on the hour, like the nudges that get firmer through the day. */
export type TimeOfDay = "morning" | "dusk" | "night";
export const DUSK_FROM = 16;
export const NIGHT_FROM = 20;
export const MORNING_FROM = 5;

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= MORNING_FROM && hour < DUSK_FROM) return "morning";
  if (hour >= DUSK_FROM && hour < NIGHT_FROM) return "dusk";
  return "night";
}

/** Where things are in the painted scene, as fractions of the image (measured on the staged morning painting). */
export const SCENE = {
  bowlsX: [0.202, 0.305, 0.406, 0.509, 0.61, 0.719, 0.819],
  bowlY: 0.471,
  bowlW: 0.068,
  catX: 0.501,
  catBottom: 0.762,
  catW: 0.4,
  rim: { left: 0.1641, top: 0.7231, width: 0.8372 - 0.1641 },
};

export interface BowlDay {
  date: string;
  fill: BowlFill;
  today: boolean;
  future: boolean;
  /** Before any goal existed: shown dim, never as a miss. */
  before: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function weekdayLetter(iso: string): { letter: string; name: string } {
  const name = DAY_NAMES[new Date(`${iso}T12:00:00Z`).getUTCDay()];
  return { letter: name.charAt(0), name };
}

/** This week's seven bowls: heaped on a day every goal's number was reached, some fish on a day with anything logged. */
export function weekBowls(goals: Goal[], entries: Entry[], today: string): BowlDay[] {
  const monday = weekKey(today);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((date) => {
    const future = date > today;
    const active = goals.filter((g) => g.startDate <= date);
    const before = !future && active.length === 0;
    const plans = active.map((g) => planToday(goalOn(g, date), entries, date));
    const logged = entries.some((e) => e.date === date && e.amount > 0 && active.some((g) => g.id === e.goalId));
    const allDone = plans.length > 0 && plans.every((p) => p.status === "done" || p.status === "complete");
    return { date, fill: future || !logged ? "empty" : allDone ? "full" : "some", today: date === today, future, before };
  });
}

/** The week's bowls in words, "Titi's week, 3 of 7 days": the days this week with at least one done, out of seven, so
 *  the week has a score you can beat (reviewer, user 2026-10-19, after Week 3's "Your week: 5 of 7 days"). */
export function weekLabel(bowls: BowlDay[]): string {
  const done = bowls.filter((b) => !b.future && b.fill !== "empty").length;
  return `Titi's week, ${done} of ${bowls.length} days`;
}

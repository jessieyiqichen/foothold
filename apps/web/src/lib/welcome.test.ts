import { describe, expect, it } from "vitest";
import { backAfterDays, greeting, streakTip, weekSummary, welcomeMessage } from "./welcome";
import type { Entry, Goal } from "./types";

const goal: Goal = {
  id: "g1", verb: "", title: "Send LinkedIn connection requests", unit: "connections", type: "by-date",
  target: 500, deadline: "2026-12-01", link: null, startDate: "2026-10-10", pauses: [], createdAt: "",
};
const on = (...dates: string[]): Entry[] => dates.map((date) => ({ id: date, goalId: "g1", date, amount: 11, at: "" }));
const TODAY = "2026-10-17";

describe("welcomeMessage", () => {
  it("says nothing on the very first visit or a second visit the same day", () => {
    expect(welcomeMessage({ prevVisit: null, today: TODAY, fromNudge: false, goals: [goal], entries: [] })).toBeNull();
    expect(welcomeMessage({ prevVisit: TODAY, today: TODAY, fromNudge: false, goals: [goal], entries: [] })).toBeNull();
  });

  it("thanks you for coming from a reminder", () => {
    expect(welcomeMessage({ prevVisit: TODAY, today: TODAY, fromNudge: true, goals: [goal], entries: [] })).toBe(
      "You came back! That's the hardest part",
    );
  });

  it("celebrates a streak when yesterday was done", () => {
    const msg = welcomeMessage({ prevVisit: "2026-10-16", today: TODAY, fromNudge: false, goals: [goal], entries: on("2026-10-15", "2026-10-16") });
    expect(msg).toBe("Welcome back · 2 days in a row!");
  });

  it("calls a single missed day a rest day", () => {
    const msg = welcomeMessage({ prevVisit: "2026-10-15", today: TODAY, fromNudge: false, goals: [goal], entries: on("2026-10-15") });
    expect(msg).toBe("Welcome back · yesterday was a rest day");
  });

  it("is kind after several missed days and says the shortfall is spread out", () => {
    const msg = welcomeMessage({ prevVisit: "2026-10-13", today: TODAY, fromNudge: false, goals: [goal], entries: on("2026-10-13") });
    expect(msg).toBe("Welcome back! It's been 4 days, and that's okay");
  });

  it("counts the streak across goals, so switching goals keeps it", () => {
    const other: Goal = { ...goal, id: "g2" };
    const entries: Entry[] = [...on("2026-10-15"), { id: "x", goalId: "g2", date: "2026-10-16", amount: 2, at: "" }];
    const msg = welcomeMessage({ prevVisit: "2026-10-16", today: TODAY, fromNudge: false, goals: [goal, other], entries });
    expect(msg).toBe("Welcome back · 2 days in a row!");
  });
});

describe("weekSummary: last week's fish, said once a week", () => {
  // 2026-10-19 is a Monday; Oct 12 to 18 is last week
  const lastWeek = [...on("2026-10-13", "2026-10-15"), { id: "x", goalId: "g1", date: "2026-10-15", amount: 4, at: "" }];
  it("adds up last week's fish and days on the first open of the week", () => {
    expect(weekSummary([goal], lastWeek, "2026-10-19", { prevVisit: "2026-10-18", seenFor: null })).toBe("Last week: 26 fish for Titi over 2 days!");
  });
  it("says it once a week, not on a first-ever visit, and not when last week was empty", () => {
    expect(weekSummary([goal], on("2026-10-13"), "2026-10-20", { prevVisit: "2026-10-19", seenFor: "2026-10-19" })).toBeNull();
    expect(weekSummary([goal], [], "2026-10-19", { prevVisit: "2026-10-18", seenFor: null })).toBeNull();
    expect(weekSummary([goal], on("2026-10-13"), "2026-10-19", { prevVisit: null, seenFor: null })).toBeNull();
  });
  it("still says it on a later open when the week's first open was spent on something else", () => {
    expect(weekSummary([goal], on("2026-10-13"), "2026-10-19", { prevVisit: "2026-10-19", seenFor: "2026-10-12" })).toBe("Last week: 11 fish for Titi over 1 day!");
  });
});

describe("greeting: what Titi says first", () => {
  const base = { goals: [goal], entries: on("2026-10-13", "2026-10-18"), today: "2026-10-19" };
  it("from a reminder on a Monday: \"You came back!\" first, and last week's summary is kept for the next normal visit", () => {
    const nudged = greeting({ ...base, prevVisit: "2026-10-18", fromNudge: true, summarySeenFor: "2026-10-12" });
    expect(nudged).toEqual({ text: "You came back! That's the hardest part", summaryFor: null });
    // the nudge visit moved the last visit to today, but the summary was not said yet
    const next = greeting({ ...base, prevVisit: "2026-10-19", fromNudge: false, summarySeenFor: "2026-10-12" });
    expect(next).toEqual({ text: "Last week: 22 fish for Titi over 2 days!", summaryFor: "2026-10-19" });
    const after = greeting({ ...base, prevVisit: "2026-10-19", fromNudge: false, summarySeenFor: "2026-10-19" });
    expect(after).toEqual({ text: null, summaryFor: null });
  });
});

describe("backAfterDays", () => {
  it("is true after three or more days with nothing logged", () => {
    expect(backAfterDays({ prevVisit: "2026-10-11", today: TODAY, goals: [goal], entries: on("2026-10-11") })).toBe(true);
  });
  it("is false the day after something was logged, and on a first visit", () => {
    expect(backAfterDays({ prevVisit: "2026-10-16", today: TODAY, goals: [goal], entries: on("2026-10-16") })).toBe(false);
    expect(backAfterDays({ prevVisit: null, today: TODAY, goals: [goal], entries: [] })).toBe(false);
  });
});

describe("streakTip: Titi points at the streak once, on the second day", () => {
  it("never on the first day, when there is no earlier day to count", () => {
    expect(streakTip({ goals: [goal], entries: on(TODAY), today: TODAY, seen: false, days: 1 })).toBeNull();
  });
  it("points at the streak once there is an earlier day and the run is alive", () => {
    expect(streakTip({ goals: [goal], entries: on("2026-10-16"), today: TODAY, seen: false, days: 1 })).toBe("Your streak lives here, 1 day!");
    expect(streakTip({ goals: [goal], entries: on("2026-10-16", TODAY), today: TODAY, seen: false, days: 2 })).toBe("Your streak lives here, 2 days!");
  });
  it("only once, and not when the run is broken", () => {
    expect(streakTip({ goals: [goal], entries: on("2026-10-16"), today: TODAY, seen: true, days: 1 })).toBeNull();
    expect(streakTip({ goals: [goal], entries: on("2026-10-10"), today: TODAY, seen: false, days: 0 })).toBeNull();
  });
});

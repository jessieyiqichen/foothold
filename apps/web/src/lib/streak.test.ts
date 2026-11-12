import { describe, expect, it } from "vitest";
import { overallStreak, overallWeek, streak } from "./streak";
import type { Entry, Goal } from "./types";

const goal: Goal = {
  id: "g1", verb: "", title: "Apply to jobs", unit: "applications", type: "daily", target: 10, deadline: null,
  link: null, startDate: "2026-10-01", pauses: [], createdAt: "",
};
const on = (...dates: string[]): Entry[] => dates.map((date) => ({ id: date, goalId: "g1", date, amount: 1, at: "" }));

describe("streak", () => {
  // 2026-10-19 is a Monday; Oct 12–18 is the week before.
  it("counts consecutive days with at least one entry", () => {
    expect(streak(goal, on("2026-10-15", "2026-10-16", "2026-10-17"), "2026-10-17").days).toBe(3);
  });

  it("does not break because today isn't done yet", () => {
    expect(streak(goal, on("2026-10-15", "2026-10-16"), "2026-10-17").days).toBe(2);
  });

  it("forgives one missed day per week as a rest day", () => {
    const result = streak(goal, on("2026-10-14", "2026-10-15", "2026-10-17"), "2026-10-18");
    expect(result.days).toBe(3);
    expect(result.restDays).toEqual(["2026-10-16"]);
  });

  it("breaks on a second missed day in the same week (17, rest on 16, 15, then 14 breaks)", () => {
    expect(streak(goal, on("2026-10-13", "2026-10-15", "2026-10-17"), "2026-10-18").days).toBe(2);
  });

  it("skips paused days", () => {
    const paused = { ...goal, pauses: [{ from: "2026-10-15", to: "2026-10-16" }] };
    expect(streak(paused, on("2026-10-14", "2026-10-17"), "2026-10-17").days).toBe(2);
  });

  it("is zero with nothing logged", () => {
    expect(streak(goal, [], "2026-10-17").days).toBe(0);
  });
});

describe("overallStreak: one streak across every goal, like Duolingo", () => {
  const apps: Goal = { ...goal, id: "g2", title: "Practice", startDate: "2026-10-05" };
  const onGoal = (goalId: string, ...dates: string[]): Entry[] => dates.map((date) => ({ id: goalId + date, goalId, date, amount: 1, at: "" }));

  it("counts a day when any goal got at least one", () => {
    const entries = [...onGoal("g1", "2026-10-15"), ...onGoal("g2", "2026-10-16", "2026-10-17")];
    expect(overallStreak([goal, apps], entries, "2026-10-17").days).toBe(3);
  });

  it("keeps the streak when you finish one goal and switch to the next", () => {
    const entries = [...onGoal("g1", "2026-10-15", "2026-10-16", "2026-10-17")];
    expect(overallStreak([goal, apps], entries, "2026-10-17").days).toBe(3);
  });

  it("forgives one missed day a week, the same as for one goal", () => {
    const entries = onGoal("g2", "2026-10-14", "2026-10-15", "2026-10-17");
    const result = overallStreak([goal, apps], entries, "2026-10-18");
    expect(result.days).toBe(3);
    expect(result.restDays).toEqual(["2026-10-16"]);
  });

  it("skips a day only when every goal was paused", () => {
    const paused = { ...goal, pauses: [{ from: "2026-10-15", to: "2026-10-16" }] };
    const pausedApps = { ...apps, pauses: [{ from: "2026-10-15", to: "2026-10-16" }] };
    expect(overallStreak([paused, pausedApps], onGoal("g1", "2026-10-14", "2026-10-17"), "2026-10-17").days).toBe(2);
    // only one goal paused: those days are ordinary missed days, and the second one in the week breaks the run
    expect(overallStreak([paused, apps], onGoal("g1", "2026-10-14", "2026-10-17"), "2026-10-17").days).toBe(1);
  });

  it("ignores entries of deleted goals and is zero with no goals", () => {
    expect(overallStreak([apps], onGoal("gone", "2026-10-17"), "2026-10-17").days).toBe(0);
    expect(overallStreak([], [], "2026-10-17").days).toBe(0);
  });
});

describe("overallWeek", () => {
  it("marks the last 7 days as done, rest, missed or today, oldest first", () => {
    const entries: Entry[] = on("2026-10-12", "2026-10-13", "2026-10-15", "2026-10-17");
    expect(overallWeek([goal], entries, "2026-10-17").map((d) => d.kind)).toEqual(["missed", "done", "done", "missed", "done", "rest", "done"]);
  });
});

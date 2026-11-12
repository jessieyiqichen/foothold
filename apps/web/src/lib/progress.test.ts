import { describe, expect, it } from "vitest";
import { cumulativeSeries, history, paceLine, withPause, withoutPause } from "./progress";
import type { Entry, Goal } from "./types";

const goal: Goal = {
  id: "g1", verb: "", title: "Send LinkedIn connection requests", unit: "connections", type: "by-date",
  target: 100, deadline: "2026-10-19", link: null, startDate: "2026-10-10", pauses: [], createdAt: "",
};
const on = (date: string, amount: number): Entry => ({ id: `${date}-${amount}`, goalId: "g1", date, amount, at: "" });

describe("cumulativeSeries", () => {
  it("runs the plan line from start to deadline and the actual line up to today", () => {
    const series = cumulativeSeries(goal, [on("2026-10-10", 5), on("2026-10-11", 10)], "2026-10-12");
    expect(series.plan[0]).toEqual({ date: "2026-10-10", value: 10 });
    expect(series.plan[series.plan.length - 1]).toEqual({ date: "2026-10-19", value: 100 });
    expect(series.actual.map((p) => p.value)).toEqual([5, 15, 15]);
  });
});

describe("history", () => {
  it("lists recent days newest first, marking rest, missed and today", () => {
    const rows = history({ ...goal, startDate: "2026-10-12" }, [on("2026-10-13", 3), on("2026-10-15", 4)], "2026-10-16", 14);
    expect(rows.map((r) => [r.date, r.amount, r.kind])).toEqual([
      ["2026-10-16", 0, "today"],
      ["2026-10-15", 4, "done"],
      ["2026-10-14", 0, "rest"],
      ["2026-10-13", 3, "done"],
      ["2026-10-12", 0, "missed"],
    ]);
  });

  it("marks paused days", () => {
    const paused = { ...goal, startDate: "2026-10-14", pauses: [{ from: "2026-10-15", to: "2026-10-15" }] };
    expect(history(paused, [], "2026-10-16", 14).find((r) => r.date === "2026-10-15")?.kind).toBe("paused");
  });
});

describe("pausing", () => {
  it("pauses from today for a number of days", () => {
    expect(withPause(goal, 7, "2026-10-17").pauses).toEqual([{ from: "2026-10-17", to: "2026-10-23" }]);
  });

  it("resumes by ending the current pause yesterday, or dropping it if it started today", () => {
    const started = { ...goal, pauses: [{ from: "2026-10-15", to: "2026-10-23" }] };
    expect(withoutPause(started, "2026-10-17").pauses).toEqual([{ from: "2026-10-15", to: "2026-10-16" }]);
    const today = { ...goal, pauses: [{ from: "2026-10-17", to: "2026-10-23" }] };
    expect(withoutPause(today, "2026-10-17").pauses).toEqual([]);
  });

  it("does not change the original goal", () => {
    const before = JSON.stringify(goal);
    withPause(goal, 3, "2026-10-17");
    expect(JSON.stringify(goal)).toBe(before);
  });
});

describe("paceLine: the sentence under the big number on Progress", () => {
  const plan = { quota: 7, doneToday: 0, leftToday: 7, doneTotal: 2, daysLeft: 22, behindBy: 44, status: "not-started" as const };

  it("says how far behind, and today's number, before anything is logged today", () => {
    expect(paceLine(goal, plan, "2026-10-18")).toBe("44 behind the steady pace, spread over 22 days, so today is 7 connections");
  });

  it("counts what was logged today, so it agrees with Titi's place on the road", () => {
    expect(paceLine(goal, { ...plan, doneToday: 30, status: "done" }, "2026-10-18")).toBe("14 behind the steady pace, spread over 22 days");
    expect(paceLine(goal, { ...plan, doneToday: 44, status: "done" }, "2026-10-18")).toBe("Caught up today! 22 days left until Oct 19");
  });

  it("is on pace, or reached, otherwise", () => {
    expect(paceLine(goal, { ...plan, behindBy: 0 }, "2026-10-18")).toBe("On pace! 22 days left until Oct 19");
    expect(paceLine(goal, { ...plan, status: "complete" }, "2026-10-18")).toBe("Goal reached, Titi is proud!");
  });
});

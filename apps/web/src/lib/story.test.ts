import { describe, expect, it } from "vitest";
import { diaryWeeks, roadStory } from "./story";
import type { Entry, Goal } from "./types";

const road: Goal = { id: "g", verb: "Send", title: "Send connection requests", unit: "connection requests", type: "by-date", target: 100, deadline: "2026-10-31", link: null, startDate: "2026-10-12", pauses: [], createdAt: "" };
const daily: Goal = { ...road, type: "daily", target: 2, deadline: null };
const on = (date: string, amount: number, goalId = "g"): Entry => ({ id: date + amount, goalId, date, amount, at: "" });

describe("roadStory: where Titi stands on the road", () => {
  it("places Titi by what's done, the pace ring by the even plan, and marks milestones passed", () => {
    // Oct 12 to Oct 31 is 20 days; by the end of Oct 16 (day 5 of 20) the even plan is 25
    const s = roadStory(road, [on("2026-10-13", 20), on("2026-10-16", 32)], "2026-10-17");
    expect(s.done).toBe(52);
    expect(s.at).toBeCloseTo(0.52, 2);
    expect(s.pace).toBeCloseTo(0.25, 2);
    expect(s.milestones.map((m) => m.reached)).toEqual([true, true, false]);
    expect(s.ahead).toBe(true);
  });

  it("knows where Titi started today, so she can walk from there to where today's logs took her", () => {
    const s = roadStory(road, [on("2026-10-13", 20), on("2026-10-17", 15), on("2026-10-17", 5)], "2026-10-17");
    expect(s.from).toBeCloseTo(0.2, 2);
    expect(s.at).toBeCloseTo(0.4, 2);
    expect(roadStory(road, [on("2026-10-13", 20)], "2026-10-17").from).toBeCloseTo(0.2, 2);
  });

  it("never goes past the end of the road", () => {
    expect(roadStory(road, [on("2026-10-13", 140)], "2026-10-17").at).toBe(1);
  });
});

describe("diaryWeeks: the last weeks as rows of bowls, for one goal", () => {
  it("fills a bowl when the day got something and heaps it at the daily number", () => {
    // 2026-10-17 is a Saturday
    const weeks = diaryWeeks(daily, [on("2026-10-13", 1), on("2026-10-15", 2), on("2026-10-08", 3)], "2026-10-17", 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[1].map((b) => b.date)[0]).toBe("2026-10-12");
    expect(weeks[1].map((b) => b.fill)).toEqual(["empty", "some", "empty", "full", "empty", "empty", "empty"]);
    expect(weeks[0].map((b) => b.fill)[3]).toBe("full"); // Oct 8
    expect(weeks[1][6].future).toBe(true);
    expect(weeks[1][5].today).toBe(true);
  });

  it("ignores other goals' entries", () => {
    const weeks = diaryWeeks(daily, [on("2026-10-13", 5, "other")], "2026-10-17", 1);
    expect(weeks[0].every((b) => b.fill === "empty")).toBe(true);
  });
});

describe("diaryWeeks after the number was raised", () => {
  it("keeps a day heaped that reached the number it had then", () => {
    const goal = { id: "d", verb: "Send", title: "Send applications", unit: "applications", type: "daily" as const, target: 3, deadline: null, link: null, startDate: "2026-10-12", pauses: [], createdAt: "", history: [{ to: "2026-10-18", target: 2, type: "daily" as const, deadline: null }] };
    const two = (date: string) => ({ id: date, goalId: "d", date, amount: 2, at: "" });
    const weeks = diaryWeeks(goal, [two("2026-10-14"), two("2026-10-19")], "2026-10-19", 2);
    const day = (d: string) => weeks.flat().find((b) => b.date === d)?.fill;
    expect(day("2026-10-14")).toBe("full"); // 2 of the 2 it was then
    expect(day("2026-10-19")).toBe("some"); // 2 of the 3 it is now
  });
});

import { describe, expect, it } from "vitest";
import { timeOfDay, weekBowls, weekdayLetter, weekLabel, type BowlDay } from "./scene";
import type { Entry, Goal } from "./types";

const goal: Goal = { id: "g1", verb: "Send", title: "Send applications", unit: "applications", type: "daily", target: 2, deadline: null, link: null, startDate: "2026-10-05", pauses: [], createdAt: "" };
const on = (date: string, amount: number): Entry => ({ id: date + amount, goalId: "g1", date, amount, at: "" });

describe("timeOfDay", () => {
  it("is morning from 5, dusk from 16, night from 20", () => {
    expect([4, 5, 15, 16, 19, 20, 23].map(timeOfDay)).toEqual(["night", "morning", "morning", "dusk", "dusk", "night", "night"]);
  });
});

describe("weekBowls: the seven bowls on the sill, Monday to Sunday", () => {
  // 2026-10-17 is a Saturday
  it("fills a bowl when a day got something, heaps it when the day's number was reached", () => {
    const bowls = weekBowls([goal], [on("2026-10-12", 2), on("2026-10-13", 1), on("2026-10-17", 2)], "2026-10-17");
    expect(bowls.map((b) => b.date)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(bowls.map((b) => b.fill)).toEqual(["full", "some", "empty", "empty", "empty", "full", "empty"]);
    expect(bowls.map((b) => b.today)).toEqual([false, false, false, false, false, true, false]);
    expect(bowls.map((b) => b.future)).toEqual([false, false, false, false, false, false, true]);
  });

  it("marks the days before the first goal existed as before, not as misses", () => {
    const late: Goal = { ...goal, startDate: "2026-10-15" };
    expect(weekBowls([late], [], "2026-10-17").map((b) => b.before)).toEqual([true, true, true, false, false, false, false]);
  });

  it("names the days by their first letter, with the full name for screen readers", () => {
    expect(weekdayLetter("2026-10-12")).toEqual({ letter: "M", name: "Monday" });
    expect(weekdayLetter("2026-10-18")).toEqual({ letter: "S", name: "Sunday" });
  });
});

describe("weekLabel: the week's bowls in words", () => {
  const day = (fill: BowlDay["fill"], extra: Partial<BowlDay> = {}): BowlDay => ({ date: "2026-10-19", fill, today: false, future: false, before: false, ...extra });
  it("counts the days this week with at least one done, out of seven", () => {
    const week = [day("full"), day("some"), day("empty"), day("full", { today: true }), day("empty", { future: true }), day("empty", { future: true }), day("empty", { future: true })];
    expect(weekLabel(week)).toBe("Titi's week, 3 of 7 days");
  });
  it("says one day in the singular, and an empty week plainly", () => {
    expect(weekLabel([day("some"), ...Array(6).fill(day("empty"))])).toBe("Titi's week, 1 of 7 days");
    expect(weekLabel(Array(7).fill(day("empty")))).toBe("Titi's week, 0 of 7 days");
  });
});

describe("weekBowls after the number was raised", () => {
  it("judges each past day by the number it had then", () => {
    const goal = { id: "d", verb: "Send", title: "Send applications", unit: "applications", type: "daily" as const, target: 3, deadline: null, link: null, startDate: "2026-10-12", pauses: [], createdAt: "", history: [{ to: "2026-10-20", target: 2, type: "daily" as const, deadline: null }] };
    const bowls = weekBowls([goal], [{ id: "a", goalId: "d", date: "2026-10-20", amount: 2, at: "" }], "2026-10-21");
    expect(bowls.find((b) => b.date === "2026-10-20")?.fill).toBe("full");
  });
});

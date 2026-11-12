import { describe, expect, it } from "vitest";
import { bowlFill, doneStats, milestoneLine, sessionLine } from "./session";
import type { Goal } from "./types";

const FULL_STOP = /\.(\s|$)/;

describe("sessionLine: what Titi says while you work", () => {
  it("greets, counts, and gets excited near the end", () => {
    expect(sessionLine(0, 5)).toBe("Ready when you are");
    expect(sessionLine(1, 5)).toBe("First one down!");
    expect(sessionLine(2, 5)).toBe("2 down, 3 to go!");
    expect(sessionLine(4, 5)).toBe("One more and Titi is full!");
  });

  it("tells a first-timer how to log, once, in place", () => {
    expect(sessionLine(0, 5, true)).toBe("Every one you do is a fish for me!");
    expect(sessionLine(1, 5, true)).toBe("First one down!");
  });

  it("never uses a full stop", () => {
    for (let done = 0; done <= 6; done++) expect(sessionLine(done, 6)).not.toMatch(FULL_STOP);
  });
});

describe("bowlFill", () => {
  it("shows an empty, half or full bowl by how far today has come", () => {
    expect(bowlFill(0, 5)).toBe("empty");
    expect(bowlFill(1, 5)).toBe("empty");
    expect(bowlFill(3, 5)).toBe("empty");
    expect(bowlFill(5, 5)).toBe("full");
    expect(bowlFill(1, 1)).toBe("full");
  });
});

describe("doneStats: the two cards on the done screen", () => {
  const byDate: Goal = { id: "g", verb: "Send", title: "Send connection requests", unit: "connection requests", type: "by-date", target: 150, deadline: "2026-11-17", link: null, startDate: "2026-10-10", pauses: [], createdAt: "" };
  const daily: Goal = { ...byDate, type: "daily", target: 3, deadline: null };

  it("leaves today's count to the line above the cards, and shows the road as how many of the whole", () => {
    expect(doneStats(byDate, { doneToday: 5, doneTotal: 56, streakDays: 4 })).toEqual([
      { label: "Streak", value: 4, suffix: "", unit: { one: " day", many: " days" } },
      { label: "So far", value: 56, suffix: " of 150" },
    ]);
  });

  it("shows the all-time total for a daily goal", () => {
    expect(doneStats(daily, { doneToday: 3, doneTotal: 21, streakDays: 1 })).toEqual([
      { label: "Streak", value: 1, suffix: "", unit: { one: " day", many: " days" } },
      { label: "All time", value: 21, suffix: "" },
    ]);
  });
});

describe("milestoneLine: a quarter, half, three quarters of the road", () => {
  const road: Goal = { id: "g", verb: "Send", title: "Send connection requests", unit: "connection requests", type: "by-date", target: 100, deadline: "2026-11-17", link: null, startDate: "2026-10-10", pauses: [], createdAt: "" };
  it("names the milestone today crossed", () => {
    expect(milestoneLine(road, 52, 5)).toBe("Halfway there!");
    expect(milestoneLine(road, 80, 10)).toBe("Three quarters of the road, almost there!");
    expect(milestoneLine(road, 25, 1)).toBe("A quarter of the road done, nice!");
  });
  it("is quiet when nothing was crossed, and for daily goals", () => {
    expect(milestoneLine(road, 40, 5)).toBeNull();
    expect(milestoneLine({ ...road, type: "daily", deadline: null }, 50, 5)).toBeNull();
  });
});

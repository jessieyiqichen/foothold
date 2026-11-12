import { describe, expect, it } from "vitest";
import { calendarNotice, catchUpLine, sessionIsToday } from "./returning";
import type { TodayPlan } from "./quota";

const plan = (over: Partial<TodayPlan>): TodayPlan => ({ quota: 7, doneToday: 0, leftToday: 7, doneTotal: 5, daysLeft: 20, behindBy: 12, status: "not-started", ...over });

describe("sessionIsToday", () => {
  it("keeps a session started today and drops one from yesterday", () => {
    const today = "2026-10-18";
    expect(sessionIsToday({ goalId: "g", startedAt: new Date(2026, 9, 18, 9, 0).toISOString() }, today)).toBe(true);
    expect(sessionIsToday({ goalId: "g", startedAt: new Date(2026, 9, 17, 21, 0).toISOString() }, today)).toBe(false);
    expect(sessionIsToday(null, today)).toBe(false);
  });
});

describe("catchUpLine: why today's number grew", () => {
  it("explains the spread when behind on a by-date goal", () => {
    expect(catchUpLine(plan({}))).toBe("The rest is spread over 20 days, 7 today");
    expect(catchUpLine(plan({ daysLeft: 1 }))).toBe("The rest is due today, 7 to go");
  });
  it("says nothing when on track or for a daily goal", () => {
    expect(catchUpLine(plan({ behindBy: 0 }))).toBeNull();
    expect(catchUpLine(plan({ daysLeft: null, behindBy: 3 }))).toBeNull();
  });
});

describe("calendarNotice: the calendar file runs out", () => {
  it("warns two days before, and after, until it is long gone", () => {
    expect(calendarNotice("2026-10-20", "2026-10-18")).toBe("Your calendar nudges end Oct 20, grab a new file");
    expect(calendarNotice("2026-10-20", "2026-10-17")).toBeNull();
    expect(calendarNotice("2026-10-20", "2026-10-25")).toBe("Your calendar nudges ended Oct 20, grab a new file");
    expect(calendarNotice("2026-10-20", "2026-12-01")).toBeNull();
    expect(calendarNotice(null, "2026-10-18")).toBeNull();
  });
});

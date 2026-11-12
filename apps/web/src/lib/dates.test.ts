import { describe, expect, it } from "vitest";
import { addDays, daysBetween, eachDay, formatShortDate, toISODate, weekKey } from "./dates";

describe("dates", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 9, 17, 23, 30))).toBe("2026-10-17");
  });

  it("adds days across a month boundary", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("counts days between two dates", () => {
    expect(daysBetween("2026-10-17", "2026-12-01")).toBe(45);
    expect(daysBetween("2026-10-17", "2026-10-17")).toBe(0);
  });

  it("lists each day inclusive", () => {
    expect(eachDay("2026-10-30", "2026-11-01")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
  });

  it("groups days into Monday-start weeks", () => {
    expect(weekKey("2026-10-19")).toBe(weekKey("2026-10-25")); // Mon..Sun
    expect(weekKey("2026-10-18")).not.toBe(weekKey("2026-10-19")); // Sun vs Mon
  });

  it("formats a short date", () => {
    expect(formatShortDate("2026-12-01")).toBe("Dec 1");
  });
});

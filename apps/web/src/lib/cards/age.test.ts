import { describe, expect, it } from "vitest";
import { ageLine, daysBetween } from "./age";

const NOW = new Date("2026-11-14T15:00:00Z");

describe("ageLine: how long ago, in words a person would say", () => {
  it("counts days, then weeks, then months, then years", () => {
    expect(ageLine("2026-11-14T09:00:00Z", NOW)).toBe("today");
    expect(ageLine("2026-11-13T09:00:00Z", NOW)).toBe("yesterday");
    expect(ageLine("2026-11-10T09:00:00Z", NOW)).toBe("4 days ago");
    expect(ageLine("2026-11-07T15:00:00Z", NOW)).toBe("1 week ago");
    expect(ageLine("2026-10-24T15:00:00Z", NOW)).toBe("3 weeks ago");
    expect(ageLine("2026-09-01T15:00:00Z", NOW)).toBe("2 months ago");
    expect(ageLine("2025-10-01T15:00:00Z", NOW)).toBe("over a year ago");
  });

  it("says nothing for an unknown or unreadable date, and treats a date ahead of the clock as today", () => {
    expect(ageLine(null, NOW)).toBe("");
    expect(ageLine("soon", NOW)).toBe("");
    expect(ageLine("2026-11-20T00:00:00Z", NOW)).toBe("today");
  });
});

describe("daysBetween", () => {
  it("counts whole days, never below zero", () => {
    expect(daysBetween(new Date("2026-11-01T15:00:00Z"), NOW)).toBe(13);
    expect(daysBetween(new Date("2026-11-20T15:00:00Z"), NOW)).toBe(0);
  });
});

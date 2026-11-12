import { describe, expect, it } from "vitest";
import { addMonth, amountTiers, dateOptions, perDayFor, splitAction, thanksgiving } from "./onboarding";

describe("dates to pick from", () => {
  it("finds US Thanksgiving, the fourth Thursday of November", () => {
    expect(thanksgiving(2026)).toBe("2026-11-26");
    expect(thanksgiving(2027)).toBe("2027-11-25");
  });

  it("moves a month ahead, keeping the day where it can", () => {
    expect(addMonth("2026-10-17")).toBe("2026-11-17");
    expect(addMonth("2026-01-31")).toBe("2026-02-28");
    expect(addMonth("2026-12-05")).toBe("2027-01-05");
  });

  it("offers two weeks, a month and Thanksgiving in recruiting season", () => {
    expect(dateOptions("2026-10-17")).toEqual([
      { key: "2w", label: "In 2 weeks", date: "2026-10-31" },
      { key: "1m", label: "In a month", date: "2026-11-17" },
      { key: "thanksgiving", label: "Before Thanksgiving", date: "2026-11-26" },
    ]);
  });

  it("leaves Thanksgiving out when it is too close, past, or too far", () => {
    expect(dateOptions("2026-11-22").map((o) => o.key)).toEqual(["2w", "1m"]);
    expect(dateOptions("2026-12-10").map((o) => o.key)).toEqual(["2w", "1m"]);
    expect(dateOptions("2026-06-01").map((o) => o.key)).toEqual(["2w", "1m"]);
  });
});

describe("how many", () => {
  it("suggests totals for LinkedIn and small daily numbers elsewhere", () => {
    expect(amountTiers("by-date", "linkedin").map((t) => t.amount)).toEqual([50, 150, 300]);
    expect(amountTiers("daily", "applications").map((t) => t.amount)).toEqual([1, 3, 5]);
    // your own by-date goal: 1, 3 or 5 a day over the days you have (Oct 17 to Dec 15 is 60 days)
    expect(amountTiers("by-date", null, 60).map((t) => t.amount)).toEqual([60, 180, 300]);
    expect(amountTiers("daily", null).map((t) => t.label)).toEqual(["Easy start", "Steady", "Go big"]);
  });

  it("says each choice as a number per day, counting today", () => {
    // Oct 17 to Nov 17 is 32 days
    expect(perDayFor("by-date", 150, "2026-11-17", "2026-10-17")).toBe(5);
    expect(perDayFor("by-date", 50, "2026-11-17", "2026-10-17")).toBe(2);
    expect(perDayFor("daily", 3, "", "2026-10-17")).toBe(3);
  });
});

describe("something else", () => {
  it("splits what you'll do into the action and what you count", () => {
    expect(splitAction("send cold emails")).toEqual({ verb: "Send", unit: "cold emails" });
    expect(splitAction("  Practice   LeetCode problems ")).toEqual({ verb: "Practice", unit: "leetcode problems" });
    expect(splitAction("Read")).toEqual({ verb: "Read", unit: "" });
    expect(splitAction("")).toEqual({ verb: "", unit: "" });
  });
});

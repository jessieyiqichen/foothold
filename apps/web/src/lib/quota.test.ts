import { describe, expect, it } from "vitest";
import { planToday } from "./quota";
import type { Entry, Goal } from "./types";

const TODAY = "2026-10-17";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    verb: "Send",
    title: "Send LinkedIn connection requests",
    unit: "connections",
    type: "by-date",
    target: 500,
    deadline: "2026-12-01",
    link: null,
    startDate: TODAY,
    pauses: [],
    createdAt: `${TODAY}T09:00:00.000Z`,
    ...overrides,
  };
}

function entry(date: string, amount: number): Entry {
  return { id: `${date}-${amount}`, goalId: "g1", date, amount, at: `${date}T12:00:00.000Z` };
}

describe("planToday: by a date", () => {
  it("splits the total over the days left, including today", () => {
    const plan = planToday(goal(), [], TODAY);
    expect(plan.daysLeft).toBe(46);
    expect(plan.quota).toBe(11); // ceil(500 / 46)
    expect(plan.doneToday).toBe(0);
    expect(plan.status).toBe("not-started");
  });

  it("counts today's entries and marks the day started", () => {
    const plan = planToday(goal(), [entry(TODAY, 1)], TODAY);
    expect(plan.doneToday).toBe(1);
    expect(plan.leftToday).toBe(10);
    expect(plan.status).toBe("started");
  });

  it("is done once today's quota is met", () => {
    expect(planToday(goal(), [entry(TODAY, 11)], TODAY).status).toBe("done");
  });

  it("does not let today's work change today's quota", () => {
    expect(planToday(goal(), [entry(TODAY, 30)], TODAY).quota).toBe(11);
  });

  it("raises the quota after a short day and says by how much", () => {
    const g = goal({ startDate: "2026-10-16", target: 470, deadline: "2026-11-30" });
    // 46 days from Oct 16 to Nov 30 → plan of ~10.2/day; nothing done yesterday.
    const plan = planToday(g, [], TODAY);
    expect(plan.quota).toBe(11); // ceil(470 / 45)
    expect(plan.behindBy).toBeGreaterThan(0);
  });

  it("is complete when the target is reached", () => {
    expect(planToday(goal({ target: 5 }), [entry(TODAY, 5)], TODAY).status).toBe("complete");
  });

  it("reports a passed deadline", () => {
    const plan = planToday(goal({ startDate: "2026-09-01", deadline: "2026-10-01" }), [], TODAY);
    expect(plan.status).toBe("deadline-passed");
    expect(plan.daysLeft).toBe(0);
  });

  it("skips paused days and is paused today when inside a pause", () => {
    const g = goal({ pauses: [{ from: TODAY, to: "2026-10-19" }] });
    const plan = planToday(g, [], TODAY);
    expect(plan.status).toBe("paused");
    expect(plan.daysLeft).toBe(43);
  });
});

describe("planToday: every day", () => {
  it("uses the daily target as the quota", () => {
    const g = goal({ type: "daily", target: 3, deadline: null, unit: "applications" });
    const plan = planToday(g, [entry(TODAY, 1)], TODAY);
    expect(plan.quota).toBe(3);
    expect(plan.leftToday).toBe(2);
    expect(plan.status).toBe("started");
    expect(plan.daysLeft).toBeNull();
  });
});

describe("sortByUrgency", () => {
  it("keeps a started goal on top, then not started, then done", async () => {
    const { sortByUrgency } = await import("./quota");
    const a = goal({ id: "a" });
    const b = goal({ id: "b" });
    const c = goal({ id: "c" });
    const entries = [
      { ...entry(TODAY, 11), goalId: "a" }, // done
      { ...entry(TODAY, 2), goalId: "b" }, // started
    ];
    expect(sortByUrgency([a, b, c], entries, TODAY).map((g) => g.goal.id)).toEqual(["b", "c", "a"]);
  });
});

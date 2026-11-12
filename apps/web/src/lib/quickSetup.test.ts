import { describe, expect, it } from "vitest";
import { FIRST_PICKS, resolveSetup, type Picks } from "./quickSetup";

const today = "2026-10-18";

describe("resolveSetup: the one-screen first visit", () => {
  it("is ready to start from the first screen: LinkedIn, in a month, steady", () => {
    const r = resolveSetup(FIRST_PICKS, today);
    expect(r.type).toBe("by-date");
    expect(r.deadline).toBe("2026-11-18");
    expect(r.tiers.map((t) => t.amount)).toEqual([50, 150, 300]);
    expect(r.perDay).toBe(5); // 150 over the 32 days from Oct 18 to Nov 18
    expect(r.goal).toMatchObject({ verb: "Send", unit: "connection requests", target: 150, deadline: "2026-11-18" });
    expect(r.errors).toEqual({});
  });

  it("asks no date for a daily goal, and its tiers are a day's number", () => {
    const r = resolveSetup({ ...FIRST_PICKS, starter: "applications", tier: 0 }, today);
    expect(r.type).toBe("daily");
    expect(r.deadline).toBe("");
    expect(r.perDay).toBe(1);
    expect(r.goal).toMatchObject({ verb: "Send", unit: "applications", target: 1, deadline: null });
  });

  it("takes a goal of your own, and says what is missing beside the right field", () => {
    const own: Picks = { ...FIRST_PICKS, starter: "own", ownType: "daily", ownText: "" };
    expect(resolveSetup(own, today).errors.what).toBe('Enter what you\'ll do, like "Send cold emails"');
    expect(resolveSetup(own, today).goal).toBeNull();
    const done = resolveSetup({ ...own, ownText: "write cover letters", tier: "own", ownAmount: "2" }, today);
    expect(done.goal).toMatchObject({ verb: "Write", unit: "cover letters", target: 2 });
  });

  it("checks a typed number and a picked date, with examples that fit", () => {
    expect(resolveSetup({ ...FIRST_PICKS, tier: "own", ownAmount: "lots" }, today).errors.amount).toBe("Enter a whole number, like 150");
    expect(resolveSetup({ ...FIRST_PICKS, starter: "interview", tier: "own", ownAmount: "lots" }, today).errors.amount).toBe("Enter a whole number, like 3");
    expect(resolveSetup({ ...FIRST_PICKS, starter: "interview", tier: "own", ownAmount: "0" }, today).errors.amount).toBe("Enter a number above 0, like 3");
    expect(resolveSetup({ ...FIRST_PICKS, when: "pick", pickedDate: "" }, today).errors.date).toBe("Pick the date you want to finish by");
    expect(resolveSetup({ ...FIRST_PICKS, when: "pick", pickedDate: "2026-10-18" }, today).errors.date).toBe("Pick a date after today");
  });
});

describe("resolveSetup: where job applications are made", () => {
  it("offers recruiting sites for job applications, LinkedIn Jobs picked first, and none at all", () => {
    const r = resolveSetup({ ...FIRST_PICKS, starter: "applications" }, today);
    expect(r.sites.map((s) => s.label)).toEqual(["LinkedIn Jobs", "Handshake", "Indeed", "No site"]);
    expect(r.goal?.link).toBe("https://www.linkedin.com/jobs/");
    expect(resolveSetup({ ...FIRST_PICKS, starter: "applications", site: "handshake" }, today).goal?.link).toBe("https://app.joinhandshake.com/");
    expect(resolveSetup({ ...FIRST_PICKS, starter: "applications", site: "none" }, today).goal?.link).toBeNull();
  });

  it("asks no site for the others", () => {
    expect(resolveSetup(FIRST_PICKS, today).sites).toEqual([]);
  });
});

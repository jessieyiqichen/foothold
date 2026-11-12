import { describe, expect, it } from "vitest";
import { parseCount } from "./validate";

describe("parseCount", () => {
  it("accepts whole numbers with spaces around them", () => {
    expect(parseCount(" 8 ")).toEqual({ ok: true, value: 8 });
  });

  it("asks for a number when empty or not a whole number", () => {
    for (const text of ["", "abc", "2.5", "-3"]) {
      expect(parseCount(text)).toEqual({ ok: false, error: "Enter a whole number, like 5" });
    }
  });

  it("says what is wrong with 0: it is a whole number, but nothing to log (first-run check 2)", () => {
    expect(parseCount("0")).toEqual({ ok: false, error: "Enter a number above 0, like 5" });
  });

  it("caps very large numbers", () => {
    expect(parseCount("5000")).toEqual({ ok: false, error: "That's a lot! Enter a number up to 1,000" });
  });
});

describe("parseTime", () => {
  it("accepts HH:MM", async () => {
    const { parseTime } = await import("./validate");
    expect(parseTime("09:30")).toEqual({ ok: true, value: "09:30" });
  });

  it("asks for a time when empty or malformed", async () => {
    const { parseTime } = await import("./validate");
    expect(parseTime("")).toEqual({ ok: false, error: "Enter a time, like 20:00" });
    expect(parseTime("25:00")).toEqual({ ok: false, error: "Enter a time, like 20:00" });
  });
});

describe("validateGoal", () => {
  const today = "2026-10-17";
  const draft = {
    verb: "Send",
    unit: "connection requests",
    type: "by-date" as const,
    target: "500",
    deadline: "2026-12-01",
    link: "https://www.linkedin.com/mynetwork/",
  };

  it("accepts a complete goal and builds its title", async () => {
    const { validateGoal } = await import("./validate");
    const result = validateGoal({ ...draft, verb: "  send ", unit: " Connection Requests " }, today);
    expect(result.errors).toEqual({});
    expect(result.value).toEqual({
      verb: "Send", unit: "connection requests", title: "Send connection requests", type: "by-date", target: 500,
      deadline: "2026-12-01", link: "https://www.linkedin.com/mynetwork/",
    });
  });

  it("counts times when nothing is named", async () => {
    const { validateGoal } = await import("./validate");
    expect(validateGoal({ ...draft, verb: "Go running", unit: "" }, today).value?.unit).toBe("times");
  });

  it("says what to do next for each field", async () => {
    const { validateGoal } = await import("./validate");
    const result = validateGoal({ ...draft, verb: " ", target: "lots", deadline: "2026-10-17", link: "linkedin.com" }, today);
    expect(result.errors).toEqual({
      verb: 'Enter what you\'ll do, like "Send" or "Practice"',
      target: "Enter a whole number, like 100",
      deadline: "Pick a date after today",
      link: "Paste a full link that starts with https://",
    });
    expect(result.value).toBeNull();
  });

  it("asks for a deadline only on by-date goals", async () => {
    const { validateGoal } = await import("./validate");
    expect(validateGoal({ ...draft, deadline: "" }, today).errors.deadline).toBe("Pick the date you want to finish by");
    const daily = validateGoal({ ...draft, type: "daily", target: "10", deadline: "" }, today);
    expect(daily.errors).toEqual({});
    expect(daily.value?.deadline).toBeNull();
  });

  it("leaves the link optional", async () => {
    const { validateGoal } = await import("./validate");
    expect(validateGoal({ ...draft, link: "" }, today).value?.link).toBeNull();
  });

  it("caps long words and huge targets", async () => {
    const { validateGoal } = await import("./validate");
    const result = validateGoal({ ...draft, verb: "x".repeat(41), unit: "y".repeat(41), target: "100001" }, today);
    expect(result.errors.verb).toBe("Keep it under 40 characters");
    expect(result.errors.unit).toBe("Keep it under 40 characters");
    expect(result.errors.target).toBe("Enter a number up to 100,000");
  });
});

describe("dailyPreview", () => {
  it("shows the daily number for a by-date goal", async () => {
    const { dailyPreview } = await import("./validate");
    expect(dailyPreview("500", "2026-12-01", "connections", "2026-10-17")).toEqual({ perDay: 11, message: "That's about 11 connections a day!" });
  });

  it("warns softly when the pace is very high", async () => {
    const { dailyPreview } = await import("./validate");
    expect(dailyPreview("500", "2026-10-22", "connections", "2026-10-17")?.message).toBe(
      "That's 84 connections a day, that's a lot! Pick a later date or a smaller number?",
    );
  });

  it("stays quiet until both numbers make sense", async () => {
    const { dailyPreview } = await import("./validate");
    expect(dailyPreview("", "2026-12-01", "connections", "2026-10-17")).toBeNull();
    expect(dailyPreview("500", "2026-10-01", "connections", "2026-10-17")).toBeNull();
  });
});

describe("a goal's number of 0", () => {
  it("asks for a number above 0, with an example the size of the goal", async () => {
    const { validateGoal } = await import("./validate");
    const result = validateGoal({ verb: "Send", unit: "applications", type: "daily", target: "0", deadline: "", link: "" }, "2026-10-19");
    expect(result.errors.target).toBe("Enter a number above 0, like 3");
  });
});

import { describe, expect, it } from "vitest";
import { ROUND_SIZE } from "./constants";
import { cardPosition, doneLine, localDayStart, remainingInRound, roundDone, tally } from "./day";

describe("localDayStart: today begins at midnight where the person is", () => {
  it("is midnight of the given moment in the browser's own time zone", () => {
    const now = new Date(2026, 10, 14, 23, 30);
    expect(localDayStart(now)).toEqual(new Date(2026, 10, 14, 0, 0, 0, 0));
  });
});

describe("cardPosition: Card N of 5", () => {
  it("is the decisions made today plus one, out of the next multiple of five", () => {
    expect(ROUND_SIZE).toBe(5);
    expect(cardPosition(0)).toEqual({ n: 1, of: 5 });
    expect(cardPosition(4)).toEqual({ n: 5, of: 5 });
    expect(cardPosition(5)).toEqual({ n: 6, of: 10 });
    expect(cardPosition(7)).toEqual({ n: 8, of: 10 });
  });
});

describe("remainingInRound: how many cards to ask for", () => {
  it("is what is left of the current five", () => {
    expect(remainingInRound(0)).toBe(5);
    expect(remainingInRound(2)).toBe(3);
    expect(remainingInRound(5)).toBe(5);
  });
});

describe("roundDone: the done screen after each five", () => {
  it("shows after the fifth decision of a round, until the person asks for five more", () => {
    expect(roundDone(0, null)).toBe(false);
    expect(roundDone(3, null)).toBe(false);
    expect(roundDone(5, null)).toBe(true);
    expect(roundDone(5, 5)).toBe(false);
    expect(roundDone(10, 5)).toBe(true);
  });
});

describe("tally and doneLine", () => {
  const decisions = ["saved", "saved", "reached_out", "skipped", "skipped"] as const;

  it("counts each kind of decision", () => {
    expect(tally([...decisions])).toEqual({ saved: 2, reached_out: 1, skipped: 2, total: 5 });
  });

  it("says what the person did, outreach first and skips left out", () => {
    expect(doneLine(tally([...decisions]))).toBe("Today's done: you saved 2 and reached out to 1");
    expect(doneLine(tally(["saved"]))).toBe("Today's done: you saved 1");
    expect(doneLine(tally(["reached_out", "reached_out"]))).toBe("Today's done: you reached out to 2");
    expect(doneLine(tally(["skipped", "skipped"]))).toBe("Today's done: you looked at 2 companies");
  });
});

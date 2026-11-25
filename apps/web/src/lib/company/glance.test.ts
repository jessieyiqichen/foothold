import { describe, expect, it } from "vitest";
import type { Signals } from "../signals/types";
import { glanceCells, MAX_GLANCE } from "./glance";

const NOW = new Date("2026-11-23T12:00:00Z");
const all: Signals = {
  years: { min: 3, required: true, needs: true, quote: "3+ years" },
  visa: { value: "sponsors", quote: "We sponsor" },
  equity: { quote: "Equity" },
  k401: { quote: "401(k)" },
  salary: { min: 1, max: 2, currency: "USD", period: "year", ote: false, quote: "pay" },
};

describe("glanceCells: short words, no quotes", () => {
  it("gives years, visa, equity, 401(k) and the age, in that order", () => {
    expect(glanceCells(all, "2026-11-14T12:00:00Z", NOW)).toEqual([
      { key: "years", label: "3+ years" },
      { key: "visa", label: "Sponsors visas" },
      { key: "equity", label: "Equity" },
      { key: "k401", label: "401(k)" },
      { key: "posted", label: "Posted 1 week ago" },
    ]);
  });

  it("says preferred years as preferred", () => {
    expect(glanceCells({ years: { min: 2, required: false, needs: false, quote: "q" } }, null, NOW)).toEqual([{ key: "years", label: "2+ years preferred" }]);
  });

  it("names each visa answer", () => {
    expect(glanceCells({ visa: { value: "no_sponsorship", quote: "q" } }, null, NOW)[0]?.label).toBe("No visa sponsorship");
    expect(glanceCells({ visa: { value: "citizens_only", quote: "q" } }, null, NOW)[0]?.label).toBe("US citizens only");
  });

  it("leaves out each unknown, and is empty with nothing known", () => {
    expect(glanceCells(undefined, null, NOW)).toEqual([]);
    expect(glanceCells({}, "not a date", NOW)).toEqual([]);
  });

  it("never gives more than the cap", () => {
    expect(glanceCells(all, "2026-11-14T12:00:00Z", NOW).length).toBeLessThanOrEqual(MAX_GLANCE);
  });
});

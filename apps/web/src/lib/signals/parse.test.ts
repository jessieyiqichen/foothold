import { describe, expect, it } from "vitest";
import { readSignals } from "./parse";

const FULL = {
  years: { min: 4, required: true, quote: "4+ years of product experience." },
  salary: { min: 120000, max: 160000, currency: "USD", period: "year", ote: false, quote: "The range is $120,000 - $160,000." },
  visa: { value: "sponsors", quote: "We sponsor H-1B visas." },
  equity: { quote: "Competitive salary and equity." },
  k401: { quote: "401(k) with a 4% match." },
};

describe("readSignals: the signals jsonb, checked at the boundary", () => {
  it("reads every signal of a well-formed answer", () => {
    expect(readSignals(FULL)).toEqual({
      years: { min: 4, required: true, needs: true, quote: "4+ years of product experience." },
      salary: { min: 120000, max: 160000, currency: "USD", period: "year", ote: false, quote: "The range is $120,000 - $160,000." },
      visa: { value: "sponsors", quote: "We sponsor H-1B visas." },
      equity: { quote: "Competitive salary and equity." },
      k401: { quote: "401(k) with a 4% match." },
    });
  });

  it("is null when there are no signals: missing, null, empty, not an object", () => {
    for (const value of [undefined, null, {}, [], "signals", 4, true, [FULL]]) expect(readSignals(value), String(value)).toBeNull();
  });

  it("drops one malformed signal and keeps the rest", () => {
    const signals = readSignals({ ...FULL, visa: { value: "maybe", quote: "We might sponsor." }, equity: { quote: "" } });
    expect(signals && Object.keys(signals)).toEqual(["years", "salary", "k401"]);
  });

  it("never keeps a value without a quote, or with a quote past 400 characters", () => {
    expect(readSignals({ equity: true })).toBeNull();
    expect(readSignals({ k401: {} })).toBeNull();
    expect(readSignals({ years: { min: 4, required: true } })).toBeNull();
    expect(readSignals({ equity: { quote: "x".repeat(401) } })).toBeNull();
    expect(readSignals({ equity: { quote: "   " } })).toBeNull();
    expect(readSignals({ equity: { quote: "  Equity.  " } })).toEqual({ equity: { quote: "Equity." } });
  });

  it("reads years only as a sane whole number with required true or false", () => {
    expect(readSignals({ years: { ...FULL.years, min: 0 } })).toBeNull();
    expect(readSignals({ years: { ...FULL.years, min: 2.5 } })).toBeNull();
    expect(readSignals({ years: { ...FULL.years, min: 99 } })).toBeNull();
    expect(readSignals({ years: { ...FULL.years, min: "4" } })).toBeNull();
    expect(readSignals({ years: { ...FULL.years, required: "yes" } })).toBeNull();
    expect(readSignals({ years: { ...FULL.years, required: false } })?.years).toMatchObject({ required: false, needs: false });
  });

  it("reads a salary floor, a ceiling or both, never neither nor an upside-down range", () => {
    const s = FULL.salary;
    expect(readSignals({ salary: { ...s, max: null } })?.salary).toMatchObject({ min: 120000, max: null });
    expect(readSignals({ salary: { ...s, min: null } })?.salary).toMatchObject({ min: null, max: 160000 });
    expect(readSignals({ salary: { ...s, max: undefined } })?.salary).toMatchObject({ min: 120000, max: null });
    expect(readSignals({ salary: { ...s, min: null, max: null } })).toBeNull();
    expect(readSignals({ salary: { ...s, min: 200000, max: 100000 } })).toBeNull();
    expect(readSignals({ salary: { ...s, min: -5 } })).toBeNull();
    expect(readSignals({ salary: { ...s, min: Number.NaN } })).toBeNull();
  });

  it("reads a salary only with a three-letter currency and a year or an hour", () => {
    const s = FULL.salary;
    expect(readSignals({ salary: { ...s, currency: "usd" } })).toBeNull();
    expect(readSignals({ salary: { ...s, currency: "DOLLARS" } })).toBeNull();
    expect(readSignals({ salary: { ...s, period: "month" } })).toBeNull();
    expect(readSignals({ salary: { ...s, period: "hour", min: 40, max: 60 } })?.salary?.period).toBe("hour");
  });

  it("reads OTE when it says so, and as not OTE when the key is missing", () => {
    expect(readSignals({ salary: { ...FULL.salary, ote: true } })?.salary?.ote).toBe(true);
    const noOte = Object.fromEntries(Object.entries(FULL.salary).filter(([key]) => key !== "ote"));
    expect(readSignals({ salary: noOte })?.salary?.ote).toBe(false);
    expect(readSignals({ salary: { ...FULL.salary, ote: "yes" } })).toBeNull();
  });

  it("reads the three visa values and nothing else", () => {
    for (const value of ["sponsors", "no_sponsorship", "citizens_only"]) {
      expect(readSignals({ visa: { value, quote: "q" } })?.visa?.value).toBe(value);
    }
    expect(readSignals({ visa: { value: "not_citizens_only", quote: "q" } })).toBeNull();
  });

  it("leaves out keys it does not know", () => {
    expect(readSignals({ hours: { quote: "Long hours." }, equity: FULL.equity })).toEqual({ equity: FULL.equity });
  });
});

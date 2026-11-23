import { describe, expect, it } from "vitest";
import { readSignals } from "./parse";
import { hidesYearsByDefault, money, quoteLine, salaryLabel, signalItems, signalTone, yearsLabel } from "./format";
import type { Salary, Signals } from "./types";

const salary = (over: Partial<Salary>): Salary => ({ min: 120000, max: 160000, currency: "USD", period: "year", ote: false, quote: "q", ...over });

describe("yearsLabel", () => {
  it("says years the role needs as a need, fewer required years plainly, and a preference as a preference", () => {
    expect(yearsLabel({ min: 4, required: true, needs: true, quote: "q" })).toBe("Needs 4+ years");
    expect(yearsLabel({ min: 2, required: true, needs: false, quote: "q" })).toBe("2+ years experience");
    expect(yearsLabel({ min: 3, required: false, needs: false, quote: "q" })).toBe("Prefers 3+ years");
  });
});

describe("required years: a warning only from 3 years, as the server sorts and hides (0 to 2 is new grad)", () => {
  const line = (min: number, required = true, needsYears?: unknown) => signalItems(readSignals({ years: { min, required, quote: "q" } }, needsYears))[0];
  it("reads 1 and 2 required years as plain, 3 as a need", () => {
    expect(line(1)).toMatchObject({ label: "1+ years experience", warn: false });
    expect(line(2)).toMatchObject({ label: "2+ years experience", warn: false });
    expect(line(3)).toMatchObject({ label: "Needs 3+ years", warn: true });
    expect(line(3, false)).toMatchObject({ label: "Prefers 3+ years", warn: false });
  });
  it("prefers the row's needs_years when it is there, and falls back to the rule when it is not a boolean", () => {
    expect(line(2, true, true)).toMatchObject({ label: "Needs 2+ years", warn: true });
    expect(line(5, true, false)).toMatchObject({ label: "5+ years experience", warn: false });
    expect(line(5, true, null)).toMatchObject({ warn: true });
    expect(line(2, true, "yes")).toMatchObject({ warn: false });
  });
});

describe("salaryLabel", () => {
  it("writes a yearly range in thousands", () => {
    expect(salaryLabel(salary({}))).toBe("$120k–$160k");
    expect(salaryLabel(salary({ min: 152500, max: 185000 }))).toBe("$152.5k–$185k");
    expect(salaryLabel(salary({ min: 900000, max: 1000000 }))).toBe("$900k–$1M");
  });
  it("writes a floor, a ceiling and one amount", () => {
    expect(salaryLabel(salary({ max: null }))).toBe("From $120k");
    expect(salaryLabel(salary({ min: null }))).toBe("Up to $160k");
    expect(salaryLabel(salary({ max: 120000 }))).toBe("$120k");
  });
  it("writes an hourly rate as an hourly rate", () => {
    expect(salaryLabel(salary({ min: 40, max: 62.5, period: "hour" }))).toBe("$40–$62.50 an hour");
    expect(salaryLabel(salary({ min: 45, max: null, period: "hour" }))).toBe("From $45 an hour");
  });
  it("names other currencies by their sign or their code", () => {
    expect(salaryLabel(salary({ currency: "GBP", min: 60000, max: 80000 }))).toBe("£60k–£80k");
    expect(salaryLabel(salary({ currency: "EUR", min: 60000, max: null }))).toBe("From €60k");
    expect(salaryLabel(salary({ currency: "INR", min: 1200000, max: null }))).toBe("From INR 1.2M");
  });
  it("marks on-target earnings", () => {
    expect(salaryLabel(salary({ ote: true }))).toBe("$120k–$160k OTE");
  });
});

describe("money", () => {
  it("rounds to one decimal in thousands and millions, keeps small amounts whole", () => {
    expect(money(125499, "year")).toBe("125.5k");
    expect(money(999, "year")).toBe("999");
    expect(money(1250000, "year")).toBe("1.25M");
    expect(money(40, "hour")).toBe("40");
    expect(money(40.5, "hour")).toBe("40.50");
  });
});

describe("signalItems: one short line per role", () => {
  const all: Signals = {
    years: { min: 4, required: true, needs: true, quote: "4+ years of experience." },
    salary: salary({ quote: "$120,000 - $160,000" }),
    visa: { value: "sponsors", quote: "We sponsor visas." },
    equity: { quote: "Meaningful equity." },
    k401: { quote: "401(k) matching." },
  };

  it("lists the signals in a fixed order, each with its quote", () => {
    expect(signalItems(all).map((item) => [item.key, item.label, item.quote])).toEqual([
      ["years", "Needs 4+ years", "4+ years of experience."],
      ["salary", "$120k–$160k", "$120,000 - $160,000"],
      ["visa", "Sponsors visas", "We sponsor visas."],
      ["equity", "Equity", "Meaningful equity."],
      ["k401", "401(k)", "401(k) matching."],
    ]);
  });

  it("names the three visa values in plain words", () => {
    expect(signalItems({ visa: { value: "no_sponsorship", quote: "q" } })[0].label).toBe("No visa sponsorship");
    expect(signalItems({ visa: { value: "citizens_only", quote: "q" } })[0].label).toBe("US citizens only");
  });

  it("is empty with no signals", () => {
    expect(signalItems(null)).toEqual([]);
    expect(signalItems(undefined)).toEqual([]);
    expect(signalItems({})).toEqual([]);
  });

  it("marks only years the role needs as a warning; preferred years are plain", () => {
    expect(signalItems(all)[0].warn).toBe(true);
    expect(signalItems(all).slice(1).every((item) => !item.warn)).toBe(true);
    expect(signalItems({ years: { min: 5, required: false, needs: false, quote: "q" } })[0].warn).toBe(false);
  });
});

describe("signalTone", () => {
  it("is a warning only when the role needs years, not for fewer required years or a preference", () => {
    expect(signalTone({ years: { min: 4, required: true, needs: true, quote: "q" } })).toBe("warn");
    expect(signalTone({ years: { min: 2, required: true, needs: false, quote: "q" } })).toBe("plain");
    expect(signalTone({ years: { min: 4, required: false, needs: false, quote: "q" } })).toBe("plain");
    expect(signalTone({ equity: { quote: "q" } })).toBe("plain");
    expect(signalTone(null)).toBe("plain");
  });
});

describe("quoteLine", () => {
  it("says where the sentence comes from, in curly quotes", () => {
    expect(quoteLine("We sponsor visas.")).toBe("From the posting: “We sponsor visas.”");
  });
});

describe("hidesYearsByDefault: the server's default for the years filter", () => {
  it("is on for intern or entry profiles without senior or management", () => {
    expect(hidesYearsByDefault(["intern"])).toBe(true);
    expect(hidesYearsByDefault(["entry", "unspecified"])).toBe(true);
    expect(hidesYearsByDefault(["entry", "senior"])).toBe(false);
    expect(hidesYearsByDefault(["intern", "management"])).toBe(false);
    expect(hidesYearsByDefault(["unspecified"])).toBe(false);
    expect(hidesYearsByDefault([])).toBe(false);
  });
});

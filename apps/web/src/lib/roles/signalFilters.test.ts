import { describe, expect, it } from "vitest";
import {
  clearedSignals, DEFAULT_SIGNAL_FILTERS, effectiveHideYears, parseSignalFilters, salaryChoiceLabel, salaryTrigger, signalArgs,
  signalChips, signalNarrowing, visaTrigger, withHideYears, writeSignalFilters, type SignalFilters,
} from "./signalFilters";

const parse = (query: string) => parseSignalFilters(new URLSearchParams(query));
const write = (filters: SignalFilters) => {
  const params = new URLSearchParams();
  writeSignalFilters(params, filters);
  return params.toString();
};
const EARLY = ["intern", "entry"];
const LATE = ["entry", "senior"];

describe("parseSignalFilters and writeSignalFilters: shareable in the URL", () => {
  it("reads no keys as the defaults, and writes the defaults as nothing", () => {
    expect(parse("")).toEqual(DEFAULT_SIGNAL_FILTERS);
    expect(DEFAULT_SIGNAL_FILTERS).toEqual({ hideYears: null, visa: null, minSalary: null, equity: false, k401: false });
    expect(write(DEFAULT_SIGNAL_FILTERS)).toBe("");
  });

  it("round-trips every filter", () => {
    const filters: SignalFilters = { hideYears: true, visa: "not_citizens_only", minSalary: 120000, equity: true, k401: true };
    expect(write(filters)).toBe("years=hide&visa=not_citizens_only&salary=120k&equity=1&401k=1");
    expect(parse(write(filters))).toEqual(filters);
    expect(parse("years=show").hideYears).toBe(false);
  });

  it("drops what it does not know", () => {
    expect(parse("years=maybe&visa=always&salary=95k&equity=yes&401k=0")).toEqual(DEFAULT_SIGNAL_FILTERS);
    expect(parse("salary=120000").minSalary).toBeNull();
  });
});

describe("signalArgs: the new parameters go only when a filter is on (null means off on the server)", () => {
  it("sends nothing for the defaults of a profile the years filter is off for, or a signed-out visitor", () => {
    expect(signalArgs(DEFAULT_SIGNAL_FILTERS, [])).toEqual({});
    expect(signalArgs(DEFAULT_SIGNAL_FILTERS, LATE)).toEqual({});
  });

  it("sends p_hide_years true for an intern or entry profile left at its default", () => {
    expect(signalArgs(DEFAULT_SIGNAL_FILTERS, EARLY)).toEqual({ p_hide_years: true });
  });

  it("sends nothing for the years filter once it is off, whatever the default", () => {
    expect(signalArgs({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false }, EARLY)).toEqual({});
    expect(signalArgs({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false }, [])).toEqual({});
  });

  it("sends each filter that is on", () => {
    expect(signalArgs({ hideYears: true, visa: "sponsors", minSalary: 80000, equity: true, k401: true }, []))
      .toEqual({ p_hide_years: true, p_visa: "sponsors", p_min_salary: 80000, p_equity: true, p_k401: true });
  });
});

describe("the years filter's default comes from the profile's levels", () => {
  it("is on for intern or entry profiles until the person turns it off", () => {
    expect(effectiveHideYears(DEFAULT_SIGNAL_FILTERS, EARLY)).toBe(true);
    expect(effectiveHideYears(DEFAULT_SIGNAL_FILTERS, LATE)).toBe(false);
    expect(effectiveHideYears(DEFAULT_SIGNAL_FILTERS, [])).toBe(false);
    expect(effectiveHideYears({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false }, EARLY)).toBe(false);
  });

  it("goes back to the default (nothing in the URL, nothing sent) when switched to what the default is", () => {
    expect(withHideYears(DEFAULT_SIGNAL_FILTERS, EARLY, false).hideYears).toBe(false);
    expect(withHideYears({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false }, EARLY, true).hideYears).toBeNull();
    expect(withHideYears(DEFAULT_SIGNAL_FILTERS, [], true).hideYears).toBe(true);
    expect(withHideYears({ ...DEFAULT_SIGNAL_FILTERS, hideYears: true }, [], false).hideYears).toBeNull();
  });

  it("clears to off: explicitly for an early profile, as the default otherwise", () => {
    expect(clearedSignals(EARLY)).toEqual({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false });
    expect(clearedSignals([])).toEqual(DEFAULT_SIGNAL_FILTERS);
  });
});

describe("signalChips", () => {
  it("names each filter the person set, with the filters as they would be without it", () => {
    const filters: SignalFilters = { hideYears: true, visa: "sponsors", minSalary: 150000, equity: true, k401: true };
    const chips = signalChips(filters);
    expect(chips.map((chip) => chip.label)).toEqual(["Hiding roles needing years", "Sponsors visas", "Salary $150k+", "Equity", "401(k)"]);
    expect(chips.map((chip) => chip.without)).toEqual([
      { ...filters, hideYears: null }, { ...filters, visa: null }, { ...filters, minSalary: null }, { ...filters, equity: false }, { ...filters, k401: false },
    ]);
  });

  it("names the other choices plainly, and the defaults not at all", () => {
    expect(signalChips({ ...DEFAULT_SIGNAL_FILTERS, hideYears: false, visa: "not_citizens_only" }).map((c) => c.label))
      .toEqual(["Showing roles needing years", "Hiding citizens-only roles"]);
    expect(signalChips(DEFAULT_SIGNAL_FILTERS)).toEqual([]);
  });

  it("keeps the rest of a wider filters object in `without`", () => {
    const wider = { ...DEFAULT_SIGNAL_FILTERS, equity: true, query: "pm" };
    expect(signalChips(wider)[0].without).toEqual({ ...wider, equity: false });
  });
});

describe("what the triggers and the phone button say", () => {
  it("names the visa and salary choice on their triggers", () => {
    expect(visaTrigger(null)).toBe("Visa");
    expect(visaTrigger("sponsors")).toBe("Sponsors visas");
    expect(visaTrigger("not_citizens_only")).toBe("Hide citizens-only");
    expect(salaryTrigger(null)).toBe("Minimum salary");
    expect(salaryTrigger(200000)).toBe("$200k+");
    expect(salaryChoiceLabel(null)).toBe("Any");
    expect(salaryChoiceLabel(60000)).toBe("$60k");
  });

  it("counts every narrowing filter, the default years included", () => {
    expect(signalNarrowing(DEFAULT_SIGNAL_FILTERS, EARLY)).toBe(1);
    expect(signalNarrowing(DEFAULT_SIGNAL_FILTERS, [])).toBe(0);
    expect(signalNarrowing({ hideYears: false, visa: "sponsors", minSalary: 60000, equity: true, k401: false }, EARLY)).toBe(3);
  });
});

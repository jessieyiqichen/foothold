import { describe, expect, it } from "vitest";
import type { Signals } from "../signals/types";
import { fitWarnings, MAX_REASON_WORDS, reasonSentence, skillName, topTags } from "./fit";
import { ROLE_PAGE_COPY } from "./pageCopy";

const words = (line: string) => line.split(/\s+/).filter(Boolean).length;

describe("reasonSentence: one short line of why, as the mockup (user, 2026-11-23)", () => {
  it("says so when no skill is shared", () => {
    expect(reasonSentence([])).toBe(ROLE_PAGE_COPY.noShared);
    expect(reasonSentence(["  ", ""])).toBe(ROLE_PAGE_COPY.noShared);
  });

  it("names one, two or three skills, never a count of the rest", () => {
    expect(reasonSentence(["sql"])).toBe("Your SQL work matches this role");
    expect(reasonSentence(["evals", "sql"])).toBe("Your evals and SQL work match this role");
    expect(reasonSentence(["evals", "sql", "llms", "python", "a/b testing"])).toBe("Your evals, SQL and LLMs work match this role");
  });

  it("names each skill once", () => {
    expect(reasonSentence(["sql", "sql"])).toBe("Your SQL work matches this role");
  });

  it("stays within the word cap, naming fewer skills when they are long", () => {
    const long = ["a1 a2 a3 a4 a5", "b1 b2 b3 b4 b5", "c1 c2 c3 c4 c5"];
    const line = reasonSentence(long);
    expect(words(line)).toBeLessThanOrEqual(MAX_REASON_WORDS);
    expect(line).toBe("Your a1 a2 a3 a4 a5 work matches this role");
  });

  it("cuts a single absurdly long skill to the cap", () => {
    const line = reasonSentence([Array.from({ length: 40 }, (_, i) => `w${i}`).join(" ")]);
    expect(words(line)).toBeLessThanOrEqual(MAX_REASON_WORDS);
    expect(line.endsWith("…")).toBe(true);
  });
});

describe("skillName: how a stored tag reads in a sentence", () => {
  it("writes known abbreviations in capitals and leaves other words as stored", () => {
    expect(["sql", "llms", "ai", "apis", "a/b testing", "causal inference", "saas", "ios"].map(skillName))
      .toEqual(["SQL", "LLMs", "AI", "APIs", "A/B testing", "causal inference", "SaaS", "iOS"]);
  });
});

describe("topTags: the role's shared skills, rarest first", () => {
  it("orders the role's skills by the company's order, unknown ones last", () => {
    expect(topTags(["python", "sql", "evals"], ["evals", "sql", "python"])).toEqual(["evals", "sql", "python"]);
    expect(topTags(["zeta", "sql"], ["sql"])).toEqual(["sql", "zeta"]);
  });

  it("does not change its inputs", () => {
    const role = ["b", "a"];
    topTags(role, ["a", "b"]);
    expect(role).toEqual(["b", "a"]);
  });
});

const visa = (value: "sponsors" | "no_sponsorship" | "citizens_only"): Signals["visa"] => ({ value, quote: `Visa: ${value}` });
const years = (min: number, required: boolean, needs = required && min >= 3): Signals["years"] => ({ min, required, needs, quote: `${min} years` });

describe("fitWarnings: the problems, most serious first", () => {
  it("is empty when there is no problem", () => {
    expect(fitWarnings({ signals: { visa: visa("sponsors"), years: years(2, true) } })).toEqual([]);
  });

  it("is empty when nothing is known", () => {
    expect(fitWarnings({})).toEqual([]);
    expect(fitWarnings({ signals: null })).toEqual([]);
    expect(fitWarnings({ signals: {} })).toEqual([]);
  });

  it("puts graduation before visa before years", () => {
    const all = fitWarnings({
      signals: { visa: visa("citizens_only"), years: years(5, true) },
      graduation: { outside: true, quote: "Graduating between Dec 2026 and Jun 2027" },
    });
    expect(all.map((w) => w.kind)).toEqual(["graduation", "visa", "years"]);
    expect(all[0]).toEqual({ kind: "graduation", label: ROLE_PAGE_COPY.graduation, quote: "Graduating between Dec 2026 and Jun 2027" });
  });

  it("warns on both kinds of no visa, with the quote kept for Details", () => {
    expect(fitWarnings({ signals: { visa: visa("citizens_only") } })).toEqual([{ kind: "visa", label: ROLE_PAGE_COPY.citizensOnly, quote: "Visa: citizens_only" }]);
    expect(fitWarnings({ signals: { visa: visa("no_sponsorship") } })[0]?.label).toBe(ROLE_PAGE_COPY.noSponsorship);
  });

  it("warns on years only when they are required and 3 or more", () => {
    expect(fitWarnings({ signals: { years: years(3, true) } })).toEqual([{ kind: "years", label: "Asks for 3+ years of experience", quote: "3 years" }]);
    expect(fitWarnings({ signals: { years: years(5, false) } })).toEqual([]);
    expect(fitWarnings({ signals: { years: years(2, true) } })).toEqual([]);
  });

  it("trusts the row's needs_years, carried as years.needs", () => {
    expect(fitWarnings({ signals: { years: years(2, true, true) } }).map((w) => w.kind)).toEqual(["years"]);
  });

  it("gives no graduation warning while the window fits or is unknown", () => {
    expect(fitWarnings({ graduation: { outside: false, quote: null } })).toEqual([]);
    expect(fitWarnings({ graduation: null })).toEqual([]);
  });
});


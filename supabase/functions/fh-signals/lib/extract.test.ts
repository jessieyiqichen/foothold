// Fixtures: `fixtures/new-grad.json` holds REAL posting texts copied on 2026-11-22 from evals/new-grad/postings.json
// (field `text`, keyed here by `n`). Every other string in this file is SYNTHETIC, written to pin one rule.
// Nothing here reads evals/signals/: that sample is held out for the hand check.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractSignals, SIGNALS_VERSION, type Signals } from "./extract";
import { QUOTE_MAX, segmentsOf } from "./sentences";

const real: Array<{ n: number; id: string; text: string }> = JSON.parse(
  readFileSync(new URL("./fixtures/new-grad.json", import.meta.url), "utf8"),
);
const posting = (n: number): string => {
  const p = real.find((x) => x.n === n);
  if (!p) throw new Error(`fixture ${n} missing`);
  return p.text;
};

/** Every quote a result carries, the pending sentences included. */
const quotesOf = (s: Signals): string[] => [
  s.years?.quote, s.salary?.quote, s.visa?.quote, s.equity?.quote, s.k401?.quote, ...s.pending.map((p) => p.sentence),
].filter((q): q is string => typeof q === "string");

describe("quotes", () => {
  it("are exact substrings of the text, 1..400 characters, for every real posting", () => {
    for (const { text } of real) {
      for (const seg of segmentsOf(text)) {
        expect(text.includes(seg.quote)).toBe(true);
        expect(seg.quote.length).toBeGreaterThanOrEqual(1);
        expect(seg.quote.length).toBeLessThanOrEqual(QUOTE_MAX);
      }
      for (const q of quotesOf(extractSignals(text))) {
        expect(text.includes(q)).toBe(true);
        expect(q.length).toBeGreaterThanOrEqual(1);
        expect(q.length).toBeLessThanOrEqual(QUOTE_MAX);
      }
    }
  });
  it("skips a run-on line it cannot cut under 400 characters rather than truncating it (synthetic)", () => {
    const long = `${"word ".repeat(120)}5+ years of experience required`;
    const s = extractSignals(long);
    expect(s.years).toBeNull();
    for (const seg of segmentsOf(long)) expect(seg.quote.length).toBeLessThanOrEqual(QUOTE_MAX);
  });
  it("keeps U.S. and e.g. inside a sentence (synthetic)", () => {
    const text = "We can only hire U.S. citizens, e.g. for ITAR work. Next sentence.";
    expect(segmentsOf(text).map((s) => s.quote)).toEqual(["We can only hire U.S. citizens, e.g. for ITAR work.", "Next sentence."]);
  });
  it("tolerates text that is not a string", () => {
    expect(extractSignals(null as unknown as string)).toEqual({ years: null, salary: null, visa: null, equity: null, k401: null, pending: [] });
  });
  it("exports the rules' version", () => expect(SIGNALS_VERSION).toBe(2));
});

describe("years (real postings)", () => {
  it("keeps the largest required minimum with its sentence", () => {
    const s = extractSignals(posting(40));
    expect(s.years).toEqual({ min: 4, required: true, quote: "4+ years of experience within a warehouse or logistics setting" });
  });
  it("reads N-M as N", () => {
    expect(extractSignals(posting(24)).years).toMatchObject({ min: 2, required: true });
    expect(extractSignals(posting(21)).years).toMatchObject({ min: 1, required: true });
  });
  it("reads YOE, and a role in a customer-facing setting, as experience", () => {
    expect(extractSignals(posting(18)).years).toMatchObject({ min: 5, required: true });
    expect(extractSignals(posting(29)).years).toMatchObject({ min: 5, required: true });
  });
  it("cuts a run-on post's flattened bullets, and reads its 'is a plus' line apart from the years", () => {
    expect(extractSignals(posting(16)).years).toEqual({
      min: 4, required: true, quote: "What we’re looking for: 4+ years of professional software engineering experience",
    });
  });
  it("reads years under an all-caps REQUIRED EXPERIENCE heading as required", () => {
    expect(extractSignals(posting(37)).years).toMatchObject({ min: 3, required: true });
    expect(extractSignals(posting(37)).pending).toEqual([]);
  });
  it("stores 'ideally 10+ years' as preferred, never required", () => {
    const s = extractSignals(posting(19));
    expect(s.years).toMatchObject({ min: 10, required: false });
    expect(s.pending).toEqual([]);
  });
  it("sends 'Looking for 8+ years, full-stack.' (no experience word) to the model", () => {
    const s = extractSignals(posting(17));
    expect(s.years).toBeNull();
    expect(s.pending).toEqual([{ kind: "years", sentence: "Looking for 8+ years, full-stack.", value: 8 }]);
  });
  it("does not count '5+ years of curiosity' as settled experience", () => {
    const s = extractSignals(posting(9));
    expect(s.years).toMatchObject({ min: 0, required: true });
    expect(s.pending.map((p) => p.kind)).toEqual(["years"]);
    expect(s.pending[0]).toMatchObject({ value: 5 });
  });
});

describe("years (synthetic edge cases)", () => {
  const years = (t: string) => extractSignals(t).years;
  it("numbers in words, at least, minimum of, or more", () => {
    expect(years("Requirements:\nThree (3) or more years of product experience")).toMatchObject({ min: 3, required: true });
    expect(years("You have at least five years of experience in sales.")).toMatchObject({ min: 5, required: true });
    expect(years("A minimum of 4 years of professional experience is required.")).toMatchObject({ min: 4, required: true });
    expect(years("Experience: 6+ years, must have")).toMatchObject({ min: 6, required: true });
  });
  it("ignores company age, vesting, runway, ages, degrees and time at school", () => {
    for (const t of [
      "We were founded 10 years ago and must keep growing.",
      "Options vest over a 4-year vesting schedule with a one-year cliff.",
      "We have 5 years of runway.",
      "Over the past 8 years we have shipped to 40 countries.",
      "Applicants must be at least 18 years old.",
      "Requires a 4 year degree in engineering.",
      "We have been profitable for 6 years.",
    ]) {
      const s = extractSignals(t);
      expect(s.years, t).toBeNull();
      expect(s.pending, t).toEqual([]);
    }
  });
  it("a requirement line without a stop is content, not a heading", () => {
    expect(years("About the role\n5+ years of experience required\nBachelor's degree required")).toMatchObject({ min: 5, required: true });
  });
  it("a preferred heading makes years preferred; a later heading ends it", () => {
    const t = "Nice to have\n- 5+ years of experience with Rust\nRequirements\n- 1+ years of experience with Python";
    expect(years(t)).toEqual({ min: 1, required: true, quote: "1+ years of experience with Python" });
    expect(extractSignals(t).pending).toEqual([]);
    expect(years("Bonus points:\n- 7 years of experience in fintech")).toMatchObject({ min: 7, required: false });
  });
  it("preferred years are kept only when no required years exist", () => {
    const t = "Qualifications\n- 2+ years of experience in analytics\nPreferred\n- 6+ years of experience in analytics";
    expect(years(t)).toMatchObject({ min: 2, required: true });
  });
  it("years with no heading and no cue go to the model only when they change the answer", () => {
    const t = "Engineers with 6 years of experience in backend systems thrive here.";
    expect(years(t)).toBeNull();
    expect(extractSignals(t).pending).toEqual([{ kind: "years", sentence: t, value: 6 }]);
    const small = "Engineers with 2 years of experience in backend systems thrive here.";
    expect(years(small)).toMatchObject({ min: 2, required: true });
    expect(extractSignals(small).pending).toEqual([]);
    const settled = "You must have 4+ years of experience. Engineers with 9 years of experience in backend systems thrive here.";
    expect(years(settled)).toMatchObject({ min: 4, required: true });
    expect(extractSignals(settled).pending).toEqual([]);
  });
});

describe("salary (real postings)", () => {
  const salary = (n: number) => extractSignals(posting(n)).salary;
  it("reads ranges in $, with commas, k, and 'between ... and'", () => {
    expect(salary(32)).toMatchObject({ min: 80000, max: 155000, currency: "USD", period: "year", ote: false, quote: "Salary: $80,000-$155,000" });
    expect(salary(36)).toMatchObject({ min: 120000, max: 150000, currency: "USD", period: "year" });
    expect(salary(10)).toMatchObject({ min: 175000, max: 225000, currency: "USD" });
    expect(salary(35)).toMatchObject({ min: 180000, max: 300000, currency: "USD" });
  });
  it("carries k across a range ('$150-300k', '$105K–115$K')", () => {
    expect(salary(37)).toMatchObject({ min: 150000, max: 300000 });
    expect(salary(24)).toMatchObject({ min: 105000, max: 115000 });
  });
  it("reads € after the number, and £ with + equity", () => {
    expect(salary(19)).toMatchObject({ min: 100000, max: 140000, currency: "EUR", period: "year" });
    expect(salary(12)).toMatchObject({ min: 115000, max: 115000, currency: "GBP" });
  });
  it("reads hourly pay", () => {
    expect(salary(30)).toMatchObject({ min: 35, max: 35, currency: "USD", period: "hour" });
    expect(salary(27)).toMatchObject({ min: 40, max: 52, currency: "USD", period: "hour" });
  });
  it("prefers base pay to on-target earnings", () => {
    expect(salary(38)).toMatchObject({ min: 175000, max: 200000, ote: false });
  });
  it("leaves out funding, market sizes, monthly rates, bonuses and benefit amounts", () => {
    for (const n of [21, 22, 28, 29]) expect(salary(n), String(n)).toBeNull();
  });
});

describe("salary (synthetic edge cases)", () => {
  const salary = (t: string) => extractSignals(t).salary;
  it("a floor", () => expect(salary("Base salary $150k+ depending on level.")).toMatchObject({ min: 150000, max: null, period: "year" }));
  it("USD written out, and 'to'", () => expect(salary("Pay range: USD 90,000 to 120,000 per year")).toMatchObject({ min: 90000, max: 120000, currency: "USD" }));
  it("OTE alone is kept and marked", () => expect(salary("OTE $200k-$250k, uncapped.")).toMatchObject({ min: 200000, max: 250000, ote: true }));
  it("rejects funding, percentages and out-of-bounds amounts", () => {
    for (const t of ["We raised a $20M Series A.", "Equity: 0.5%-1% of the company.", "Salary: $5,000,000 a year.", "Pay: $2/hour.", "We just raised $150k in pre-seed funding."]) {
      expect(salary(t), t).toBeNull();
    }
  });
});

describe("visa", () => {
  it("real: no sponsorship, sponsors, citizens only", () => {
    expect(extractSignals(posting(4)).visa).toEqual({ value: "no_sponsorship", quote: "Visa sponsorship is not available." });
    expect(extractSignals(posting(37)).visa).toMatchObject({ value: "sponsors", quote: "Full visa sponsorship and relocation support" });
    expect(extractSignals(posting(12)).visa).toMatchObject({ value: "sponsors" });
    expect(extractSignals(posting(18)).visa).toMatchObject({ value: "citizens_only" });
    expect(extractSignals(posting(26)).visa).toMatchObject({ value: "citizens_only", quote: "ITAR requirement" });
    expect(extractSignals(posting(36)).visa).toMatchObject({ value: "citizens_only" });
  });
  it("real: equal opportunity lines never count", () => {
    expect(extractSignals(posting(27)).visa).toBeNull();
  });
  it("synthetic: now or in the future, application questions, need-sponsorship lines", () => {
    expect(extractSignals("Candidates must be authorized to work in the US without sponsorship now or in the future.").visa).toMatchObject({ value: "no_sponsorship" });
    expect(extractSignals("Will you now or in the future require visa sponsorship?").visa).toBeNull();
    expect(extractSignals("If you need sponsorship, say so in your application.").visa).toBeNull();
    expect(extractSignals("This role requires an active Secret clearance.").visa).toMatchObject({ value: "citizens_only" });
    expect(extractSignals("Security clearance is a plus.").visa).toBeNull();
  });
  it("synthetic: a conflict goes to the model and stores nothing", () => {
    const t = "We sponsor H-1B visas for all engineers. We do not sponsor visas for this role.";
    const s = extractSignals(t);
    expect(s.visa).toBeNull();
    expect(s.pending).toEqual([
      { kind: "visa", sentence: "We sponsor H-1B visas for all engineers." },
      { kind: "visa", sentence: "We do not sponsor visas for this role." },
    ]);
  });
  it("synthetic: citizens only and no sponsorship agree", () => {
    const t = "Must be a US citizen. We cannot sponsor visas.";
    expect(extractSignals(t).visa).toEqual({ value: "citizens_only", quote: "Must be a US citizen." });
  });
});

describe("equity and 401(k)", () => {
  it("real: offers", () => {
    expect(extractSignals(posting(13)).equity).toEqual({ quote: "Compensation: base salary + commission + equity." });
    expect(extractSignals(posting(32)).k401?.quote).toContain("401k");
    expect(extractSignals(posting(22)).k401?.quote).toContain("401(k)");
    expect(extractSignals(posting(36)).k401?.quote).toContain("401(K)");
  });
  it("synthetic: other meanings of equity do not count", () => {
    for (const t of [
      "We value diversity, equity and inclusion.", "Our DEI work: Diversity, Equity & Inclusion.", "Experience in private equity or equity research.",
      "We work on health equity.", "You will build brand equity.", "No equity is offered for this contract role.",
    ]) {
      expect(extractSignals(t).equity, t).toBeNull();
    }
  });
  it("synthetic: an offer still counts beside another meaning", () => {
    expect(extractSignals("Background in equity research; we offer meaningful equity.").equity).not.toBeNull();
    expect(extractSignals("Competitive salary and stock options.").equity).not.toBeNull();
  });
  it("synthetic: 401(k) spellings", () => {
    for (const t of ["401(k) match", "401k with match", "401 (k) plan"]) expect(extractSignals(t).k401, t).toEqual({ quote: t });
  });
});

// Version 2: the errors of the v1 hand check (evals/signals/precision-v1.md), each pinned by a SYNTHETIC sentence of
// the same shape. None of these strings comes from a sample.
describe("v2 fixes: years (synthetic)", () => {
  const years = (t: string) => extractSignals(t);
  it("the main clause wins over an 'including N+ years' sub-clause", () => {
    expect(years("Requirements:\n- 12+ years in software, including 5+ years leading teams").years).toMatchObject({ min: 12, required: true });
    const s = years("7+ years of product experience, including 2+ years in a leadership role");
    expect(s.years).toMatchObject({ min: 7, required: true });
    expect(s.pending).toEqual([]);
    expect(years("You have 9+ years of experience, 4 years of which in management.").years).toMatchObject({ min: 9, required: true });
  });
  it("alternatives joined by 'or' take their minimum", () => {
    expect(years("Requirements:\n- 2-5 years at startups, or more than 4 years of overall experience").years).toMatchObject({ min: 2, required: true });
    expect(years("Requirements:\n- 5 years of experience with a Bachelor's degree or 3 years of experience with a Master's").years).toMatchObject({ min: 3, required: true });
  });
  it("a preferred cue counts only in the years' own clause, outside parentheses", () => {
    expect(years("Qualifications\n- 5+ years of database engineering experience (PostgreSQL preferred)").years).toMatchObject({ min: 5, required: true });
    expect(years("Qualifications\n- 5–8 years of sales experience; experience managing a large book of accounts strongly preferred").years).toMatchObject({ min: 5, required: true });
    expect(years("Qualifications\n- 6+ years of experience in fintech strongly preferred").years).toMatchObject({ min: 6, required: false });
  });
});

describe("v2 fixes: salary (synthetic)", () => {
  const salary = (t: string) => extractSignals(t).salary;
  it("rejects deal, revenue and contract sizes", () => {
    for (const t of [
      "You will sell $50-$500K ACV contracts to enterprises.", "Close $20k-100k+ ACV deals.",
      "Customers have $50K–$250K in annual recurring revenue.", "Manage a book of $2-5M.", "Deals of $80,000 to $120,000 in contract value.",
      "Grow ARR from $100k to $900k.",
    ]) expect(salary(t), t).toBeNull();
  });
  it("rejects amounts on an equity line", () => {
    expect(salary("Equity: $40,000 - $50,000")).toBeNull();
    expect(salary("Salary: $120,000 - $140,000. Equity: $40,000 - $50,000")).toMatchObject({ min: 120000, max: 140000 });
  });
  it("reads 'between $26/hour and $29/hour'", () => {
    expect(salary("Pay is between $26/hour and $29/hour.")).toMatchObject({ min: 26, max: 29, period: "hour" });
  });
  it("keeps the base beside an OTE, and marks a stored OTE", () => {
    expect(salary("Compensation: $55k base salary ($100k+ OTE).")).toMatchObject({ min: 55000, max: 55000, ote: false });
    expect(salary("OTE $120k-$160k.")).toMatchObject({ min: 120000, max: 160000, ote: true });
    expect(salary("Up to $100k+ OTE.")).toMatchObject({ min: 100000, max: null, ote: true });
  });
  it("reads '$200-300,000 salary'", () => {
    expect(salary("$200-300,000 salary plus bonus.")).toMatchObject({ min: 200000, max: 300000, currency: "USD" });
  });
  it("a bare $ is USD unless the sentence names another dollar", () => {
    expect(salary("Salary: $90,000-$110,000.")).toMatchObject({ currency: "USD" });
    expect(salary("Salary: $90,000-$110,000 CAD.")).toMatchObject({ currency: "CAD" });
    expect(salary("Salary range (CAD): $90,000-$110,000.")).toMatchObject({ currency: "CAD" });
    expect(salary("Salary: S$90,000-S$110,000.")).toMatchObject({ currency: "SGD" });
    expect(salary("Salary in AUD: $90,000-$110,000.")).toMatchObject({ currency: "AUD" });
  });
});

describe("v2 fixes: visa and equity (synthetic)", () => {
  it("a sentence saying postings state whether sponsorship is available is not a signal", () => {
    expect(extractSignals("Each posting states whether visa sponsorship is available for that role.").visa).toBeNull();
  });
  it("social, URL and excluded uses of equity do not count", () => {
    for (const t of [
      "We fund health-education and equity programs.", "Our work advances education and equity.", "We champion racial equity.",
      "We audit pay equity every year.", "See https://example.org/mental-health-parity-and-addiction-equity-act for details.",
      "Total compensation does not include bonus or equity.", "Salary range excluding equity: $100k-$120k.",
    ]) expect(extractSignals(t).equity, t).toBeNull();
    expect(extractSignals("Benefits include meaningful equity.").equity).not.toBeNull();
  });
});

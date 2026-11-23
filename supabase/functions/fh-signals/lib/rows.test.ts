// SYNTHETIC rows shaped like the database's answers; nothing here touches a database.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractSignals } from "./extract";
import { MODEL_TRIES_MAX, pickLimit, readClaimed, readSetResult, readStored, reachedEnd, RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX, toRow } from "./rows";

const MD5 = "0123456789abcdef0123456789abcdef";

describe("pickLimit", () => {
  it("keeps a whole number inside 1..max, else the default", () => {
    expect(pickLimit(10, RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX)).toBe(10);
    expect(pickLimit(0, RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX)).toBe(1);
    expect(pickLimit(10_000, RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX)).toBe(RULES_LIMIT_MAX);
    for (const v of [undefined, null, "5", 2.5, Number.NaN]) expect(pickLimit(v, 7, 9)).toBe(7);
  });
  it("reachedEnd", () => {
    expect(reachedEnd(3, 5)).toBe(true);
    expect(reachedEnd(5, 5)).toBe(false);
  });
});

describe("readClaimed", () => {
  it("keeps rows with an id and an md5; text that is not text means unchanged", () => {
    expect(readClaimed([
      { posting_id: 1, text_md5: MD5, text: "Hello" }, { posting_id: 2, text_md5: MD5, text: null }, { posting_id: 3, text_md5: MD5, text: 7 },
      { posting_id: "4", text_md5: MD5, text: "x" }, { posting_id: 5, text_md5: "nope", text: "x" }, null, "row",
    ])).toEqual([{ id: 1, md5: MD5, text: "Hello" }, { id: 2, md5: MD5, text: null }, { id: 3, md5: MD5, text: null }]);
    expect(readClaimed({ posting_id: 1 })).toEqual([]);
  });
});

describe("toRow and readStored", () => {
  const real = JSON.parse(readFileSync(new URL("./fixtures/new-grad.json", import.meta.url), "utf8")) as Array<{ n: number; text: string }>;
  it("flattens signals with a quote beside every value (real posting 37)", () => {
    const s = extractSignals(real.find((x) => x.n === 37)?.text ?? "");
    const row = toRow(37, MD5, s, "rules");
    expect(row).toMatchObject({ posting_id: 37, text_md5: MD5, years_min: 3, years_required: true, salary_min: 150000, salary_max: 300000,
      salary_currency: "USD", salary_period: "year", salary_ote: false, visa: "sponsors", equity: true, k401: null, k401_quote: null, pending: null, settled_by: "rules" });
    for (const [value, quote] of [["years_min", "years_quote"], ["salary_min", "salary_quote"], ["visa", "visa_quote"], ["equity", "equity_quote"], ["k401", "k401_quote"]] as const) {
      expect(row[value] === null, value).toBe(row[quote] === null);
    }
  });
  it("reads back what it wrote, as the database returns it (numeric as text)", () => {
    const s = extractSignals(real.find((x) => x.n === 17)?.text ?? "");
    const row = toRow(17, MD5, s, "rules");
    const back = readStored({ ...row, salary_min: String(row.salary_min), salary_max: String(row.salary_max) });
    expect(back).toEqual({ id: 17, md5: MD5, settledBy: "rules", signals: s });
  });
  it("drops a stored row that is malformed anywhere, so a rewrite cannot erase a value", () => {
    const s = extractSignals(real.find((x) => x.n === 17)?.text ?? "");
    const row = toRow(17, MD5, s, "rules");
    expect(readStored({ ...row, salary_period: "month" })).toBeNull();
    expect(readStored({ ...row, salary_quote: undefined })).toBeNull();
    expect(readStored({ ...row, equity: "yes" })).toBeNull();
    expect(readStored({ ...row, pending: [{ kind: "years", sentence: "x" }] })).toBeNull();
    expect(readStored({ ...row, pending: [{ kind: "other", sentence: "x" }] })).toBeNull();
    expect(readStored({ ...row, pending: null })).toBeNull();
    expect(readStored({ ...row, visa: "maybe", visa_quote: "q" })).toBeNull();
  });
});

describe("readSetResult", () => {
  it("reads fh_set_signals' counts, each a whole number of 0 or more", () => {
    expect(readSetResult({ written: 3, emptied: 1, skipped: 2 })).toEqual({ written: 3, emptied: 1, skipped: 2 });
    expect(readSetResult({ written: "3", emptied: -1 })).toEqual({ written: 0, emptied: 0, skipped: 0 });
    expect(readSetResult(null)).toEqual({ written: 0, emptied: 0, skipped: 0 });
  });
});

describe("model tries", () => {
  it("gives up on a row after a few failed requests", () => {
    expect(MODEL_TRIES_MAX).toBe(3);
  });
});

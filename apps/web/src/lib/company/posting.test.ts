import { describe, expect, it, vi } from "vitest";
import { highlight, loadPosting, readPosting } from "./posting";

describe("highlight: the warning's sentence, marked where it appears", () => {
  const text = "We build agents.\nYou must be a US citizen.\nWe offer equity.";

  it("marks a quote found word for word", () => {
    expect(highlight(text, "You must be a US citizen.")).toEqual([
      { text: "We build agents.\n", marked: false },
      { text: "You must be a US citizen.", marked: true },
      { text: "\nWe offer equity.", marked: false },
    ]);
  });

  it("marks a quote at the very start or end without empty pieces", () => {
    expect(highlight("Equity. Rest", "Equity.")).toEqual([{ text: "Equity.", marked: true }, { text: " Rest", marked: false }]);
    expect(highlight("Rest Equity.", "Equity.")).toEqual([{ text: "Rest ", marked: false }, { text: "Equity.", marked: true }]);
  });

  it("marks nothing when the quote is not in the text", () => {
    expect(highlight(text, "You must be a citizen")).toEqual([{ text, marked: false }]);
    expect(highlight(text, null)).toEqual([{ text, marked: false }]);
    expect(highlight(text, "")).toEqual([{ text, marked: false }]);
  });
});

describe("readPosting: the row, checked", () => {
  it("reads the text and the place", () => {
    expect(readPosting({ text: "Hello", location: " New York " })).toEqual({ text: "Hello", location: "New York" });
    expect(readPosting({ text: "Hello", location: null })).toEqual({ text: "Hello", location: null });
    expect(readPosting({ text: null, location: "" })).toEqual({ text: "", location: null });
  });

  it("refuses a row of the wrong shape", () => {
    expect(readPosting(null)).toBeNull();
    expect(readPosting({ text: 4, location: null })).toBeNull();
    expect(readPosting({ text: "a", location: 4 })).toBeNull();
  });
});

function fakeDb(answer: { data: unknown; error: { message: string } | null }) {
  const maybeSingle = vi.fn().mockResolvedValue(answer);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { db: { from } as never, from, select, eq };
}

describe("loadPosting", () => {
  it("reads one posting's text and place as the person", async () => {
    const { db, from, select, eq } = fakeDb({ data: { text: "Body", location: "Remote" }, error: null });
    expect(await loadPosting(db, 41)).toEqual({ ok: true, value: { text: "Body", location: "Remote" } });
    expect(from).toHaveBeenCalledWith("fh_postings");
    expect(select).toHaveBeenCalledWith("text, location");
    expect(eq).toHaveBeenCalledWith("id", 41);
  });

  it("gives null for no row, and a line when the read fails", async () => {
    expect(await loadPosting(fakeDb({ data: null, error: null }).db, 41)).toEqual({ ok: true, value: null });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = await loadPosting(fakeDb({ data: null, error: { message: "boom" } }).db, 41);
    expect(failed.ok).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

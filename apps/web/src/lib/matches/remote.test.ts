import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MATCHES_PAGE_SIZE, MATCHES_RPC } from "./constants";
import { MATCHES_COPY } from "./copy";
import { addPage, hasMore, loadMatches, type MatchesDb } from "./remote";

const row = (id: number, total = 120) => ({
  id, title: `Product Manager ${id}`, company_name: "Acme", url: `https://jobs.example.com/${id}`, locations: ["Chicago"],
  posted_at: "2026-11-03T10:00:00+00:00", family: "product", level: "unspecified", shared: ["sql"], score: 3, total,
});

type Mode = "ok" | "refused" | "offline";

/** A stand-in for the Supabase client: records the call and answers with `rows`, so no request leaves the test. */
function fakeDb(rows: unknown, mode: Mode = "ok") {
  const calls: { name: string; args: unknown }[] = [];
  const db = {
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      if (mode === "offline") throw new TypeError("Failed to fetch");
      return mode === "refused" ? { data: null, error: { message: "permission denied for function fh_matches" } } : { data: rows, error: null };
    },
  };
  return { db: db as unknown as MatchesDb, calls };
}

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("loadMatches", () => {
  it("asks fh_matches for one page of 50 from the offset given", async () => {
    const { db, calls } = fakeDb([row(1), row(2)]);
    const result = await loadMatches(db, 50);
    expect(calls).toEqual([{ name: MATCHES_RPC, args: { p_limit: MATCHES_PAGE_SIZE, p_offset: 50 } }]);
    expect(MATCHES_PAGE_SIZE).toBe(50);
    expect(result).toMatchObject({ ok: true, value: { total: 120, dropped: 0 } });
    expect(result.ok && result.value.matches.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("refuses an offset that is not a whole number from zero up, without asking", async () => {
    const { db, calls } = fakeDb([]);
    for (const offset of [-1, 1.5, Number.NaN]) expect(await loadMatches(db, offset)).toEqual({ ok: false, message: MATCHES_COPY.loadFailed });
    expect(calls).toEqual([]);
  });

  it("shows the readable rows and logs how many it dropped, never silently", async () => {
    const { db } = fakeDb([row(1), { ...row(2), url: "http://plain.example.com" }]);
    const result = await loadMatches(db, 0);
    expect(result).toMatchObject({ ok: true, value: { dropped: 1 } });
    expect(logged).toHaveBeenCalledOnce();
  });

  it.each(["refused", "offline"] as const)("gives a message to show and logs the cause when the request is %s", async (mode) => {
    expect(await loadMatches(fakeDb([row(1)], mode).db, 0)).toEqual({ ok: false, message: MATCHES_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });

  it("says so when the answer is not a list", async () => {
    expect(await loadMatches(fakeDb({ nope: true }).db, 0)).toEqual({ ok: false, message: MATCHES_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("addPage: Show more", () => {
  const read = async (rows: unknown[]) => {
    const result = await loadMatches(fakeDb(rows).db, 0);
    if (!result.ok) throw new Error("the fake page did not load");
    return result.value;
  };

  it("puts the next page after the rows already shown and takes the newer count", async () => {
    const first = await read([row(1, 120), row(2, 120)]);
    const next = await read([row(3, 121), row(4, 121)]);
    const both = addPage(first, next);
    expect(both.matches.map((m) => m.id)).toEqual(["1", "2", "3", "4"]);
    expect(both.total).toBe(121);
  });

  it("does not show a role twice when the list moved between the two requests", async () => {
    const both = addPage(await read([row(1), row(2)]), await read([row(2), row(3)]));
    expect(both.matches.map((m) => m.id)).toEqual(["1", "2", "3"]);
  });

  it("does not change the page it is given", async () => {
    const first = await read([row(1)]);
    addPage(first, await read([row(2)]));
    expect(first.matches).toHaveLength(1);
  });
});

describe("hasMore", () => {
  it("is true while fewer rows were asked for than there are matches", () => {
    expect(hasMore({ asked: 50, total: 120 })).toBe(true);
    expect(hasMore({ asked: 150, total: 120 })).toBe(false);
    expect(hasMore({ asked: 50, total: 50 })).toBe(false);
    expect(hasMore({ asked: 0, total: 0 })).toBe(false);
  });
});

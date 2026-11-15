import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DECISIONS_TABLE, SAVED_RPC, TODAY_RPC } from "./constants";
import { CARDS_COPY } from "./copy";
import { decide, loadDecisionsSince, loadSaved, loadToday, undecide, type CardsDb } from "./remote";
import { row } from "./testRow";

type Mode = "ok" | "refused" | "offline";

/** A stand-in for the Supabase client: records every call and answers from `data`, so no request leaves the test. */
function fakeDb(data: unknown, mode: Mode = "ok") {
  const calls: unknown[] = [];
  const answer = async () => {
    if (mode === "offline") throw new TypeError("Failed to fetch");
    return mode === "refused" ? { data: null, error: { message: "permission denied" } } : { data, error: null };
  };
  const db = {
    rpc: (name: string, args?: unknown) => { calls.push(["rpc", name, args]); return answer(); },
    from: (table: string) => ({
      select: (columns: string) => ({ gte: (column: string, value: string) => { calls.push(["select", table, columns, column, value]); return answer(); } }),
      upsert: (values: unknown, options: unknown) => { calls.push(["upsert", table, values, options]); return answer(); },
      delete: () => ({ eq: (column: string, value: unknown) => { calls.push(["delete", table, column, value]); return answer(); } }),
    }),
  };
  return { db: db as unknown as CardsDb, calls };
}

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("loadToday", () => {
  it("asks fh_today for the cards left in this five", async () => {
    const { db, calls } = fakeDb([row]);
    const result = await loadToday(db, 3);
    expect(calls).toEqual([["rpc", TODAY_RPC, { p_limit: 3 }]]);
    expect(result.ok && result.value.map((c) => c.companyId)).toEqual([812]);
  });

  it.each(["refused", "offline"] as const)("gives a line to show and logs the cause when the request is %s", async (mode) => {
    expect(await loadToday(fakeDb([row], mode).db, 5)).toEqual({ ok: false, message: CARDS_COPY.loadFailed });
    expect(logged).toHaveBeenCalledOnce();
  });

  it("says so when the answer is not a list", async () => {
    expect(await loadToday(fakeDb({ rows: [] }).db, 5)).toEqual({ ok: false, message: CARDS_COPY.loadFailed });
  });
});

describe("loadSaved", () => {
  it("asks fh_saved and reads the decisions", async () => {
    const { db, calls } = fakeDb([{ ...row, decision: "saved", decided_at: "2026-11-14T10:00:00Z" }]);
    const result = await loadSaved(db);
    expect(calls).toEqual([["rpc", SAVED_RPC, undefined]]);
    expect(result.ok && result.value.map((c) => c.decision)).toEqual(["saved"]);
  });
});

describe("loadDecisionsSince: today's decisions, for Card N of 5", () => {
  it("reads the person's decisions from the start of their day", async () => {
    const { db, calls } = fakeDb([{ company_id: 1, decision: "saved", decided_at: "2026-11-14T10:00:00Z" }, { company_id: 2, decision: "nope", decided_at: "x" }]);
    const since = new Date("2026-11-14T06:00:00Z");
    const result = await loadDecisionsSince(db, since);
    expect(calls).toEqual([["select", DECISIONS_TABLE, "company_id, decision, decided_at", "decided_at", since.toISOString()]]);
    expect(result).toEqual({ ok: true, value: [{ companyId: 1, decision: "saved", decidedAt: "2026-11-14T10:00:00Z" }] });
  });
});

describe("decide and undecide", () => {
  const at = new Date("2026-11-14T10:00:00Z");

  it("writes one row per company, replacing an earlier decision on it", async () => {
    const { db, calls } = fakeDb(null);
    expect(await decide(db, 812, "reached_out", at)).toEqual({ ok: true, value: null });
    expect(calls).toEqual([["upsert", DECISIONS_TABLE, { company_id: 812, decision: "reached_out", decided_at: at.toISOString() }, { onConflict: "user_id,company_id" }]]);
  });

  it("deletes the person's row for that company to undo", async () => {
    const { db, calls } = fakeDb(null);
    expect(await undecide(db, 812)).toEqual({ ok: true, value: null });
    expect(calls).toEqual([["delete", DECISIONS_TABLE, "company_id", 812]]);
  });

  it.each(["refused", "offline"] as const)("gives a line to show and logs the cause when the write is %s", async (mode) => {
    expect(await decide(fakeDb(null, mode).db, 812, "saved", at)).toEqual({ ok: false, message: CARDS_COPY.decideFailed });
    expect(await undecide(fakeDb(null, mode).db, 812)).toEqual({ ok: false, message: CARDS_COPY.undoFailed });
    expect(logged).toHaveBeenCalledTimes(2);
  });
});

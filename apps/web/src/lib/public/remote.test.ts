import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "../roles/filters";
import { PUBLIC_COPY } from "./copy";
import { loadPublicRoles, loadStats, publicRolesArgs, rpcWithRetry, type PublicDb } from "./remote";

const db = (data: unknown, error: { message: string } | null = null) => {
  const rpc = vi.fn(async () => ({ data, error }));
  return { db: { rpc } as unknown as PublicDb, rpc };
};
let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logged = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => logged.mockRestore());

const row = { id: 7, title: "Product Manager", company_id: 3475, company_name: "Bolna AI", url: "https://jobs.ashbyhq.com/bolna/7", locations: ["Bengaluru"], posted_at: "2026-11-20T00:00:00Z", family: "product", level: "unspecified", total: 1416 };

describe("loadPublicRoles: Jobs for a signed-out visitor", () => {
  it("asks with no profile behind any filter, newest first, and reads rows with no skills", async () => {
    const { db: d, rpc } = db([row]);
    const r = await loadPublicRoles(d, DEFAULT_FILTERS, 0);
    expect(r.ok && r.value.matches[0]).toMatchObject({ id: "7", title: "Product Manager", companyName: "Bolna AI", shared: [], score: 0 });
    expect(r.ok && r.value.total).toBe(1416);
    expect(rpc).toHaveBeenCalledWith("fh_public_roles", publicRolesArgs(DEFAULT_FILTERS, 0));
    const args = publicRolesArgs(DEFAULT_FILTERS, 50);
    expect(args).toMatchObject({ p_families: [], p_levels: [], p_offset: 50 });
    expect(args).not.toHaveProperty("p_sort");
  });
  it("keeps each role's signals, and sends the posting filters only when one is set", async () => {
    const signals = { salary: { min: 90000, max: 120000, currency: "USD", period: "year", ote: false, quote: "$90k to $120k a year." } };
    const { db: d, rpc } = db([{ ...row, signals }, { ...row, id: 8 }]);
    const r = await loadPublicRoles(d, { ...DEFAULT_FILTERS, minSalary: 100000 }, 0);
    expect(r.ok && r.value.matches.map((m) => m.signals)).toEqual([signals, undefined]);
    expect(rpc).toHaveBeenCalledWith("fh_public_roles", expect.objectContaining({ p_min_salary: 100000 }));
    expect(publicRolesArgs(DEFAULT_FILTERS, 0)).not.toHaveProperty("p_hide_years");
    expect(publicRolesArgs(DEFAULT_FILTERS, 0)).not.toHaveProperty("p_min_salary");
  });
  it("says so when it cannot read them", async () => {
    expect(await loadPublicRoles(db(null, { message: "no" }).db, DEFAULT_FILTERS, 0)).toEqual({ ok: false, message: PUBLIC_COPY.loadFailed });
  });
});

describe("loadStats: the numbers strip", () => {
  it("reads the three numbers, as numbers or digits", async () => {
    expect(await loadStats(db([{ open_roles: 19173, added_week: "412", hiring_companies: 1372 }]).db)).toEqual({ ok: true, value: { openRoles: 19173, addedWeek: 412, hiringCompanies: 1372 } });
  });
  it("says so when a number is missing", async () => {
    expect(await loadStats(db([{ open_roles: 1 }]).db)).toEqual({ ok: false, message: PUBLIC_COPY.statsFailed });
  });
});

describe("rpcWithRetry: the first read after the database has been idle", () => {
  it("tries once more after a statement timeout, and not after any other error", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { message: "canceling statement due to statement timeout" } }).mockResolvedValueOnce({ data: [1], error: null });
    expect(await rpcWithRetry({ rpc } as unknown as PublicDb, "fh_public_stats", {})).toEqual({ data: [1], error: null });
    expect(rpc).toHaveBeenCalledTimes(2);
    const other = vi.fn(async () => ({ data: null, error: { message: "permission denied" } }));
    await rpcWithRetry({ rpc: other } as unknown as PublicDb, "fh_public_stats", {});
    expect(other).toHaveBeenCalledTimes(1);
  });
});

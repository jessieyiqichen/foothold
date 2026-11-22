import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPANIES_COPY, companiesCount, hiringLine } from "./copy";
import { companiesArgs, loadCompanies, rowToCompany, type CompaniesDb } from "./remote";
import type { CompanyFilters } from "./types";

const filters: CompanyFilters = { query: "", stage: "", backer: "", hiring: true, sort: "recent" };
const row = { company_id: 3475, name: "Bolna AI", one_liner: "Voice AI", stage: "Early", batch: "F25", investors: [], open_roles: 10, last_posted_at: "2026-11-20T00:00:00Z", score: null, total: 1372 };
let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logged = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => logged.mockRestore());

describe("companies", () => {
  it("turns filters into the function's arguments: a stage group into its codes, a backer into a list", () => {
    expect(companiesArgs({ ...filters, query: "  voice ", stage: "ab", backer: "yc", sort: "fit" }, 50)).toEqual({
      p_query: "voice", p_stages: ["series_a", "series_b"], p_lists: ["yc"], p_hiring: true, p_sort: "fit", p_limit: 50, p_offset: 50,
    });
    expect(companiesArgs(filters, 0)).toMatchObject({ p_query: null, p_stages: [], p_lists: [] });
  });
  it("reads a row and drops one it cannot", () => {
    expect(rowToCompany(row)).toEqual({ companyId: 3475, name: "Bolna AI", oneLiner: "Voice AI", stage: "Early", batch: "F25", investors: [], openRoles: 10, lastPostedAt: "2026-11-20T00:00:00Z" });
    expect(rowToCompany({ ...row, name: "" })).toBeNull();
    expect(rowToCompany({ ...row, last_posted_at: "soon" })).toBeNull();
  });
  it("loads a page with its total, and says so when it cannot", async () => {
    const rpc = vi.fn(async () => ({ data: [row], error: null }));
    expect(await loadCompanies({ rpc } as unknown as CompaniesDb, filters, 0)).toMatchObject({ ok: true, value: { total: 1372 } });
    const broken = vi.fn(async () => ({ data: null, error: { message: "no" } }));
    expect(await loadCompanies({ rpc: broken } as unknown as CompaniesDb, filters, 0)).toEqual({ ok: false, message: COMPANIES_COPY.loadFailed });
  });
  it("says how many and how they are hiring, without full stops", () => {
    expect(companiesCount(1372)).toBe("1,372 companies");
    expect(hiringLine(10, "2026-11-20T00:00:00Z", new Date("2026-11-22T12:00:00Z"))).toBe("10 open roles, newest 2 days ago");
    expect(hiringLine(0, null)).toBe("No open roles right now");
    for (const line of Object.values(COMPANIES_COPY)) expect(line).not.toMatch(/\.(\s|$)/);
  });
});

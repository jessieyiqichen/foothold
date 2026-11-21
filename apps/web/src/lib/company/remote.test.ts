import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { row } from "../cards/testRow";
import { COMPANY_COPY } from "./copy";
import { loadCompany, type CompanyDb } from "./remote";

const db = (answer: { data: unknown; error: { message: string } | null }) => {
  const rpc = vi.fn(async () => answer);
  return { db: { rpc } as unknown as CompanyDb, rpc };
};
let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => { logged = vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => logged.mockRestore());

describe("loadCompany", () => {
  it("asks by company or by role", async () => {
    const a = db({ data: [{ ...row, best_role: 41, decision: null, decided_at: null }], error: null });
    expect((await loadCompany(a.db, { company: 812 })).ok).toBe(true);
    expect(a.rpc).toHaveBeenCalledWith("fh_company", { p_company: 812, p_role: null });
    await loadCompany(a.db, { role: 41 });
    expect(a.rpc).toHaveBeenLastCalledWith("fh_company", { p_company: null, p_role: 41 });
  });
  it("answers null when there is no such company", async () => {
    expect(await loadCompany(db({ data: [], error: null }).db, { company: 1 })).toEqual({ ok: true, value: null });
  });
  it("gives the page's line when the read fails or the answer cannot be read", async () => {
    expect(await loadCompany(db({ data: null, error: { message: "boom" } }).db, { company: 1 })).toEqual({ ok: false, message: COMPANY_COPY.loadFailed });
    expect(await loadCompany(db({ data: [{ name: 3 }], error: null }).db, { company: 1 })).toEqual({ ok: false, message: COMPANY_COPY.loadFailed });
  });
});

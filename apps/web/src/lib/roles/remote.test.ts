import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MATCHES_COPY } from "../matches/copy";
import { FACETS_RPC, ROLES_RPC } from "./constants";
import { DEFAULT_FILTERS } from "./filters";
import { loadFacets, loadRoles, type RolesDb } from "./remote";

const row = {
  id: 1, title: "Product Analyst", company_name: "Acme", url: "https://jobs.example.com/1", locations: ["Remote"],
  posted_at: "2026-11-10T10:00:00Z", family: "data", level: "entry", shared: ["sql"], score: 3, total: 807,
};

function fakeDb(data: unknown, fail = false) {
  const calls: unknown[] = [];
  const db = { rpc: async (name: string, args: unknown) => { calls.push([name, args]); return fail ? { data: null, error: { message: "function fh_roles does not exist" } } : { data, error: null }; } };
  return { db: db as unknown as RolesDb, calls };
}

let logged: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  logged = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logged.mockRestore();
});

describe("loadRoles", () => {
  it("asks fh_roles with the filters and reads the rows and the count", async () => {
    const { db, calls } = fakeDb([row]);
    const result = await loadRoles(db, DEFAULT_FILTERS, 0);
    expect(calls).toEqual([[ROLES_RPC, { p_families: null, p_levels: null, p_days: 60, p_query: null, p_place: null, p_sort: "fit", p_limit: 50, p_offset: 0 }]]);
    expect(result).toMatchObject({ ok: true, value: { total: 807 } });
  });

  it("gives a line and logs the cause when the request fails", async () => {
    expect(await loadRoles(fakeDb(null, true).db, DEFAULT_FILTERS, 0)).toEqual({ ok: false, message: MATCHES_COPY.loadFailed });
    expect(logged).toHaveBeenCalled();
  });
});

describe("loadFacets", () => {
  it("asks fh_roles_facets with the filters", async () => {
    const { db, calls } = fakeDb([{ facet: "level", value: "entry", n: 4 }]);
    const result = await loadFacets(db, DEFAULT_FILTERS);
    expect(calls).toEqual([[FACETS_RPC, { p_families: null, p_levels: null, p_days: 60, p_query: null, p_place: null }]]);
    expect(result.ok && result.value.level.get("entry")).toBe(4);
  });

  it("is a failure, logged, that the page shows as no counts", async () => {
    expect((await loadFacets(fakeDb(null, true).db, DEFAULT_FILTERS)).ok).toBe(false);
    expect(logged).toHaveBeenCalled();
  });
});

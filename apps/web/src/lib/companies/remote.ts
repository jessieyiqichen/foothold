// Companies, for anyone (fh_companies_list in 20261122100000_foothold_public_browse.sql): company facts and how many
// open roles, never anything about a person. "fit" is ordered by the caller's own match when signed in.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { rpcWithRetry } from "../public/remote";
import { COMPANIES_PAGE_SIZE, COMPANIES_RPC, STAGE_GROUPS } from "./constants";
import { COMPANIES_COPY } from "./copy";
import type { CompaniesPage, CompanyFilters, CompanyRow } from "./types";

export type CompaniesDb = Pick<SupabaseClient, "rpc">;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const whole = (v: unknown): number | null => {
  const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v;
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
};

export function rowToCompany(row: unknown): CompanyRow | null {
  if (!isRecord(row)) return null;
  const [id, roles] = [whole(row.company_id), whole(row.open_roles)];
  const name = text(row.name);
  const at = row.last_posted_at;
  if (id === null || id === 0 || roles === null || !name) return null;
  if (!(at === null || (typeof at === "string" && !Number.isNaN(Date.parse(at))))) return null;
  const investors = Array.isArray(row.investors) ? row.investors.filter((i): i is string => typeof i === "string") : [];
  return { companyId: id, name, oneLiner: text(row.one_liner), stage: text(row.stage), batch: text(row.batch), investors, openRoles: roles, lastPostedAt: at };
}

export const companiesArgs = (f: CompanyFilters, offset: number) => ({
  p_query: f.query.trim().slice(0, 100) || null,
  p_stages: f.stage ? [...(STAGE_GROUPS.find((g) => g.id === f.stage)?.codes ?? [])] : [],
  p_lists: f.backer ? [f.backer] : [],
  p_hiring: f.hiring,
  p_sort: f.sort,
  p_limit: COMPANIES_PAGE_SIZE,
  p_offset: offset,
});

export async function loadCompanies(db: CompaniesDb, f: CompanyFilters, offset: number): Promise<Result<CompaniesPage>> {
  try {
    const { data, error } = await rpcWithRetry(db, COMPANIES_RPC, companiesArgs(f, offset));
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error("the answer was not a list");
    const rows = data.map(rowToCompany).filter((r): r is CompanyRow => r !== null);
    if (rows.length < data.length) console.error(`Foothold: left out ${data.length - rows.length} rows from ${COMPANIES_RPC} that could not be read`);
    const total = whole(isRecord(data[0]) ? data[0].total : 0) ?? rows.length;
    return ok({ rows, total: Math.max(total, rows.length) });
  } catch (cause) {
    console.error(`Foothold: could not load ${COMPANIES_RPC}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(COMPANIES_COPY.loadFailed);
  }
}

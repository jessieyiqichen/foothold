// What a signed-out visitor reads (Jobs and Companies open to everyone, user 2026-11-21): only through the public
// functions in 20261122100000_foothold_public_browse.sql, which return company facts and role titles, places, dates
// and links, nothing about any person. The same calls work signed in.
import type { SupabaseClient } from "@supabase/supabase-js";
import { readMatches } from "../matches/rows";
import type { MatchesPage } from "../matches/types";
import { fail, ok, type Result } from "../profile/types";
import { ROLES_PAGE_SIZE } from "../roles/constants";
import { facetsArgs, type RoleFilters } from "../roles/filters";
import { PUBLIC_COPY } from "./copy";

export type PublicDb = Pick<SupabaseClient, "rpc">;
export const PUBLIC_ROLES_RPC = "fh_public_roles";
export const STATS_RPC = "fh_public_stats";

export interface Stats { openRoles: number; addedWeek: number; hiringCompanies: number }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const count = (v: unknown): number | null => {
  const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v;
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
};

/** A signed-out visitor's request runs under the anonymous role's 3 s limit; the first read after the database has been
 *  idle can pass it while it loads the postings from disk (2026-11-22, local: timed out once, then 0.2 s). One retry. */
export async function rpcWithRetry(db: PublicDb, name: string, args: object) {
  const first = await db.rpc(name, args);
  return first.error && /statement timeout/i.test(first.error.message) ? db.rpc(name, args) : first;
}

async function ask<T>(db: PublicDb, name: string, args: object, read: (data: unknown) => T | null, message: string): Promise<Result<T>> {
  try {
    const { data, error } = await rpcWithRetry(db, name, args);
    if (error) throw new Error(error.message);
    const value = read(data);
    if (value === null) throw new Error("the answer was not in the expected shape");
    return ok(value);
  } catch (cause) {
    console.error(`Foothold: could not load ${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(message);
  }
}

/** The filters as fh_public_roles takes them: a kind of work or level left to the profile means none (there is no
 *  profile), and the order is always newest first. */
export const publicRolesArgs = (filters: RoleFilters, offset: number) =>
  ({ ...facetsArgs(filters), p_families: filters.families ?? [], p_levels: filters.levels ?? [], p_limit: ROLES_PAGE_SIZE, p_offset: offset });

/** A page of roles for a signed-out visitor, read and checked as on the signed-in list. A public row has no skills or
 *  score (those need a resume), so it is read with none. */
export function loadPublicRoles(db: PublicDb, filters: RoleFilters, offset: number): Promise<Result<MatchesPage>> {
  return ask(db, PUBLIC_ROLES_RPC, publicRolesArgs(filters, offset), (data) => {
    if (!Array.isArray(data)) return null;
    const page = readMatches(data.map((row) => (isRecord(row) ? { ...row, shared: [], score: 0 } : row)));
    if (page && page.dropped > 0) console.error(`Foothold: left out ${page.dropped} rows from ${PUBLIC_ROLES_RPC} that could not be read`);
    return page;
  }, PUBLIC_COPY.loadFailed);
}

/** The numbers strip: open roles, roles added this week, companies hiring. */
export function loadStats(db: PublicDb): Promise<Result<Stats>> {
  return ask(db, STATS_RPC, {}, (data) => {
    const row = Array.isArray(data) ? data[0] : data;
    if (!isRecord(row)) return null;
    const [openRoles, addedWeek, hiringCompanies] = [count(row.open_roles), count(row.added_week), count(row.hiring_companies)];
    return openRoles === null || addedWeek === null || hiringCompanies === null ? null : { openRoles, addedWeek, hiringCompanies };
  }, PUBLIC_COPY.statsFailed);
}

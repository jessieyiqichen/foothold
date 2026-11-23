// All roles and their counts, asked for as the signed-in person: fh_roles and fh_roles_facets read the caller's own
// profile when a filter is left to it.
import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCHES_COPY } from "../matches/copy";
import { readMatches } from "../matches/rows";
import type { MatchesPage } from "../matches/types";
import { fail, ok, type Result } from "../profile/types";
import { FACETS_RPC, ROLES_RPC } from "./constants";
import { readFacets, type Facets } from "./facets";
import { facetsArgs, rolesArgs, type RoleFilters } from "./filters";

export type RolesDb = Pick<SupabaseClient, "rpc">;

/** One request; the database refusing it, the request never arriving and an answer that is not a list all end as
 *  `message`, the cause logged. */
async function ask<T>(db: RolesDb, name: string, args: object, read: (data: unknown) => T | null, message: string): Promise<Result<T>> {
  try {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error(error.message);
    const value = read(data);
    if (value === null) throw new Error("the answer was not a list of rows");
    return ok(value);
  } catch (cause) {
    console.error(`Foothold: could not load ${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(message);
  }
}

/** One page of roles for the filters, starting `offset` rows in; rows are read and checked as on the matches list. */
export function loadRoles(db: RolesDb, filters: RoleFilters, offset: number, levels: readonly string[] = []): Promise<Result<MatchesPage>> {
  return ask(db, ROLES_RPC, rolesArgs(filters, offset, levels), (data) => {
    const page = readMatches(data);
    if (page && page.dropped > 0) console.error(`Foothold: left out ${page.dropped} rows from ${ROLES_RPC} that could not be read`);
    return page;
  }, MATCHES_COPY.loadFailed);
}

/** The counts beside each option for the filters. A failure leaves the options without counts. `levels`: the profile's,
 *  for the years filter's default. */
export function loadFacets(db: RolesDb, filters: RoleFilters, levels: readonly string[] = []): Promise<Result<Facets>> {
  return ask(db, FACETS_RPC, facetsArgs(filters, levels), readFacets, MATCHES_COPY.loadFailed);
}

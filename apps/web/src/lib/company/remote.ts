// One company's page, read as the person: fh_company answers for the caller only.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { COMPANY_RPC } from "./constants";
import { COMPANY_COPY } from "./copy";
import { readCompany } from "./rows";
import type { CompanyBy, CompanyPage } from "./types";

export type CompanyDb = Pick<SupabaseClient, "rpc">;

/** The page, null when there is no such company (or the role has none), or a line when the read failed. */
export async function loadCompany(db: CompanyDb, by: CompanyBy): Promise<Result<CompanyPage | null>> {
  const args = "company" in by ? { p_company: by.company, p_role: null } : { p_company: null, p_role: by.role };
  try {
    const { data, error } = await db.rpc(COMPANY_RPC, args);
    if (error) throw new Error(error.message);
    if (Array.isArray(data) && data.length === 0) return ok(null);
    const page = readCompany(data);
    if (!page) throw new Error("the answer was not in the expected shape");
    return ok(page);
  } catch (cause) {
    console.error(`Foothold: could not load ${COMPANY_RPC}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(COMPANY_COPY.loadFailed);
  }
}

/** A role's posting address, for a role with no company page; null when it cannot be read or is not https. */
export async function loadPostingUrl(db: Pick<SupabaseClient, "from">, roleId: number): Promise<string | null> {
  try {
    const { data, error } = await db.from("fh_postings").select("url").eq("id", roleId).maybeSingle();
    if (error) throw new Error(error.message);
    const url = data && typeof (data as { url?: unknown }).url === "string" ? (data as { url: string }).url : null;
    return url && url.startsWith("https://") ? url : null;
  } catch (cause) {
    console.error(`Foothold: could not read a posting's address: ${cause instanceof Error ? cause.message : String(cause)}`);
    return null;
  }
}

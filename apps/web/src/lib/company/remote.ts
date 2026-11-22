// One company's page, read as the person: fh_company answers for the caller only.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "../profile/types";
import { rpcWithRetry } from "../public/remote";
import { COMPANY_RPC, PUBLIC_COMPANY_RPC } from "./constants";
import { COMPANY_COPY } from "./copy";
import { readCompany } from "./rows";
import type { CompanyBy, CompanyPage } from "./types";

export type CompanyDb = Pick<SupabaseClient, "rpc">;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** A public row (fh_public_company) as the page reads it: nothing personal, so no skills, score, person or decision. */
const asPublic = (data: unknown) => (Array.isArray(data)
  ? data.map((row) => (isRecord(row) ? { ...row, shared: [], score: 0, person: null, best_role: null, decision: null, decided_at: null } : row))
  : data);

/** The page, null when there is no such company (or the role has none), or a line when the read failed. `mode`
 *  "public" reads it for a signed-out visitor, through fh_public_company (user, 2026-11-21). */
export async function loadCompany(db: CompanyDb, by: CompanyBy, mode: "mine" | "public" = "mine"): Promise<Result<CompanyPage | null>> {
  const args = "company" in by ? { p_company: by.company, p_role: null } : { p_company: null, p_role: by.role };
  const name = mode === "public" ? PUBLIC_COMPANY_RPC : COMPANY_RPC;
  try {
    const answer = mode === "public" ? await rpcWithRetry(db, name, args) : await db.rpc(name, args);
    const { error } = answer;
    const data = mode === "public" ? asPublic(answer.data) : answer.data;
    if (error) throw new Error(error.message);
    if (Array.isArray(data) && data.length === 0) return ok(null);
    const page = readCompany(data);
    if (!page) throw new Error("the answer was not in the expected shape");
    return ok(page);
  } catch (cause) {
    console.error(`Foothold: could not load ${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
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

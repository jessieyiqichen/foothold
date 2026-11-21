// The person's kept edits to drafts (fh_draft_edits), read and cleared with their own client on the profile page.
// Row-level security keeps them to their own rows; the explicit user filter says so in the request too.
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROFILE_COPY } from "../profile/copy";
import { fail, ok, type Result } from "../profile/types";
import { EDITS_KEPT, EDITS_TABLE } from "./constants";

export interface KeptEdit { id: number; before: { subject: string; body: string }; after: { subject: string; body: string }; createdAt: string }
type Db = Pick<SupabaseClient, "from">;

const str = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export function rowToEdit(row: unknown): KeptEdit | null {
  const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const id = typeof r.id === "string" && /^\d+$/.test(r.id) ? Number(r.id) : r.id;
  if (typeof id !== "number" || !str(r.before_subject) || !str(r.before_body) || !str(r.after_subject) || !str(r.after_body) || !str(r.created_at)) return null;
  return { id, before: { subject: r.before_subject, body: r.before_body }, after: { subject: r.after_subject, body: r.after_body }, createdAt: r.created_at };
}

export async function loadEdits(db: Db, userId: string): Promise<Result<KeptEdit[]>> {
  try {
    const { data, error } = await db.from(EDITS_TABLE).select("id, before_subject, before_body, after_subject, after_body, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(EDITS_KEPT);
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error("the answer was not a list");
    return ok(data.map(rowToEdit).filter((e): e is KeptEdit => e !== null));
  } catch (cause) {
    console.error(`Foothold: could not load ${EDITS_TABLE}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(PROFILE_COPY.memoryFailed);
  }
}

/** Deletes every edit the person kept; the next draft starts fresh. */
export async function clearEdits(db: Db, userId: string): Promise<Result<null>> {
  try {
    const { error } = await db.from(EDITS_TABLE).delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return ok(null);
  } catch (cause) {
    console.error(`Foothold: could not clear ${EDITS_TABLE}: ${cause instanceof Error ? cause.message : String(cause)}`);
    return fail(PROFILE_COPY.memoryClearFailed);
  }
}

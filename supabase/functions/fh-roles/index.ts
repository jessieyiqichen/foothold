// Foothold roles worker, one task:
//   {"limit":500}  labels the next postings whose family and level come from an older version of the title rules
//                  (packages/core/src/roles.ts), or from none. When a call finds fewer than it asked for, nothing is
//                  left: it then recounts how many postings carry each skill tag (fh_tag_counts), which the match
//                  query uses to make rare tags worth more. A call with nothing to label reads once and writes
//                  nothing: the function has no key of its own, so a stranger's call must cost next to nothing.
//                  After a re-tag, the lead recounts by running fh_refresh_tag_counts() in the database.
// It writes with the project's secret key, which Supabase gives the function on its own servers.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { pickLimit, reachedEnd, readPostings, shouldRecount, withRoles } from "./lib/batch.ts";
import { familyOf, levelOf, ROLES_VERSION } from "../../../packages/core/src/roles.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RUN_SOURCE = "roles";

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Labels the next batch. `done` is true when this call reached the end, and `tags` is then the number of tags counted. */
async function runRoles(db: SupabaseClient, limit: number) {
  const { data, error } = await db.from("fh_postings").select("id, title")
    .lt("roles_version", ROLES_VERSION).order("id").limit(limit);
  if (error) throw new Error(`fh_postings: ${error.message}`);
  const read = Array.isArray(data) ? data.length : 0;
  const rows = withRoles(readPostings(data), familyOf, levelOf);
  if (rows.length < read) throw new Error(`fh_postings: ${read - rows.length} of ${read} rows had no usable id`);
  let labelled = 0;
  if (rows.length > 0) {
    // The count comes from the database: a posting deleted since the read is not counted as labelled
    const { data: updated, error: setError } = await db.rpc("fh_set_roles", { version: ROLES_VERSION, rows });
    if (setError) throw new Error(`fh_set_roles: ${setError.message}`);
    labelled = typeof updated === "number" ? updated : 0;
  }
  const done = reachedEnd(read, limit);
  if (!shouldRecount(read, limit, labelled)) return { labelled, version: ROLES_VERSION, done, tags: null };
  const { data: tags, error: countError } = await db.rpc("fh_refresh_tag_counts");
  if (countError) throw new Error(`fh_refresh_tag_counts: ${countError.message}`);
  return { labelled, version: ROLES_VERSION, done, tags: typeof tags === "number" ? tags : null };
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SECRET_KEY) return json({ ok: false, error: "missing Supabase settings" }, 500);
  let body: { limit?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: "body must be JSON" }, 400); }
  if (typeof body !== "object" || body === null) return json({ ok: false, error: "body must be a JSON object" }, 400);

  const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const started = new Date();
  let out: Record<string, unknown> = {};
  let written = 0;
  let failure: string | null = null;
  try {
    const r = await runRoles(db, pickLimit(body.limit));
    written = r.labelled;
    out = r;
  } catch (e) {
    failure = (e instanceof Error ? e.message : String(e)).slice(0, 500);
  }
  const finished = new Date();
  const ok = failure === null;
  // A call that found nothing to do leaves no row behind (see the header): nothing for a stranger to fill a table with
  if (ok && written === 0) return json({ task: RUN_SOURCE, ok, written, ...out, ms: finished.getTime() - started.getTime() });
  const { error: runError } = await db.from("fh_runs").insert({
    source: RUN_SOURCE, started_at: started.toISOString(), finished_at: finished.toISOString(), ok, rows_written: written, error: failure,
  });
  const log = { task: RUN_SOURCE, ok, written, ...out, ms: finished.getTime() - started.getTime(), error: failure, bookkeeping: runError?.message ?? null };
  (ok && !runError ? console.log : console.error)(JSON.stringify(log));
  // The caller is told that it failed, not why: the database's own wording stays in the function log
  return json(ok ? log : { task: RUN_SOURCE, ok, written, error: "failed, see the function log" }, ok ? 200 : 502);
});

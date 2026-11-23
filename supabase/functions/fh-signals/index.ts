// Foothold signals worker (docs/judge-signals.md), two tasks:
//   {"task":"rules","limit":500}  reads the next open postings with no signals row, an older SIGNALS_VERSION, or a text
//                                 whose md5 changed (fh_claim_signals), reads years, salary, visa, equity and 401(k)
//                                 with the rules in lib/, and writes them through fh_set_signals. Free, and callable by
//                                 anyone: a call with nothing to do writes nothing, not even a run row.
//   {"task":"model","limit":50}   sends the pending sentences of the next rows to Gemini (SIGNALS_MODEL), several
//                                 postings a request, at most MODEL_REQUESTS_MAX requests a call; writes the decisions
//                                 and clears pending; returns the tokens used. Only with the header x-fh-worker-key
//                                 equal to the secret FH_WORKER_KEY, and the secret GEMINI_API_KEY: a stranger must not
//                                 spend the paid key. Without FH_WORKER_KEY set, the task is refused to everyone.
//                                 A failed request counts a try against its rows; after MODEL_TRIES_MAX tries a row's
//                                 pending is cleared and the rules' values stand.
// Never logged: a posting's text, a sentence, a key. A failure is logged here and told to the caller only as "failed".
// It writes with the project's secret key, which Supabase gives the function on its own servers.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { extractSignals, SIGNALS_VERSION } from "./lib/extract.ts";
import {
  MODEL_LIMIT_DEFAULT, MODEL_LIMIT_MAX, MODEL_TRIES_MAX, pickLimit, reachedEnd, readClaimed, readSetResult, readStored,
  RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX, type SetResult, type SignalRow, toRow,
} from "./lib/rows.ts";
import {
  addUsage, applyDecisions, batchRequests, type Decision, GEMINI_ENDPOINT, MODEL_REQUESTS_MAX, parseDecisions, requestBody,
  SIGNALS_MODEL, type Usage, usageOf,
} from "./lib/model.ts";
import { sameSecret } from "./lib/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TIMEOUT_MS = 30_000;
const STORED_COLUMNS = "posting_id, text_md5, years_min, years_required, years_quote, salary_min, salary_max, salary_currency, "
  + "salary_period, salary_ote, salary_quote, visa, visa_quote, equity, equity_quote, k401, k401_quote, pending, settled_by";

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Writes rows through fh_set_signals; the counts come from the database (written, written empty, skipped). */
async function write(db: SupabaseClient, rows: SignalRow[]): Promise<SetResult> {
  if (rows.length === 0) return { written: 0, emptied: 0, skipped: 0 };
  const { data, error } = await db.rpc("fh_set_signals", { version: SIGNALS_VERSION, rows });
  if (error) throw new Error(`fh_set_signals: ${error.message}`);
  return readSetResult(data);
}

/** Counts a failed request against its rows; returns how many reached MODEL_TRIES_MAX and had pending cleared. */
async function countFailure(db: SupabaseClient, ids: number[]): Promise<number> {
  const { data, error } = await db.rpc("fh_signals_model_failed", { ids });
  if (error) throw new Error(`fh_signals_model_failed: ${error.message}`);
  return typeof data === "number" ? data : 0;
}

async function runRules(db: SupabaseClient, limit: number) {
  const { data, error } = await db.rpc("fh_claim_signals", { n: limit, p_version: SIGNALS_VERSION });
  if (error) throw new Error(`fh_claim_signals: ${error.message}`);
  const read = Array.isArray(data) ? data.length : 0;
  const claimed = readClaimed(data);
  if (claimed.length < read) throw new Error(`fh_claim_signals: ${read - claimed.length} of ${read} rows had no usable id or md5`);
  const changed = claimed.flatMap((c) => (c.text === null ? [] : [toRow(c.id, c.md5, extractSignals(c.text), "rules")]));
  const { written, emptied, skipped } = await write(db, changed);
  const pending = changed.filter((r) => r.pending !== null).length;
  return {
    written: written + emptied, with_values: written, emptied, skipped, unchanged: claimed.length - changed.length, pending,
    version: SIGNALS_VERSION, done: reachedEnd(read, limit),
  };
}

/** One request to Gemini: the parsed decisions and usage, or null when it failed (logged without its body). */
/** decisions is null when the reply came back but cannot be used (not finished, not JSON, not the schema). */
async function ask(apiKey: string, items: ReturnType<typeof batchRequests>[number]): Promise<{ decisions: Map<number, Decision[]> | null; usage: Usage } | null> {
  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody(items)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ task: "model", gemini_status: res.status, sentences: items.length }));
      await res.body?.cancel();
      return null;
    }
    const reply: unknown = await res.json();
    return { decisions: parseDecisions(reply, items), usage: usageOf(reply) };
  } catch (e) {
    console.error(JSON.stringify({ task: "model", gemini_error: e instanceof Error ? e.name : "unknown", sentences: items.length }));
    return null;
  }
}

async function runModel(db: SupabaseClient, limit: number, apiKey: string) {
  const { data, error } = await db.from("fh_posting_signals").select(STORED_COLUMNS)
    .not("pending", "is", null).eq("version", SIGNALS_VERSION).lt("model_tries", MODEL_TRIES_MAX).order("posting_id").limit(limit);
  if (error) throw new Error(`fh_posting_signals: ${error.message}`);
  const rows = (Array.isArray(data) ? data : []).map(readStored);
  const stored = rows.flatMap((r) => (r ? [r] : []));
  const batches = batchRequests(stored.map((s) => ({ id: s.id, pending: s.signals.pending }))).slice(0, MODEL_REQUESTS_MAX);
  let usage: Usage = { prompt: 0, output: 0, thoughts: 0, total: 0 };
  const out: SignalRow[] = [];
  let failed = 0;
  let gaveUp = 0;
  let asked = 0;
  for (const items of batches) {
    asked++;
    const answer = await ask(apiKey, items);
    const ids = [...new Set(items.map((it) => it.postingId))];
    if (!answer) { // a refused or broken request is not repeated in the same call
      failed++;
      gaveUp += await countFailure(db, ids);
      break;
    }
    usage = addUsage(usage, answer.usage);
    if (answer.decisions === null) { // an unusable reply: those postings keep their pending sentences, one try spent
      failed++;
      gaveUp += await countFailure(db, ids);
      console.error(JSON.stringify({ task: "model", unusable_reply: true, sentences: items.length }));
      continue;
    }
    for (const id of new Set(items.map((it) => it.postingId))) {
      const s = stored.find((x) => x.id === id);
      if (!s) continue;
      const { signals, settled } = applyDecisions(s.signals, answer.decisions.get(id) ?? []);
      out.push(toRow(s.id, s.md5, signals, settled ? SIGNALS_MODEL : s.settledBy));
    }
  }
  const { written, emptied, skipped } = await write(db, out);
  return {
    written: written + emptied, with_values: written, emptied, skipped, requests: asked, failed_requests: failed,
    gave_up: gaveUp, malformed: rows.length - stored.length, model: SIGNALS_MODEL, tokens: usage,
  };
}

/** Which task, and whether the caller may run it; null when allowed. */
function refuse(req: Request, task: unknown): Response | null {
  if (task !== "rules" && task !== "model") return json({ ok: false, error: 'task must be "rules" or "model"' }, 400);
  if (task === "model" && !sameSecret(req.headers.get("x-fh-worker-key"), Deno.env.get("FH_WORKER_KEY"))) {
    return json({ ok: false, error: "not allowed" }, 401);
  }
  if (task === "model" && !Deno.env.get("GEMINI_API_KEY")) return json({ ok: false, error: "model not configured" }, 503);
  return null;
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SECRET_KEY) return json({ ok: false, error: "missing Supabase settings" }, 500);
  let body: { task?: unknown; limit?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: "body must be JSON" }, 400); }
  if (typeof body !== "object" || body === null) return json({ ok: false, error: "body must be a JSON object" }, 400);
  const refused = refuse(req, body.task);
  if (refused) return refused;
  const task = body.task as "rules" | "model";
  const source = task === "rules" ? "signals" : "signals-model";

  const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const started = new Date();
  let out: Record<string, unknown> = {};
  let written = 0;
  let failure: string | null = null;
  try {
    const r = task === "rules"
      ? await runRules(db, pickLimit(body.limit, RULES_LIMIT_DEFAULT, RULES_LIMIT_MAX))
      : await runModel(db, pickLimit(body.limit, MODEL_LIMIT_DEFAULT, MODEL_LIMIT_MAX), Deno.env.get("GEMINI_API_KEY") ?? "");
    written = r.written;
    out = r;
  } catch (e) {
    failure = (e instanceof Error ? e.message : String(e)).slice(0, 500);
  }
  const finished = new Date();
  const ok = failure === null && !(typeof out.failed_requests === "number" && out.failed_requests > 0 && written === 0);
  const ms = finished.getTime() - started.getTime();
  // A call that found nothing to do leaves no row behind: nothing for a stranger to fill a table with
  if (failure === null && written === 0 && !(typeof out.failed_requests === "number" && out.failed_requests > 0)) {
    return json({ task, ok: true, written, ...out, ms });
  }
  const { error: runError } = await db.from("fh_runs").insert({
    source, started_at: started.toISOString(), finished_at: finished.toISOString(), ok, rows_written: written,
    error: failure ?? (ok ? null : "model request failed"),
  });
  const log = { task, ok, written, ...out, ms, error: failure, bookkeeping: runError?.message ?? null };
  (ok && !runError ? console.log : console.error)(JSON.stringify(log));
  // The caller is told that it failed, not why: the database's or the model's own wording stays in the function log
  return json(ok ? log : { task, ok, written, error: "failed, see the function log" }, ok ? 200 : 502);
});

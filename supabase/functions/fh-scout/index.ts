// Foothold Scout. Supabase Cron calls it with {"source":"yc"} weekly and {"source":"hn"} daily; it can also be called
// by hand. It reads one source, keeps every valid row, writes them keyed on (source, source_id), links HN postings to
// YC companies of the same name, and records the run. It writes with the project's secret key, which Supabase gives
// the function on its own servers: it is never in code.

import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchHnThread, fetchYc, latestHiringThreadId } from "./lib/fetch.ts";
import { parseHnThread, parseYcCompanies } from "./lib/parse.ts";
import { linkPostings, upsertCompanies, upsertPostings } from "./store.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SOURCES = ["yc", "hn"] as const;
type Source = (typeof SOURCES)[number];

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function readSource(req: Request): Promise<Source | null> {
  try {
    const body = (await req.json()) as { source?: unknown };
    return SOURCES.includes(body?.source as Source) ? (body.source as Source) : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error(JSON.stringify({ ok: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing" }));
    return json({ ok: false }, 500);
  }
  const source = await readSource(req);
  if (!source) return json({ ok: false, error: 'body must be {"source":"yc"} or {"source":"hn"}' }, 400);

  const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const started = new Date();
  let written = 0;
  let linked = 0;
  let failure: string | null = null;
  try {
    if (source === "yc") {
      const companies = parseYcCompanies(await fetchYc());
      if (companies.length === 0) throw new Error("the YC list parsed to no companies: the JSON may have changed");
      written = await upsertCompanies(db, companies);
    } else {
      const threadId = await latestHiringThreadId();
      const postings = parseHnThread(await fetchHnThread(threadId));
      if (postings.length === 0) throw new Error(`thread ${threadId} parsed to no postings`);
      written = await upsertPostings(db, postings);
    }
    linked = await linkPostings(db);
  } catch (e) {
    failure = (e instanceof Error ? e.message : String(e)).slice(0, 500);
  }
  const finished = new Date();
  const ok = failure === null;
  const { error: runError } = await db.from("fh_runs").insert({
    source, started_at: started.toISOString(), finished_at: finished.toISOString(), ok, rows_written: written, error: failure,
  });
  const log = { source, ok, written, linked, ms: finished.getTime() - started.getTime(), error: failure, bookkeeping: runError?.message ?? null };
  (ok && !runError ? console.log : console.error)(JSON.stringify(log));
  return json(log, ok ? 200 : 502);
});

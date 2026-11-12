// Foothold jobs worker, three tasks:
//   {"task":"vc","board":"accel"}  reads one VC job board's company list (Getro) into fh_companies
//   {"task":"ats","limit":20}      takes the next companies, looks for each one's public job board on Ashby,
//                                  Greenhouse, Lever, Gem, Rippling or BambooHR, and writes its open roles into
//                                  fh_postings. "systems":["gem","rippling"] tries only those; Workable is tried
//                                  only when named there, a few companies a call (it allows few requests a minute)
//   {"task":"tag","limit":200}     tags postings not yet tagged with this version of the skill vocabulary
// Only company lists come from the VC boards; the roles always come from the company's own board.
// It writes with the project's secret key, which Supabase gives the function on its own servers.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  type Ats, type AtsJob, boardUrl, DETAILS, parseGetroCompanies, PARSERS, pickSystems, slugCandidates, type VcCompany, withDetail,
} from "./lib/parse.ts";
import { SKILLS_VERSION } from "../../../packages/core/src/skills.ts";
import { tagsOf } from "../../../packages/core/src/tags.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const USER_AGENT = "Foothold/1.0 (class project; https://github.com/jessieyiqichen/foothold)";
const TIMEOUT_MS = 12_000;
/** Workable refuses a caller after about six requests a minute (429, measured 2026-11-11): its requests go one at a time, spaced. */
const WORKABLE_GAP_MS = 11_000;
/** Rippling's and BambooHR's lists have no descriptions: the first jobs' texts are read one by one, a few at a time. */
const DETAILS_MAX = 60;
const DETAILS_AT_ONCE = 5;
const DEFAULT_LIMIT = 20;
const TAG_LIMIT_DEFAULT = 200;
const TAG_LIMIT_MAX = 400;
const GETRO_PAGES_MAX = 120;
const CHUNK = 200;
/** Getro collection ids of the VC boards, read from each board's own page on 2026-11-10. */
const GETRO_BOARDS: Record<string, string> = {
  accel: "8672", "general-catalyst": "222", khosla: "257", thrive: "2105", lux: "103",
  insight: "246", "8vc": "1005", menlo: "767", notable: "764",
};

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function getJson(url: string, init: RequestInit = {}): Promise<unknown | null> {
  try {
    const res = await fetch(url, { ...init, headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? await res.json() : null;
  } catch {
    return null; // a missing board, a timeout or bad JSON all mean "not found here"
  }
}

async function importVcBoard(db: SupabaseClient, board: string): Promise<number> {
  const id = GETRO_BOARDS[board];
  if (!id) throw new Error(`unknown board "${board}"`);
  const byDomain = new Map<string, VcCompany>();
  for (let page = 0; page < GETRO_PAGES_MAX; page++) {
    const raw = await getJson(`https://api.getro.com/api/v2/collections/${id}/search/companies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hitsPerPage: 12, page, query: "", filters: "" }), // Getro serves 12 a page whatever is asked
    });
    if (raw === null) throw new Error(`Getro did not answer for ${board} page ${page}`);
    const rows = parseGetroCompanies(raw);
    if (rows.length === 0) break;
    const before = byDomain.size;
    for (const r of rows) byDomain.set(r.domain, r);
    if (byDomain.size === before) break; // a page with nothing new: the list has ended
  }
  if (byDomain.size === 0) throw new Error(`${board} gave no companies`);
  const all = [...byDomain.values()];
  for (let i = 0; i < all.length; i += CHUNK) {
    const { error } = await db.rpc("fh_upsert_vc_companies", { board, rows: all.slice(i, i + CHUNK) });
    if (error) throw new Error(`fh_upsert_vc_companies: ${error.message}`);
  }
  return all.length;
}

interface Claimed { id: number; name: string; slug: string | null; domain: string | null }
interface Found { ats: Ats; slug: string; jobs: AtsJob[] }

let workableFree: Promise<void> = Promise.resolve();
/** Waits for this request's turn on Workable: one at a time, WORKABLE_GAP_MS apart, across every company in the call. */
function workableTurn(): Promise<void> {
  const turn = workableFree;
  workableFree = turn.then(() => new Promise((done) => setTimeout(done, WORKABLE_GAP_MS)));
  return turn;
}

/** One board's answer. `limited` means the system refused us for now (429), which is not "no board here". */
async function getBoard(ats: Ats, slug: string): Promise<{ raw: unknown | null; limited: boolean }> {
  if (ats === "workable") await workableTurn();
  try {
    // BambooHR sends an unknown board name to its home page: that redirect is not followed.
    const res = await fetch(boardUrl(ats, slug), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, redirect: ats === "bamboohr" ? "manual" : "follow", signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 429) return { raw: null, limited: true };
    return { raw: res.ok ? await res.json() : null, limited: false };
  } catch {
    return { raw: null, limited: false }; // a timeout or bad JSON: not found here
  }
}

/** Jobs with their descriptions, on a system whose list has none, for the first DETAILS_MAX; the rest keep the title as text. */
async function withText(ats: Ats, slug: string, jobs: AtsJob[]): Promise<AtsJob[]> {
  const detail = DETAILS[ats];
  if (!detail) return jobs;
  const head = jobs.slice(0, DETAILS_MAX);
  const filled: AtsJob[] = [];
  for (let i = 0; i < head.length; i += DETAILS_AT_ONCE) {
    const part = head.slice(i, i + DETAILS_AT_ONCE);
    filled.push(...await Promise.all(part.map(async (j) => withDetail(j, detail.parse(await getJson(detail.url(slug, j.id)))))));
  }
  return [...filled, ...jobs.slice(DETAILS_MAX)];
}

/** The first board that answers with at least one job, trying each candidate name on each system asked for. */
async function findBoard(c: Claimed, systems: Ats[]): Promise<{ found: Found | null; limited: Ats[] }> {
  const limited = new Set<Ats>();
  for (const slug of slugCandidates(c)) {
    for (const ats of systems) {
      if (limited.has(ats)) continue;
      const board = await getBoard(ats, slug);
      if (board.limited) limited.add(ats);
      if (board.raw === null) continue;
      const jobs = PARSERS[ats](board.raw, slug);
      if (jobs.length > 0) return { found: { ats, slug, jobs: await withText(ats, slug, jobs) }, limited: [...limited] };
    }
  }
  return { found: null, limited: [...limited] };
}

async function checkCompany(db: SupabaseClient, c: Claimed, systems: Ats[]): Promise<number> {
  const { found, limited } = await findBoard(c, systems);
  if (!found && limited.length > 0) {
    // Not checked, not "no board": hand the company back so a later call takes it again, and fail the run so it is seen.
    const { error } = await db.from("fh_companies").update({ ats_checked_at: null }).eq("id", c.id);
    throw new Error(`${limited.join(", ")} refused us for now (429); ${c.name} ${error ? `could not be handed back: ${error.message}` : "was handed back"}`);
  }
  if (!found) return 0;
  const now = new Date().toISOString();
  const rows = found.jobs.map((j) => ({
    source: "ats", source_id: `${found.ats}:${found.slug}:${j.id}`, company_id: c.id, company_name: c.name,
    title: j.title, location: j.location, text: j.text, url: j.url, posted_at: j.postedAt, updated_at: now,
    tags: tagsOf(j.title, j.text), tags_version: SKILLS_VERSION,
  }));
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("fh_postings").upsert(rows.slice(i, i + CHUNK), { onConflict: "source,source_id" });
    if (error) throw new Error(`fh_postings (${c.name}): ${error.message}`);
  }
  const { error } = await db.from("fh_companies")
    .update({ ats: found.ats, ats_slug: found.slug, ats_jobs: rows.length, is_hiring: true }).eq("id", c.id);
  if (error) throw new Error(`fh_companies (${c.name}): ${error.message}`);
  return rows.length;
}

async function runAts(db: SupabaseClient, limit: number, systems: Ats[]) {
  const { data, error } = await db.rpc("fh_claim_companies", { n: limit });
  if (error) throw new Error(`fh_claim_companies: ${error.message}`);
  const claimed = (data ?? []) as Claimed[];
  const results = await Promise.allSettled(claimed.map((c) => checkCompany(db, c, systems)));
  const counts = results.map((r) => (r.status === "fulfilled" ? r.value : 0));
  const errors = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => String(r.reason).slice(0, 200));
  return { claimed: claimed.length, systems, found: counts.filter((n) => n > 0).length, written: counts.reduce((a, b) => a + b, 0), errors };
}

/** Tags the next postings whose tags are from an older vocabulary (or none). Returns how many are left. */
async function runTag(db: SupabaseClient, limit: number) {
  const { data, error } = await db.from("fh_postings").select("id, title, text")
    .lt("tags_version", SKILLS_VERSION).order("id").limit(limit);
  if (error) throw new Error(`fh_postings: ${error.message}`);
  const rows = ((data ?? []) as { id: number; title: string | null; text: string }[])
    .map((p) => ({ id: p.id, tags: tagsOf(p.title, p.text) }));
  if (rows.length > 0) {
    const { error: setError } = await db.rpc("fh_set_tags", { version: SKILLS_VERSION, rows });
    if (setError) throw new Error(`fh_set_tags: ${setError.message}`);
  }
  return { tagged: rows.length, version: SKILLS_VERSION };
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SECRET_KEY) return json({ ok: false, error: "missing Supabase settings" }, 500);
  let body: { task?: unknown; board?: unknown; limit?: unknown; systems?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: "body must be JSON" }, 400); }
  const task = body.task === "vc" || body.task === "ats" || body.task === "tag" ? body.task : null;
  if (!task) return json({ ok: false, error: 'task must be "vc", "ats" or "tag"' }, 400);

  const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const started = new Date();
  let out: Record<string, unknown> = {};
  let written = 0;
  let failure: string | null = null;
  try {
    if (task === "vc") {
      written = await importVcBoard(db, String(body.board ?? ""));
      out = { board: body.board };
    } else if (task === "tag") {
      const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit as number, 1), TAG_LIMIT_MAX) : TAG_LIMIT_DEFAULT;
      const r = await runTag(db, limit);
      written = r.tagged;
      out = r;
    } else {
      const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit as number, 1), 50) : DEFAULT_LIMIT;
      const r = await runAts(db, limit, pickSystems(body.systems));
      written = r.written;
      out = r;
      if (r.errors.length > 0) failure = r.errors.join(" | ").slice(0, 500);
    }
  } catch (e) {
    failure = (e instanceof Error ? e.message : String(e)).slice(0, 500);
  }
  const finished = new Date();
  const ok = failure === null;
  const { error: runError } = await db.from("fh_runs").insert({
    source: task, started_at: started.toISOString(), finished_at: finished.toISOString(), ok, rows_written: written, error: failure,
  });
  const log = { task, ok, written, ...out, ms: finished.getTime() - started.getTime(), error: failure, bookkeeping: runError?.message ?? null };
  (ok && !runError ? console.log : console.error)(JSON.stringify(log));
  return json(log, ok ? 200 : 502);
});

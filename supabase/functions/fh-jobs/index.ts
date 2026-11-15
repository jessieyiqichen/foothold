// Foothold jobs worker, five tasks:
//   {"task":"vc","board":"accel"}  reads one VC job board's company list (Getro) into fh_companies
//   {"task":"ats","limit":20}      takes the next companies, looks for each one's public job board on Ashby,
//                                  Greenhouse, Lever, Gem, Rippling or BambooHR, and writes its open roles into
//                                  fh_postings. "systems":["gem","rippling"] tries only those; Workable is tried
//                                  only when named there, a few companies a call (it allows few requests a minute)
//   {"task":"tag","limit":200}     tags postings not yet tagged with this version of the skill vocabulary
//   {"task":"refresh","limit":25}  re-reads the boards of the companies checked longest ago (none within 20 hours),
//                                  writes the roles found and marks closed the open roles the board no longer lists
//   {"task":"people"}              reads the contact each HN poster wrote in their own post into fh_people
//   {"task":"hn-companies"}        links HN posts with no company to the company with their domain, or creates one
//                                  (source 'hn'), then runs people; repeating it does nothing new
// Only company lists come from the VC boards; the roles always come from the company's own board.
// It writes with the project's secret key, which Supabase gives the function on its own servers.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  type Ats, type AtsJob, boardUrl, DETAILS, parseGetroCompanies, PARSERS, pickSystems, slugCandidates, type VcCompany, withDetail,
} from "./lib/parse.ts";
import { runHnCompanies, runPeople } from "./hn.ts";
import { settleLimited } from "./lib/pool.ts";
import { labelled, listedCount, planRefresh, type StoredRole } from "./lib/refresh.ts";
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
const REFRESH_LIMIT_DEFAULT = 25;
/** fh_claim_refresh hands out at most 25 in any 2 minutes whatever is asked; this only bounds the request. */
const REFRESH_LIMIT_MAX = 25;
/** Boards re-read at once in one refresh call. */
const REFRESH_AT_ONCE = 5;

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
  const written = await writeRoles(db, c, found.ats, found.slug, found.jobs);
  const { error } = await db.from("fh_companies")
    .update({ ats: found.ats, ats_slug: found.slug, ats_jobs: written, is_hiring: true }).eq("id", c.id);
  if (error) throw new Error(`fh_companies (${c.name}): ${error.message}`);
  return written;
}

/** Upserts a board's roles for one company. A role found on its board is open, so closed_at is written null. Each
 *  role is labelled (family, level) as it is written, so fh-roles has nothing to catch up on. Tag counts
 *  (fh_tag_counts) are not recounted here: they follow when fh-roles next recounts, at most a day behind, which ranks
 *  the same. */
async function writeRoles(db: SupabaseClient, c: { id: number; name: string }, ats: Ats, slug: string, jobs: AtsJob[]): Promise<number> {
  const now = new Date().toISOString();
  const rows = jobs.map((j) => ({
    source: "ats", source_id: `${ats}:${slug}:${j.id}`, company_id: c.id, company_name: c.name,
    title: j.title, location: j.location, text: j.text, url: j.url, posted_at: j.postedAt, updated_at: now, closed_at: null,
    tags: tagsOf(j.title, j.text), tags_version: SKILLS_VERSION, ...labelled(j.title),
  }));
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("fh_postings").upsert(rows.slice(i, i + CHUNK), { onConflict: "source,source_id" });
    if (error) throw new Error(`fh_postings (${c.name}): ${error.message}`);
  }
  return rows.length;
}

/** SHA-256 of a text's UTF-8 bytes, in hex: the same value fh_stored_roles computes in the database. */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sets closed_at on these postings: now() to close them, null to re-open them. */
async function setClosed(db: SupabaseClient, ids: number[], closedAt: string | null, name: string): Promise<void> {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { error } = await db.from("fh_postings").update({ closed_at: closedAt }).in("id", ids.slice(i, i + CHUNK));
    if (error) throw new Error(`fh_postings (${name}, closed_at): ${error.message}`);
  }
}

interface Due { id: number; name: string; ats: Ats; ats_slug: string }
type Refreshed = { written: number; reopened: number; closed: number; skipped: string | null };

/** Re-reads one company's board. A board that does not answer (timeout, 404, 5xx, 429) or answers oddly closes nothing;
 *  so a board that 404s every day never closes its roles (a known gap, see lib/refresh.ts). Only new or changed roles
 *  are written. */
async function refreshCompany(db: SupabaseClient, c: Due): Promise<Refreshed> {
  const board = await getBoard(c.ats, c.ats_slug);
  if (board.raw === null) return { written: 0, reopened: 0, closed: 0, skipped: board.limited ? "429" : "no answer" };
  const { data, error } = await db.rpc("fh_stored_roles", { p_company: c.id });
  if (error) throw new Error(`fh_stored_roles (${c.name}): ${error.message}`);
  type Row = { id: number; source_id: string; closed_at: string | null; title: string | null; posted_at: string | null; text_sha256: string | null };
  const stored: StoredRole[] = ((data ?? []) as Row[]).map((r) => ({
    id: r.id, sourceId: r.source_id, closedAt: r.closed_at, title: r.title, postedAt: r.posted_at, textSha256: r.text_sha256,
  }));
  const jobs = PARSERS[c.ats](board.raw, c.ats_slug);
  const needsDetail = DETAILS[c.ats] !== undefined;
  const hashes = new Map(needsDetail ? [] : await Promise.all(jobs.map(async (j) => [j.id, await sha256Hex(j.text)] as const)));
  const plan = planRefresh({ ats: c.ats, slug: c.ats_slug, stored, jobs, listed: listedCount(c.ats, board.raw), needsDetail, hashes });
  if (!plan.ok) return { written: 0, reopened: 0, closed: 0, skipped: plan.reason };
  const written = await writeRoles(db, c, c.ats, c.ats_slug, await withText(c.ats, c.ats_slug, plan.upsert));
  await setClosed(db, plan.reopen, null, c.name);
  await setClosed(db, plan.close, new Date().toISOString(), c.name);
  const { error: companyError } = await db.from("fh_companies").update({ ats_jobs: jobs.length, is_hiring: jobs.length > 0 }).eq("id", c.id);
  if (companyError) throw new Error(`fh_companies (${c.name}): ${companyError.message}`);
  return { written, reopened: plan.reopen.length, closed: plan.close.length, skipped: null };
}

async function runRefresh(db: SupabaseClient, limit: number) {
  const { data, error } = await db.rpc("fh_claim_refresh", { n: limit });
  if (error) throw new Error(`fh_claim_refresh: ${error.message}`);
  const due = (data ?? []) as Due[];
  const results = await settleLimited(due, REFRESH_AT_ONCE, (c) => refreshCompany(db, c));
  const done = results.filter((r): r is PromiseFulfilledResult<Refreshed> => r.status === "fulfilled").map((r) => r.value);
  const sum = (k: "written" | "reopened" | "closed") => done.reduce((a, r) => a + r[k], 0);
  const errors = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => String(r.reason).slice(0, 200));
  return { claimed: due.length, written: sum("written"), reopened: sum("reopened"), closed: sum("closed"), skipped: done.filter((r) => r.skipped).length, errors };
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
  const task = ["vc", "ats", "tag", "refresh", "people", "hn-companies"].includes(String(body.task)) ? String(body.task) : null;
  if (!task) return json({ ok: false, error: 'task must be "vc", "ats", "tag", "refresh", "people" or "hn-companies"' }, 400);

  const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const started = new Date();
  let out: Record<string, unknown> = {};
  let written = 0;
  let failure: string | null = null;
  let idle = false; // a refresh that claimed nothing, or a people run with nothing new: no run row is written
  try {
    if (task === "vc") {
      written = await importVcBoard(db, String(body.board ?? ""));
      out = { board: body.board };
    } else if (task === "tag") {
      const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit as number, 1), TAG_LIMIT_MAX) : TAG_LIMIT_DEFAULT;
      const r = await runTag(db, limit);
      written = r.tagged;
      out = r;
    } else if (task === "refresh") {
      const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit as number, 1), REFRESH_LIMIT_MAX) : REFRESH_LIMIT_DEFAULT;
      const r = await runRefresh(db, limit);
      written = r.written;
      out = r;
      idle = r.claimed === 0;
      if (r.errors.length > 0) failure = r.errors.join(" | ").slice(0, 500);
    } else if (task === "hn-companies") {
      const r = await runHnCompanies(db);
      written = r.linked + r.people.people;
      out = r;
      idle = r.posts === 0 && r.people.skipped;
    } else if (task === "people") {
      const r = await runPeople(db);
      written = r.people;
      out = r;
      idle = r.skipped;
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
  const { error: runError } = ok && idle ? { error: null } : await db.from("fh_runs").insert({
    source: task, started_at: started.toISOString(), finished_at: finished.toISOString(), ok, rows_written: written, error: failure,
  });
  const log = { task, ok, written, ...out, ms: finished.getTime() - started.getTime(), error: failure, bookkeeping: runError?.message ?? null };
  (ok && !runError ? console.log : console.error)(JSON.stringify(log));
  return json(log, ok ? 200 : 502);
});

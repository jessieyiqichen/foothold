// The jobs worker's two HN tasks: people (the contact each HN poster wrote in their own post, into fh_people) and
// hn-companies (a company row for every HN post that has none, then people). The logic is in lib/people.ts and
// lib/hn-companies.ts; this file reads and writes.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { type ExistingCompany, type HnPost as UnlinkedPost, planHnCompanies } from "./lib/hn-companies.ts";
import { linkAgrees, peopleDue, peopleFromHnPost } from "./lib/people.ts";

const CHUNK = 200;
/** Rows a page, for every read here (the API returns at most 1,000 a request). */
const PAGE = 1000;

type HnPost = { company_id: number; text: string; url: string; posted_at: string | null; fh_companies: { domain: string | null } | null };

/** Every HN posting linked to a company, read in pages. */
const linkedHnPosts = (db: SupabaseClient) => allPages<HnPost>((a, b) => db.from("fh_postings")
  .select("company_id, text, url, posted_at, fh_companies(domain)")
  .eq("source", "hn").not("company_id", "is", null).order("id").range(a, b), "fh_postings");

/** The newest of `column` over the rows the filter keeps, or null. */
async function newest(db: SupabaseClient, table: string, column: string, filter: (q: any) => any): Promise<string | null> {
  const { data, error } = await filter(db.from(table).select(column)).order(column, { ascending: false }).limit(1);
  if (error) throw new Error(`${table}: ${error.message}`);
  return ((data ?? [])[0] as Record<string, string> | undefined)?.[column] ?? null;
}

/** The addresses HN posters wrote, upserted into fh_people. Does nothing (and writes no run row) when no linked HN
 *  posting changed since the last good run: the HN import rewrites every posting's updated_at each day. */
export async function runPeople(db: SupabaseClient) {
  const lastRun = await newest(db, "fh_runs", "started_at", (q) => q.eq("source", "people").eq("ok", true));
  const lastChange = await newest(db, "fh_postings", "updated_at", (q) => q.eq("source", "hn").not("company_id", "is", null));
  if (!peopleDue(lastRun, lastChange)) return { skipped: true, posts: 0, doubted: 0, people: 0 };
  const posts = await linkedHnPosts(db);
  // One row a (company, address): the newest post wins, so seen_at is the last time the person published it.
  const byKey = new Map<string, Record<string, unknown>>();
  let doubted = 0;
  for (const p of posts) {
    const domain = p.fh_companies?.domain ?? null;
    if (!linkAgrees(p.text, domain)) { doubted++; continue; }
    const seen = p.posted_at ?? new Date().toISOString();
    for (const person of peopleFromHnPost(p.text, domain)) {
      const key = `${p.company_id}:${person.email}`;
      const old = byKey.get(key);
      if (old && String(old.seen_at) >= seen) continue;
      byKey.set(key, {
        company_id: p.company_id, name: person.name, role: person.role, contact_kind: "email", contact: person.email,
        source: "hn", source_url: p.url, seen_at: seen,
      });
    }
  }
  const rows = [...byKey.values()];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error: putError } = await db.from("fh_people").upsert(rows.slice(i, i + CHUNK), { onConflict: "company_id,source,contact" });
    if (putError) throw new Error(`fh_people: ${putError.message}`);
  }
  return { skipped: false, posts: posts.length, doubted, people: rows.length };
}

/** Reads every row of a query in pages of PAGE (the API returns at most 1,000 a request). */
async function allPages<T>(read: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>, what: string): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await read(from, from + PAGE - 1);
    if (error) throw new Error(`${what}: ${error.message}`);
    const page = (data ?? []) as T[];
    all.push(...page);
    if (page.length < PAGE) return all;
  }
}

/** HN posts with no company: link each to the company that has its domain, or create a company row for it. The link
 *  stamps updated_at, so the people task (run at the end) reads the newly linked posts. Posts already linked are not
 *  read, so a second run finds nothing to do. */
export async function runHnCompanies(db: SupabaseClient) {
  type Row = { id: number; company_name: string; text: string; url: string };
  const rows = await allPages<Row>((a, b) => db.from("fh_postings").select("id, company_name, text, url")
    .eq("source", "hn").is("company_id", null).order("id").range(a, b), "fh_postings");
  if (rows.length === 0) return { posts: 0, linked: 0, created: 0, people: await runPeople(db) };
  const existing = await allPages<ExistingCompany>((a, b) => db.from("fh_companies").select("id, domain, source")
    .not("domain", "is", null).order("id").range(a, b), "fh_companies");
  const posts: UnlinkedPost[] = rows.map((r) => ({ id: r.id, companyName: r.company_name, text: r.text, url: r.url }));
  const plan = planHnCompanies(posts, existing);
  const ids = new Map<string, number>();
  for (let i = 0; i < plan.create.length; i += CHUNK) {
    const batch = plan.create.slice(i, i + CHUNK).map((c) => ({
      source: "hn", source_id: c.sourceId, name: c.name, domain: c.domain, website: c.website, source_url: c.sourceUrl, is_hiring: true,
    }));
    const { data, error } = await db.from("fh_companies").upsert(batch, { onConflict: "source,source_id" }).select("id, source_id");
    if (error) throw new Error(`fh_companies (hn): ${error.message}`);
    for (const r of (data ?? []) as { id: number; source_id: string }[]) ids.set(r.source_id, r.id);
  }
  // One update a company: every post of that company gets its id.
  const byCompany = new Map<number, number[]>();
  const put = (company: number | undefined, posting: number) => {
    if (company !== undefined) byCompany.set(company, [...(byCompany.get(company) ?? []), posting]);
  };
  for (const l of plan.link) put(l.companyId, l.postingId);
  for (const l of plan.linkToNew) put(ids.get(l.sourceId), l.postingId);
  const now = new Date().toISOString();
  let linked = 0;
  for (const [company, postings] of byCompany) {
    const { error } = await db.from("fh_postings").update({ company_id: company, updated_at: now }).in("id", postings).is("company_id", null);
    if (error) throw new Error(`fh_postings (link to ${company}): ${error.message}`);
    linked += postings.length;
  }
  return { posts: rows.length, linked, linkedToExisting: plan.link.length, created: plan.create.length, people: await runPeople(db) };
}

// Writes Company and Posting rows to Supabase in chunks, keyed on (source, source_id). Every error is thrown with
// the table it came from.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Company, Posting } from "./lib/types.ts";

const CHUNK = 500;

function check(table: string, error: { message: string } | null): void {
  if (error) throw new Error(`${table}: ${error.message}`);
}

const companyRow = (c: Company) => ({
  source: c.source, source_id: c.sourceId, name: c.name, slug: c.slug, website: c.website, domain: c.domain,
  one_liner: c.oneLiner, description: c.description, tags: c.tags, industries: c.industries, locations: c.locations,
  team_size: c.teamSize, batch: c.batch, stage: c.stage, status: c.status, is_hiring: c.isHiring,
  source_url: c.sourceUrl, updated_at: new Date().toISOString(),
});

const postingRow = (p: Posting) => ({
  source: p.source, source_id: p.sourceId, company_name: p.companyName, title: p.title, location: p.location,
  text: p.text, url: p.url, links: p.links, emails: p.emails, author: p.author, thread_id: p.threadId,
  posted_at: p.postedAt, updated_at: new Date().toISOString(),
});

async function upsertChunks<T>(db: SupabaseClient, table: string, rows: T[]): Promise<number> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict: "source,source_id" });
    check(table, error);
  }
  return rows.length;
}

export const upsertCompanies = (db: SupabaseClient, rows: Company[]) => upsertChunks(db, "fh_companies", rows.map(companyRow));
export const upsertPostings = (db: SupabaseClient, rows: Posting[]) => upsertChunks(db, "fh_postings", rows.map(postingRow));

/** Links postings to companies of the same name; returns how many were linked. */
export async function linkPostings(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("fh_link_postings");
  check("fh_link_postings", error);
  return typeof data === "number" ? data : 0;
}

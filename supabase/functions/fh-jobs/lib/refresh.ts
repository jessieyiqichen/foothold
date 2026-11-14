// The daily re-check of a company's job board: which roles to write, which to re-open and which to mark closed.
// Closing is the one step that loses information, so it happens only when the board clearly answered with its whole
// list; any doubt closes nothing and the role waits for the next day's check.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

import { type Ats, type AtsJob, JOBS_PER_COMPANY_MAX } from "./parse.ts";

/** A role already stored for the company: its row id, its `source_id` ("ats:slug:job id") and whether it is closed. */
export interface StoredRole { id: number; sourceId: string; closedAt: string | null }

export type RefreshPlan =
  | { ok: true; upsert: AtsJob[]; reopen: number[]; close: number[] }
  | { ok: false; reason: string };

const listOf = (raw: unknown, key: string): unknown[] | null => {
  const v = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>)[key] : undefined;
  return Array.isArray(v) ? v : null;
};

/** How many rows the board's answer lists, before the parser drops any; null when it is not the system's shape. */
export function listedCount(ats: Ats, raw: unknown): number | null {
  switch (ats) {
    case "ashby": case "greenhouse": case "workable": return listOf(raw, "jobs")?.length ?? null;
    case "bamboohr": return listOf(raw, "result")?.length ?? null;
    case "lever": case "rippling": case "gem": return Array.isArray(raw) ? raw.length : null;
  }
}

/**
 * What one board's answer means for the roles stored for that company.
 * - upsert: roles to write. Where the list carries the text, every role, so text changes land and a returning role
 *   is re-opened by the upsert itself (it writes closed_at null). Where each text is read one by one
 *   (`needsDetail`: Rippling, BambooHR), only roles never stored before, so the texts are not read again each day.
 * - reopen: on those systems, stored closed roles that came back.
 * - close: the company's open roles not in the answer, whatever board name they were stored under.
 * Nothing is closed when the answer is not a job list, when it lists rows the parser could not read, or when the
 * parser stopped at JOBS_PER_COMPANY_MAX (the roles past the limit were never read, so their absence means nothing).
 */
export function planRefresh(a: {
  ats: Ats; slug: string; stored: StoredRole[]; jobs: AtsJob[]; listed: number | null; needsDetail: boolean;
}): RefreshPlan {
  if (a.listed === null) return { ok: false, reason: "the board's answer was not a job list" };
  if (a.listed > 0 && a.jobs.length === 0) return { ok: false, reason: `the board listed ${a.listed} rows and none could be read` };
  const key = (j: AtsJob) => `${a.ats}:${a.slug}:${j.id}`;
  const seen = new Set(a.jobs.map(key));
  const known = new Map(a.stored.map((s) => [s.sourceId, s]));
  const cut = a.jobs.length >= JOBS_PER_COMPANY_MAX;
  return {
    ok: true,
    upsert: a.needsDetail ? a.jobs.filter((j) => !known.has(key(j))) : [...a.jobs],
    reopen: a.needsDetail ? a.stored.filter((s) => s.closedAt !== null && seen.has(s.sourceId)).map((s) => s.id) : [],
    close: cut ? [] : a.stored.filter((s) => s.closedAt === null && !seen.has(s.sourceId)).map((s) => s.id),
  };
}

// The daily re-check of a company's job board: which roles to write, which to re-open and which to mark closed.
// Closing is the one step that loses information, so it happens only when the board clearly answered with its whole
// list; any doubt closes nothing and the role waits for the next day's check.
// Known gap, left as it is on purpose: a board that answers 404 (or never answers) every day is treated as "no
// answer", so its roles are never closed. Telling "the company moved or closed its board" from "the board is down
// today" needs more than one day's answer, and nothing here keeps that history yet.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

import { familyOf, levelOf, ROLES_VERSION } from "../../../../packages/core/src/roles.ts";
import { type Ats, type AtsJob, JOBS_PER_COMPANY_MAX } from "./parse.ts";

/** A role already stored for the company, as fh_stored_roles returns it (text_sha256: SHA-256 hex of the text). */
export interface StoredRole {
  id: number;
  sourceId: string;
  closedAt: string | null;
  title: string | null;
  postedAt: string | null;
  textSha256: string | null;
}

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

const sameMoment = (a: string | null, b: string | null) =>
  a === null || b === null ? a === b : Date.parse(a) === Date.parse(b);

/**
 * What one board's answer means for the roles stored for that company.
 * - upsert: roles never stored, and stored roles whose title, text or first-posted date changed. On a system whose
 *   list carries no text (`needsDetail`: Rippling, BambooHR) the text is not compared, and a date only when the list
 *   gives one. A written role is open again (the write sets closed_at null).
 * - reopen: stored closed roles that came back unchanged.
 * - close: the company's open roles not in the answer, whatever board name they were stored under.
 * Nothing is closed when the answer is not a job list, when it lists rows the parser could not read, or when the
 * parser stopped at JOBS_PER_COMPANY_MAX (the roles past the limit were never read, so their absence means nothing).
 * hashes: SHA-256 hex of each job's text, by job id, computed by the worker the same way fh_stored_roles does.
 */
export function planRefresh(a: {
  ats: Ats; slug: string; stored: StoredRole[]; jobs: AtsJob[]; listed: number | null; needsDetail: boolean;
  hashes: ReadonlyMap<string, string>;
}): RefreshPlan {
  if (a.listed === null) return { ok: false, reason: "the board's answer was not a job list" };
  if (a.listed > 0 && a.jobs.length === 0) return { ok: false, reason: `the board listed ${a.listed} rows and none could be read` };
  const key = (j: AtsJob) => `${a.ats}:${a.slug}:${j.id}`;
  const known = new Map(a.stored.map((s) => [s.sourceId, s]));
  const changed = (j: AtsJob, s: StoredRole) =>
    s.title !== j.title
    || (j.postedAt !== null && !sameMoment(j.postedAt, s.postedAt))
    || (!a.needsDetail && (a.hashes.get(j.id) ?? null) !== s.textSha256);
  const upsert = a.jobs.filter((j) => {
    const s = known.get(key(j));
    return s === undefined || changed(j, s);
  });
  const written = new Set(upsert.map(key));
  const seen = new Set(a.jobs.map(key));
  const cut = a.jobs.length >= JOBS_PER_COMPANY_MAX;
  return {
    ok: true,
    upsert,
    reopen: a.stored.filter((s) => s.closedAt !== null && seen.has(s.sourceId) && !written.has(s.sourceId)).map((s) => s.id),
    close: cut ? [] : a.stored.filter((s) => s.closedAt === null && !seen.has(s.sourceId)).map((s) => s.id),
  };
}

/** A role's family, level and the title rules' version, written with the role so fh-roles has nothing left to do. */
export const labelled = (title: string | null) => ({ family: familyOf(title), level: levelOf(title), roles_version: ROLES_VERSION });

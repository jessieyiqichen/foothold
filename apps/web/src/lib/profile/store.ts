// A person's profile row, read and written as that person. Row-level security lets them reach only the row whose
// user_id is their own; the filters below name that row, they are not what protects it.
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROFILE_COLUMNS, PROFILE_TABLE } from "./constants";
import { PROFILE_COPY } from "./copy";
import { cleanFamilies, cleanLevels } from "./directions";
import { checkResumeText, cleanResumeText, displayName } from "./resumeText";
import { cleanEdits, effectiveTags, NO_EDITS, type TagEdits } from "./tagEdits";
import { resumeTags } from "./tags";
import type { Family, Level } from "./roles";
import { fail, ok, type Profile, type Result } from "./types";
import { SKILLS_VERSION } from "./vocabulary";

export type Db = Pick<SupabaseClient, "from">;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** A row as the page uses it, or null when a field is missing or of the wrong type. */
export function rowToProfile(row: unknown): Profile | null {
  if (!isRecord(row)) return null;
  const { resume_text: text, resume_name: name, tags, tags_version: version, updated_at: updatedAt } = row;
  if (typeof text !== "string" || !(name === null || typeof name === "string")) return null;
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) return null;
  if (typeof version !== "number" || typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))) return null;
  // A row from before tags could be edited has neither column: that reads as no edits
  const edits = cleanEdits({ added: row.tags_added, removed: row.tags_removed });
  return {
    resumeText: text, resumeName: name, tags: [...tags], tagsAdded: edits.added, tagsRemoved: edits.removed,
    // Absent on a row from before a person could pick directions and levels: that reads as none picked
    families: cleanFamilies(row.families), levels: cleanLevels(row.levels), tagsVersion: version, updatedAt,
  };
}

/** What went wrong goes to the console for whoever debugs it; the resume itself is never logged. */
function report(action: string, cause: unknown): void {
  const detail = cause instanceof Error || isRecord(cause) ? String(cause.message) : String(cause);
  console.error(`Foothold: could not ${action} the profile in ${PROFILE_TABLE}: ${detail}`);
}

/** Runs one request. The database refusing it and the request never arriving both end as the same line to show. */
async function attempt<T>(action: string, message: string, request: () => PromiseLike<{ data: unknown; error: { message: string } | null }>, read: (data: unknown) => T | undefined): Promise<Result<T>> {
  try {
    const { data, error } = await request();
    if (error) {
      report(action, error);
      return fail(message);
    }
    const value = read(data);
    if (value === undefined) {
      report(action, "the row came back in a shape this page does not know");
      return fail(message);
    }
    return ok(value);
  } catch (cause) {
    report(action, cause);
    return fail(message);
  }
}

const readSaved = (data: unknown) => rowToProfile(data) ?? undefined;

/** The person's profile, or null when they have not saved one. */
export function loadProfile(db: Db, userId: string): Promise<Result<Profile | null>> {
  return attempt("load", PROFILE_COPY.loadFailed,
    () => db.from(PROFILE_TABLE).select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    (data) => (data === null ? null : readSaved(data)));
}

/** Saves the resume text with its tags. One row a person: saving again replaces it. The text is tagged afresh every
 *  time and the person's own adds and removes (`edits`) are laid over it, so they survive a new resume. The text is
 *  checked here as well as on the page, so nothing empty or oversized is ever sent. */
export async function saveProfile(db: Db, userId: string, draft: { text: string; name: string | null }, edits: TagEdits = NO_EDITS): Promise<Result<Profile>> {
  const problem = checkResumeText(draft.text, "typed");
  if (problem) return fail(problem);
  const text = cleanResumeText(draft.text);
  const kept = cleanEdits(edits);
  const row = {
    user_id: userId, resume_text: text, resume_name: displayName(draft.name), tags: effectiveTags(resumeTags(text), kept),
    tags_added: kept.added, tags_removed: kept.removed, tags_version: SKILLS_VERSION,
  };
  return attempt("save", PROFILE_COPY.saveFailed,
    () => db.from(PROFILE_TABLE).upsert(row, { onConflict: "user_id" }).select(PROFILE_COLUMNS).single(),
    readSaved);
}

/** Changes some columns of the row this page loaded (same `updated_at`), and nothing else: never the resume. If that
 *  row was deleted or replaced in another tab nothing matches, nothing is written or re-created, and the answer says
 *  the profile changed elsewhere. */
async function updateLoaded(db: Db, userId: string, loaded: Profile, columns: Record<string, unknown>, action: string, message: string): Promise<Result<Profile>> {
  const result = await attempt(action, message,
    () => db.from(PROFILE_TABLE).update(columns).eq("user_id", userId).eq("updated_at", loaded.updatedAt).select(PROFILE_COLUMNS),
    (rows) => (Array.isArray(rows) ? (rows.length === 0 ? null : readSaved(rows[0])) : undefined));
  if (!result.ok) return result;
  return result.value === null ? fail(PROFILE_COPY.changedElsewhere) : ok(result.value);
}

/** Saves the person's adds and removes on the resume already saved: only the tag lists are written. */
export function saveTagEdits(db: Db, userId: string, loaded: Profile, edits: TagEdits): Promise<Result<Profile>> {
  const kept = cleanEdits(edits);
  const lists = {
    tags: effectiveTags(resumeTags(loaded.resumeText), kept), tags_added: kept.added, tags_removed: kept.removed, tags_version: SKILLS_VERSION,
  };
  return updateLoaded(db, userId, loaded, lists, "change the tags of", PROFILE_COPY.editFailed);
}

/** Saves the kinds of work the person wants: only that column, known ids only, at most three. */
export function saveFamilies(db: Db, userId: string, loaded: Profile, families: readonly Family[]): Promise<Result<Profile>> {
  return updateLoaded(db, userId, loaded, { families: cleanFamilies(families) }, "change the directions of", PROFILE_COPY.familiesFailed);
}

/** Saves the levels the person filters matches by: only that column. An empty list means every level. */
export function saveLevels(db: Db, userId: string, loaded: Profile, levels: readonly Level[]): Promise<Result<Profile>> {
  return updateLoaded(db, userId, loaded, { levels: cleanLevels(levels) }, "change the level filter of", PROFILE_COPY.levelsFailed);
}

/** Removes the person's row: the resume text, its name and its tags, all of it. */
export function deleteProfile(db: Db, userId: string): Promise<Result<null>> {
  return attempt("delete", PROFILE_COPY.deleteFailed,
    async () => ({ data: null, error: (await db.from(PROFILE_TABLE).delete().eq("user_id", userId)).error }),
    () => null);
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionDb, type WithDb } from "@/components/auth/useSessionDb";
import { PROFILE_COPY } from "@/lib/profile/copy";
import type { Family, Level } from "@/lib/profile/roles";
import { deleteProfile, loadProfile, saveFamilies, saveLevels, saveProfile, saveTagEdits, type Db } from "@/lib/profile/store";
import { editsOf, type TagEdits } from "@/lib/profile/tagEdits";
import { fail, type Profile, type Result } from "@/lib/profile/types";

export type ProfileState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; profile: Profile | null };

/** One change to the saved row: given the database, the person and the row this page loaded. */
type Change = (db: Db, userId: string, loaded: Profile) => Promise<Result<Profile>>;

/** The profile as the database holds it, read once the person is known and again whenever asked. */
function useLoadedProfile(isLoaded: boolean, userId: string | null, withDb: WithDb) {
  const [state, setState] = useState<ProfileState>({ kind: "loading" });
  // Bumped to read the row once more
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let live = true;
    withDb(PROFILE_COPY.loadFailed, (db) => loadProfile(db, userId)).then((result) => {
      if (!live) return;
      setState(result.ok ? { kind: "ready", profile: result.value } : { kind: "failed", message: result.message });
    });
    return () => {
      live = false;
    };
  }, [isLoaded, userId, attempt, withDb]);

  /** Reads again without clearing the screen. */
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  /** "Try again" after a failed load. */
  const retry = useCallback(() => {
    setState({ kind: "loading" });
    reload();
  }, [reload]);
  return { state, setState, reload, retry };
}

/** The signed-in person's profile. Each change is saved first and shown after; a failure comes back as a line to
 *  show, never as a silent no. */
export function useProfile() {
  const { isLoaded, userId, withDb } = useSessionDb();
  const { state, setState, reload, retry } = useLoadedProfile(isLoaded, userId, withDb);

  const saved = state.kind === "ready" ? state.profile : null;
  /** A first resume, or a replacement: the new text is tagged afresh and the person's tag edits are kept. */
  const save = useCallback(async (draft: { text: string; name: string | null }): Promise<Result<Profile>> => {
    if (!userId) return fail(PROFILE_COPY.signedOut);
    const result = await withDb(PROFILE_COPY.saveFailed, (db) => saveProfile(db, userId, draft, editsOf(saved)));
    if (result.ok) setState({ kind: "ready", profile: result.value });
    return result;
  }, [userId, withDb, saved, setState]);

  /** A change to the row this page loaded: only its own columns are written, never the resume. */
  const change = useCallback(async (failed: string, run: Change): Promise<Result<Profile>> => {
    if (!userId || !saved) return fail(failed);
    const result = await withDb(failed, (db) => run(db, userId, saved));
    if (result.ok) setState({ kind: "ready", profile: result.value });
    // The row was deleted or replaced in another tab: read it again, so the page shows what the database holds
    else if (result.message === PROFILE_COPY.changedElsewhere) reload();
    return result;
  }, [userId, withDb, saved, setState, reload]);

  const saveEdits = useCallback((edits: TagEdits) => change(PROFILE_COPY.editFailed, (db, id, row) => saveTagEdits(db, id, row, edits)), [change]);
  const pickFamilies = useCallback((families: Family[]) => change(PROFILE_COPY.familiesFailed, (db, id, row) => saveFamilies(db, id, row, families)), [change]);
  const filterLevels = useCallback((levels: Level[]) => change(PROFILE_COPY.levelsFailed, (db, id, row) => saveLevels(db, id, row, levels)), [change]);

  const remove = useCallback(async (): Promise<Result<null>> => {
    if (!userId) return fail(PROFILE_COPY.signedOut);
    const result = await withDb(PROFILE_COPY.deleteFailed, (db) => deleteProfile(db, userId));
    if (result.ok) setState({ kind: "ready", profile: null });
    return result;
  }, [userId, withDb, setState]);

  // The proxy sends a signed-out visitor to sign in before this page; this covers a session that ended while it was open
  const shown: ProfileState = isLoaded && !userId ? { kind: "failed", message: PROFILE_COPY.signedOut } : state;
  return { state: shown, retry, save, saveEdits, pickFamilies, filterLevels, remove, withDb };
}

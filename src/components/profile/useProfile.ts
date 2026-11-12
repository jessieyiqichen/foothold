"use client";

import { useSession } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserDb } from "@/lib/db/client";
import { PROFILE_COPY } from "@/lib/profile/copy";
import { deleteProfile, loadProfile, saveProfile, type Db } from "@/lib/profile/store";
import { fail, type Profile, type Result } from "@/lib/profile/types";

export type ProfileState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; profile: Profile | null };

/** Supabase as whoever is signed in: every request carries their Clerk session token (as DataSync does for goals),
 *  which is how row-level security knows whose row to answer with. */
function useSessionDb() {
  const { isLoaded, session } = useSession();
  // The client asks for a token on each request, so it reads the current session rather than the one it started with
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const dbRef = useRef<Db | null>(null);
  /** The client is made on first use, not while rendering: a missing setting then shows as a line, not a blank page. */
  const withDb = useCallback(async <T,>(message: string, run: (db: Db) => Promise<Result<T>>): Promise<Result<T>> => {
    try {
      dbRef.current ??= createBrowserDb(async () => (await sessionRef.current?.getToken()) ?? null);
    } catch (cause) {
      console.error("Foothold: the profile page could not connect to the database", cause);
      return fail(message);
    }
    return run(dbRef.current);
  }, []);
  return { isLoaded, userId: session?.user.id ?? null, withDb };
}

/** The signed-in person's profile. Each change is saved first and shown after; a failure comes back as a line to
 *  show, never as a silent no. */
export function useProfile() {
  const { isLoaded, userId, withDb } = useSessionDb();
  const [state, setState] = useState<ProfileState>({ kind: "loading" });
  // Bumped by "Try again" to load once more
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

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const save = useCallback(async (draft: { text: string; name: string | null }): Promise<Result<Profile>> => {
    if (!userId) return fail(PROFILE_COPY.signedOut);
    const result = await withDb(PROFILE_COPY.saveFailed, (db) => saveProfile(db, userId, draft));
    if (result.ok) setState({ kind: "ready", profile: result.value });
    return result;
  }, [userId, withDb]);

  const remove = useCallback(async (): Promise<Result<null>> => {
    if (!userId) return fail(PROFILE_COPY.signedOut);
    const result = await withDb(PROFILE_COPY.deleteFailed, (db) => deleteProfile(db, userId));
    if (result.ok) setState({ kind: "ready", profile: null });
    return result;
  }, [userId, withDb]);

  // The proxy sends a signed-out visitor to sign in before this page; this covers a session that ended while it was open
  const shown: ProfileState = isLoaded && !userId ? { kind: "failed", message: PROFILE_COPY.signedOut } : state;
  return { state: shown, retry, save, remove };
}

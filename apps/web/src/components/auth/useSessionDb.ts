"use client";

import { useSession } from "@clerk/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";
import { createBrowserDb } from "@/lib/db/client";
import { fail, type Result } from "@/lib/profile/types";

/** Runs one database step as the signed-in person, or gives back `message` when the database cannot be reached. */
export type WithDb = <T>(message: string, run: (db: SupabaseClient) => Promise<Result<T>>) => Promise<Result<T>>;

/** Supabase as whoever is signed in: every request carries their Clerk session token (as DataSync does for goals),
 *  which is how row-level security knows whose rows to answer with. */
export function useSessionDb(): { isLoaded: boolean; userId: string | null; withDb: WithDb } {
  const { isLoaded, session } = useSession();
  // The client asks for a token on each request, so it reads the current session rather than the one it started with
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const dbRef = useRef<SupabaseClient | null>(null);
  /** The client is made on first use, not while rendering: a missing setting then shows as a line, not a blank page. */
  const withDb: WithDb = useCallback(async (message, run) => {
    try {
      dbRef.current ??= createBrowserDb(async () => (await sessionRef.current?.getToken()) ?? null);
    } catch (cause) {
      console.error("Foothold: the page could not connect to the database", cause);
      return fail(message);
    }
    return run(dbRef.current);
  }, []);
  return { isLoaded, userId: session?.user.id ?? null, withDb };
}

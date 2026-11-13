"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { MATCHES_PAGE_SIZE } from "@/lib/matches/constants";
import { MATCHES_COPY } from "@/lib/matches/copy";
import { addPage, loadMatches } from "@/lib/matches/remote";
import type { MatchesPage } from "@/lib/matches/types";

export type MatchesState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  /** `asked` is how many rows have been asked for; `version` is the profile these rows were found for. */
  | { kind: "ready"; page: MatchesPage; asked: number; version: string };

/** The signed-in person's matches. `version` names the profile they are for (its `updated_at`): when it changes, the
 *  first page is read again while the old rows stay on screen, so a filter change never empties or moves the page. */
export function useMatches(version: string | null, withDb: WithDb) {
  const [state, setState] = useState<MatchesState>({ kind: "loading" });
  const [more, setMore] = useState<"loading" | "failed" | null>(null);
  // Bumped by "Try again" to read once more
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (version === null) return;
    let live = true;
    withDb(MATCHES_COPY.loadFailed, (db) => loadMatches(db, 0)).then((result) => {
      if (!live) return;
      setMore(null);
      setState(result.ok ? { kind: "ready", page: result.value, asked: MATCHES_PAGE_SIZE, version } : { kind: "failed", message: result.message });
    });
    return () => {
      live = false;
    };
  }, [version, attempt, withDb]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  /** "Show more": the next page goes under the rows already shown. A failure leaves them as they are and says so. */
  const showMore = useCallback(async () => {
    if (state.kind !== "ready" || more === "loading") return;
    const { asked, version: shownFor } = state;
    setMore("loading");
    const result = await withDb(MATCHES_COPY.moreFailed, (db) => loadMatches(db, asked));
    setMore(result.ok ? null : "failed");
    if (!result.ok) return;
    // Dropped if the profile changed meanwhile: those rows belong to a list that is being replaced
    setState((now) => (now.kind === "ready" && now.version === shownFor && now.asked === asked
      ? { ...now, page: addPage(now.page, result.value), asked: asked + MATCHES_PAGE_SIZE }
      : now));
  }, [state, more, withDb]);

  /** True while the rows on screen are for an older profile and the new ones are on their way. */
  const refreshing = state.kind === "ready" && version !== null && state.version !== version;
  return { state, more, refreshing, retry, showMore };
}

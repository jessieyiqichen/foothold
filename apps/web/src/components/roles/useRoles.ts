"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { addPage } from "@/lib/matches/remote";
import type { MatchesPage } from "@/lib/matches/types";
import { MATCHES_COPY } from "@/lib/matches/copy";
import { ROLES_PAGE_SIZE } from "@/lib/roles/constants";
import type { Facets } from "@/lib/roles/facets";
import type { RoleFilters } from "@/lib/roles/filters";
import { loadFacets, loadRoles } from "@/lib/roles/remote";

export type RolesState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; page: MatchesPage; asked: number; version: string };

/** The roles for the filters, and the counts beside each option. `version` names what they are for (the filters'
 *  query and the profile's `updated_at`): when it changes, the first page is read again while the old rows stay on
 *  screen, dimmed, so a filter change never empties or moves the page. */
export function useRoles(filters: RoleFilters, version: string, withDb: WithDb) {
  const [state, setState] = useState<RolesState>({ kind: "loading" });
  const [facets, setFacets] = useState<Facets | null>(null);
  const [more, setMore] = useState<"loading" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    withDb(MATCHES_COPY.loadFailed, (db) => loadRoles(db, filters, 0)).then((result) => {
      if (!live) return;
      setMore(null);
      setState(result.ok ? { kind: "ready", page: result.value, asked: ROLES_PAGE_SIZE, version } : { kind: "failed", message: result.message });
    });
    // The counts are a help, not the list: without them the options simply show no number
    withDb(MATCHES_COPY.loadFailed, (db) => loadFacets(db, filters)).then((result) => {
      if (live) setFacets(result.ok ? result.value : null);
    });
    return () => {
      live = false;
    };
    // `filters` is read through `version`, which changes whenever they do
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, attempt, withDb]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const showMore = useCallback(async () => {
    if (state.kind !== "ready" || more === "loading") return;
    const { asked, version: shownFor } = state;
    setMore("loading");
    const result = await withDb(MATCHES_COPY.moreFailed, (db) => loadRoles(db, filters, asked));
    setMore(result.ok ? null : "failed");
    if (!result.ok) return;
    setState((now) => (now.kind === "ready" && now.version === shownFor && now.asked === asked
      ? { ...now, page: addPage(now.page, result.value), asked: asked + ROLES_PAGE_SIZE }
      : now));
  }, [state, more, withDb, filters]);

  const refreshing = state.kind === "ready" && state.version !== version;
  return { state, facets, more, refreshing, retry, showMore };
}

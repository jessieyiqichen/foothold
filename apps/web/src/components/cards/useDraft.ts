"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { loadSavedDraft, requestDraft, saveDraft } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import type { Draft } from "@/lib/connector/types";
import { ok } from "@/lib/profile/types";

export type DraftState = { kind: "loading" } | { kind: "writing" } | { kind: "ready"; draft: Draft | null };

/** One card's draft: the saved one loads with the card; "Write a draft" and "Write again" ask the server for a new
 *  one, which this browser then saves with its own client (its token is fresh, unlike a slow request's). A failure
 *  keeps what was there and comes back as the route's own line; a draft that could not be saved says so. */
export function useDraft(companyId: number, withDb: WithDb) {
  const [state, setState] = useState<DraftState>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  useEffect(() => {
    let live = true;
    withDb(DRAFT_COPY.failed, async (db) => ok(await loadSavedDraft(db, companyId))).then((result) => {
      if (live) setState({ kind: "ready", draft: result.ok ? result.value : null });
    });
    return () => {
      live = false;
    };
  }, [companyId, withDb]);

  const write = useCallback(async () => {
    if (state.kind === "writing") return;
    const before = state.kind === "ready" ? state.draft : null;
    setState({ kind: "writing" });
    setError(null);
    const result = await requestDraft(companyId);
    setState({ kind: "ready", draft: result.ok ? result.value : before });
    if (!result.ok) return setError(result.message);
    const draft = result.value;
    const saved = await withDb(DRAFT_COPY.notKept, async (db) => ok(await saveDraft(db, companyId, draft)));
    setUnsaved(!(saved.ok && saved.value));
  }, [companyId, state, withDb]);

  return { state, error, unsaved, write };
}

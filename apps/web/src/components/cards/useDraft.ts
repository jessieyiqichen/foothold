"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { loadSavedDraft, requestDraft } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import type { Draft } from "@/lib/connector/types";
import { ok } from "@/lib/profile/types";

export type DraftState = { kind: "loading" } | { kind: "writing" } | { kind: "ready"; draft: Draft | null };

/** One card's draft: the saved one loads with the card; "Write a draft" and "Write again" ask the server for a new
 *  one. A failure keeps what was there and comes back as the route's own line. */
export function useDraft(companyId: number, withDb: WithDb) {
  const [state, setState] = useState<DraftState>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);

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
    if (!result.ok) setError(result.message);
  }, [companyId, state]);

  return { state, error, write };
}

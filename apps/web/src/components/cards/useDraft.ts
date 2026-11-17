"use client";

import { useCallback, useEffect, useReducer } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { loadSavedDraft, requestDraft, saveDraft } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import { draftView, INITIAL_VIEW, type Shown } from "@/lib/connector/draftView";
import { ok } from "@/lib/profile/types";

/** One card's draft: the saved one loads with the card; "Write a draft" and "Write again" ask the server for a new
 *  one, which this browser then saves with its own client (its token is fresh, unlike a slow request's). The fields
 *  and the person's edits stay while writing and through a refusal; they change only when a new draft arrives
 *  (lib/connector/draftView.ts). */
export function useDraft(companyId: number, withDb: WithDb) {
  const [view, dispatch] = useReducer(draftView, INITIAL_VIEW);

  useEffect(() => {
    let live = true;
    withDb(DRAFT_COPY.loadFailed, (db) => loadSavedDraft(db, companyId)).then((result) => {
      if (live) dispatch(result.ok ? { type: "loaded", draft: result.value } : { type: "loadFailed" });
    });
    return () => {
      live = false;
    };
  }, [companyId, withDb]);

  const write = useCallback(async () => {
    if (view.writing) return;
    dispatch({ type: "writeStart" });
    const result = await requestDraft(companyId);
    if (!result.ok) return dispatch({ type: "writeFailed", message: result.message });
    const draft = result.value;
    dispatch({ type: "written", draft });
    const saved = await withDb(DRAFT_COPY.notKept, async (db) => ok(await saveDraft(db, companyId, draft)));
    dispatch({ type: "saved", ok: saved.ok && saved.value });
  }, [companyId, view.writing, withDb]);

  const edit = useCallback((shown: Shown) => dispatch({ type: "edit", shown }), []);
  return { view, write, edit };
}

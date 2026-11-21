"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { isEdited, loadSavedDraft, requestDraft, saveDraft, saveEdit } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import { draftView, INITIAL_VIEW, type Shown } from "@/lib/connector/draftView";
import { ok } from "@/lib/profile/types";

/** One card's draft: the saved one loads with the card; "Write a draft" and "Write again" ask the server for a new
 *  one, which this browser then saves with its own client (its token is fresh, unlike a slow request's). The fields
 *  and the person's edits stay while writing and through a refusal; they change only when a new draft arrives
 *  (lib/connector/draftView.ts). */
export function useDraft(companyId: number, withDb: WithDb, roleId: number | null = null) {
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

  /** A new draft; `another` asks for one away from the saved draft's resume line ("Try another angle"). */
  const write = useCallback(async (another = false) => {
    if (view.writing) return;
    dispatch({ type: "writeStart" });
    const result = await requestDraft(companyId, fetch, roleId, another);
    if (!result.ok) return dispatch({ type: "writeFailed", message: result.message });
    const draft = result.value;
    dispatch({ type: "written", draft });
    const saved = await withDb(DRAFT_COPY.notKept, async (db) => ok(await saveDraft(db, companyId, draft)));
    dispatch({ type: "saved", ok: saved.ok && saved.value });
  }, [companyId, roleId, view.writing, withDb]);

  const edit = useCallback((shown: Shown) => dispatch({ type: "edit", shown }), []);
  // The last change kept, so pressing Copy again on the same text does not keep it twice (review, 2026-11-21)
  const lastKept = useRef<string | null>(null);
  /** On Copy: keeps how the person changed the draft, when they did, for the next one. False when a change could not
   *  be kept, so the panel can say so; true when it was kept or there was nothing new to keep. */
  const remember = useCallback(async (): Promise<boolean> => {
    const { draft, shown } = view;
    if (!draft || !shown || !isEdited(draft, shown)) return true;
    const key = `${shown.subject}\n${shown.body}`;
    if (lastKept.current === key) return true;
    const result = await withDb(DRAFT_COPY.notKept, async (db) => ok(await saveEdit(db, companyId, draft, shown)));
    const kept = result.ok && result.value;
    if (kept) lastKept.current = key;
    return kept;
  }, [companyId, view, withDb]);
  return { view, write, edit, remember };
}

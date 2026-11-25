"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { loadPosting, type Posting } from "@/lib/company/posting";
import { ROLE_PAGE_COPY } from "@/lib/company/pageCopy";

export type PostingState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; posting: Posting | null };

/** The chosen role's posting text and place, read as the signed-in person. Each role read once per page: choosing a
 *  role seen before shows it at once. Null `roleId` (no open role) reads nothing. */
export function usePosting(roleId: string | null, withDb: WithDb) {
  const [read, setRead] = useState<Readonly<Record<string, PostingState>>>({});
  const [attempt, setAttempt] = useState(0);
  const known = roleId ? read[roleId] : undefined;
  const settled = known?.kind === "ready";

  useEffect(() => {
    if (!roleId || settled) return;
    let live = true;
    withDb(ROLE_PAGE_COPY.postingFailed, (db) => loadPosting(db, Number(roleId))).then((result) => {
      if (!live) return;
      const state: PostingState = result.ok ? { kind: "ready", posting: result.value } : { kind: "failed", message: result.message };
      setRead((before) => ({ ...before, [roleId]: state }));
    });
    return () => {
      live = false;
    };
  }, [roleId, settled, withDb, attempt]);

  const retry = useCallback(() => {
    if (!roleId) return;
    setRead((before) => ({ ...before, [roleId]: { kind: "loading" } }));
    setAttempt((n) => n + 1);
  }, [roleId]);

  const state: PostingState = known ?? { kind: "loading" };
  return { state, retry };
}

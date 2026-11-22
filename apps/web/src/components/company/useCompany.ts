"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import type { Decision } from "@/lib/cards/constants";
import { decide, undecide } from "@/lib/cards/remote";
import { loadCompany, loadPostingUrl } from "@/lib/company/remote";
import { ok } from "@/lib/profile/types";
import type { CompanyBy, CompanyPage } from "@/lib/company/types";
import { COMPANY_COPY } from "@/lib/company/copy";

export type CompanyState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "missing"; postingUrl: string | null }
  | { kind: "ready"; page: CompanyPage };

/** One company's page, read as the person, with their decision on it saved or taken back from the page. */
export function useCompany(by: CompanyBy, withDb: WithDb, enabled: boolean, mode: "mine" | "public" = "mine") {
  const [state, setState] = useState<CompanyState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = "company" in by ? `c${by.company}` : `r${by.role}`;

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    withDb(COMPANY_COPY.loadFailed, (db) => loadCompany(db, by, mode)).then((result) => {
      if (!live) return;
      if (!result.ok) return setState({ kind: "failed", message: result.message });
      if (result.value) return setState({ kind: "ready", page: result.value });
      // A role with no company page: the page links to the posting instead
      // A signed-out visitor cannot read postings directly; their list links such roles to the posting already
      if (!("role" in by) || mode === "public") return setState({ kind: "missing", postingUrl: null });
      void withDb(COMPANY_COPY.loadFailed, async (db) => ok(await loadPostingUrl(db, by.role))).then((url) => {
        if (live) setState({ kind: "missing", postingUrl: url.ok ? url.value : null });
      });
    });
    return () => {
      live = false;
    };
    // `by` is read through its key, so a new object for the same page does not read it again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, withDb, enabled, attempt, mode]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  /** Saves a decision, or takes it back with null; the page shows it once the database has it. */
  const setDecision = useCallback(async (decision: Decision | null) => {
    if (state.kind !== "ready" || busy) return;
    const { companyId } = state.page.card;
    setBusy(true);
    setError(null);
    const at = new Date();
    const result = await withDb(COMPANY_COPY.decideFailed, (db) => (decision ? decide(db, companyId, decision, at) : undecide(db, companyId)));
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setState({ kind: "ready", page: { ...state.page, decision, decidedAt: decision ? at.toISOString() : null } });
  }, [state, busy, withDb]);

  return { state, busy, error, retry, setDecision };
}

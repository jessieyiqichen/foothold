"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import type { Decision } from "@/lib/cards/constants";
import { CARDS_COPY, decidedLine } from "@/lib/cards/copy";
import { decide, loadToday, undecide } from "@/lib/cards/remote";
import type { CompanyCard } from "@/lib/cards/types";
import { TODAY_STEP, TODAY_MAX } from "@/lib/company/today";

export type TodayListState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; cards: CompanyCard[] };

/** Today's companies as one list (user, 2026-11-21): the best five the person has not decided on. Saving or "Not for
 *  me" takes a company off and the next one fills its place; Undo brings it back; "Show five more" lengthens the list. */
export function useTodayList(withDb: WithDb, enabled: boolean) {
  const [state, setState] = useState<TodayListState>({ kind: "loading" });
  const [limit, setLimit] = useState(TODAY_STEP);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ card: CompanyCard; decision: Decision } | null>(null);

  // Every read takes a number; only the newest one's answer is shown, so a slow earlier read never overwrites a later
  // one (review, 2026-11-21: Save and then "Show five more" could shrink the list back to five)
  const latest = useRef(0);
  const limitNow = useRef(limit);
  const load = useCallback(async () => {
    const mine = ++latest.current;
    const result = await withDb(CARDS_COPY.loadFailed, (db) => loadToday(db, limitNow.current));
    if (mine !== latest.current) return;
    setState(result.ok ? { kind: "ready", cards: result.value } : { kind: "failed", message: result.message });
  }, [withDb]);

  useEffect(() => {
    limitNow.current = limit;
    if (!enabled) return;
    const mine = ++latest.current;
    withDb(CARDS_COPY.loadFailed, (db) => loadToday(db, limit)).then((result) => {
      if (mine === latest.current) setState(result.ok ? { kind: "ready", cards: result.value } : { kind: "failed", message: result.message });
    });
    return () => {
      latest.current += 1;
    };
  }, [enabled, withDb, limit, attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const choose = useCallback(async (card: CompanyCard, decision: Decision) => {
    if (busy !== null) return;
    setBusy(card.companyId);
    setError(null);
    const result = await withDb(CARDS_COPY.decideFailed, (db) => decide(db, card.companyId, decision));
    setBusy(null);
    if (!result.ok) return setError(result.message);
    setUndo({ card, decision });
    setState((now) => (now.kind === "ready" ? { kind: "ready", cards: now.cards.filter((c) => c.companyId !== card.companyId) } : now));
    await load();
  }, [busy, withDb, load]);

  const undoLast = useCallback(async () => {
    if (!undo) return;
    const { card } = undo;
    setUndo(null);
    const result = await withDb(CARDS_COPY.undoFailed, (db) => undecide(db, card.companyId));
    if (!result.ok) return setError(result.message);
    await load();
  }, [undo, withDb, load]);

  const fiveMore = useCallback(() => setLimit((n) => Math.min(n + TODAY_STEP, TODAY_MAX)), []);
  const canShowMore = state.kind === "ready" && state.cards.length === limit && limit < TODAY_MAX;
  const undoMessage = undo ? decidedLine(undo.decision, undo.card.name) : null;
  const dismissUndo = useCallback(() => setUndo(null), []);
  return { state, busy, error, retry, choose, undoLast, undoMessage, dismissUndo, fiveMore, canShowMore };
}

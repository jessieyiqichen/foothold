"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import type { Decision } from "@/lib/cards/constants";
import { CARDS_COPY, decidedLine } from "@/lib/cards/copy";
import { localDayStart, remainingInRound, roundDone } from "@/lib/cards/day";
import { decide, loadDecisionsSince, loadToday, undecide } from "@/lib/cards/remote";
import type { CompanyCard, DecisionRow } from "@/lib/cards/types";
import { fail, ok, type Result } from "@/lib/profile/types";

export type TodayState =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  /** `queue` holds the cards still to show, the current one first; `decided` today's decisions, oldest first. */
  | { kind: "ready"; queue: CompanyCard[]; decided: DecisionRow[] };

type Undo = { card: CompanyCard; decision: Decision };

/** Today's decisions so far and the cards left in this five, read together. */
async function loadRound(withDb: WithDb, decidedSoFar?: DecisionRow[]): Promise<Result<{ queue: CompanyCard[]; decided: DecisionRow[] }>> {
  const decided = decidedSoFar ?? await withDb(CARDS_COPY.loadFailed, (db) => loadDecisionsSince(db, localDayStart(new Date())));
  const rows = Array.isArray(decided) ? decided : decided.ok ? decided.value : null;
  if (!rows) return fail(CARDS_COPY.loadFailed);
  const queue = await withDb(CARDS_COPY.loadFailed, (db) => loadToday(db, remainingInRound(rows.length)));
  return queue.ok ? ok({ queue: queue.value, decided: rows }) : queue;
}

/** Today's state as loaded, read again on Try again. */
function useRound(withDb: WithDb, enabled: boolean) {
  const [state, setState] = useState<TodayState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadRound(withDb).then((result) => {
      if (live) setState(result.ok ? { kind: "ready", ...result.value } : { kind: "failed", message: result.message });
    });
    return () => {
      live = false;
    };
  }, [withDb, enabled, attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);
  return { state, setState, retry };
}

/** Today's five: the cards, the count, each decision saved before the next card shows, and Undo for the last one. */
export function useToday(withDb: WithDb, enabled: boolean) {
  const { state, setState, retry } = useRound(withDb, enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  // The count at which the person asked for five more, so the done screen does not come straight back
  const [continuedAt, setContinuedAt] = useState<number | null>(null);

  const choose = useCallback(async (decision: Decision) => {
    if (state.kind !== "ready" || busy || !state.queue[0]) return;
    const card = state.queue[0];
    setBusy(true);
    setError(null);
    const at = new Date();
    const result = await withDb(CARDS_COPY.decideFailed, (db) => decide(db, card.companyId, decision, at));
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setUndo({ card, decision });
    setState({ kind: "ready", queue: state.queue.slice(1), decided: [...state.decided, { companyId: card.companyId, decision, decidedAt: at.toISOString() }] });
  }, [state, busy, withDb, setState]);

  const undoLast = useCallback(async () => {
    if (state.kind !== "ready" || !undo) return;
    const { card } = undo;
    setUndo(null);
    const result = await withDb(CARDS_COPY.undoFailed, (db) => undecide(db, card.companyId));
    if (!result.ok) return setError(result.message);
    setError(null);
    setState({ kind: "ready", queue: [card, ...state.queue], decided: state.decided.filter((d) => d.companyId !== card.companyId) });
  }, [state, undo, withDb, setState]);

  /** "Show five more": the next five, counted on past the ones already decided today. */
  const fiveMore = useCallback(async () => {
    if (state.kind !== "ready") return;
    setContinuedAt(state.decided.length);
    setUndo(null);
    setState({ kind: "loading" });
    const result = await loadRound(withDb, state.decided);
    setState(result.ok ? { kind: "ready", ...result.value } : { kind: "failed", message: result.message });
  }, [state, withDb, setState]);

  const done = state.kind === "ready" && roundDone(state.decided.length, continuedAt);
  const undoMessage = undo ? decidedLine(undo.decision, undo.card.name) : null;
  const dismissUndo = useCallback(() => setUndo(null), []);
  return { state, busy, error, done, undoMessage, retry, choose, undoLast, dismissUndo, fiveMore };
}

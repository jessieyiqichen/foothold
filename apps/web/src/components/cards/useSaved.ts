"use client";

import { useCallback, useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { CARDS_COPY } from "@/lib/cards/copy";
import { decide, loadSaved, undecide } from "@/lib/cards/remote";
import type { SavedCard } from "@/lib/cards/types";

export type SavedState = { kind: "loading" } | { kind: "failed"; message: string } | { kind: "ready"; cards: SavedCard[] };
type Removed = { card: SavedCard; index: number };

/** The saved list as loaded, read again on Try again. */
function useSavedList(withDb: WithDb, enabled: boolean) {
  const [state, setState] = useState<SavedState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    withDb(CARDS_COPY.savedFailed, (db) => loadSaved(db)).then((result) => {
      if (live) setState(result.ok ? { kind: "ready", cards: result.value } : { kind: "failed", message: result.message });
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

/** The person's saved and reached-out companies. Each change is saved first and shown after; a card keeps its place
 *  when it is marked reached out, so nothing jumps; Remove offers Undo, which puts the decision back as it was. */
export function useSaved(withDb: WithDb, enabled: boolean) {
  const { state, setState, retry } = useSavedList(withDb, enabled);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<{ companyId: number | null; message: string } | null>(null);
  const [removed, setRemoved] = useState<Removed | null>(null);

  const markReached = useCallback(async (card: SavedCard) => {
    setBusy(card.companyId);
    setError(null);
    const at = new Date();
    const result = await withDb(CARDS_COPY.changeFailed, (db) => decide(db, card.companyId, "reached_out", at));
    setBusy(null);
    if (!result.ok) return setError({ companyId: card.companyId, message: result.message });
    const reached: SavedCard = { ...card, decision: "reached_out", decidedAt: at.toISOString() };
    setState((now) => (now.kind === "ready" ? { kind: "ready", cards: now.cards.map((c) => (c.companyId === card.companyId ? reached : c)) } : now));
  }, [withDb, setState]);

  const remove = useCallback(async (card: SavedCard) => {
    if (state.kind !== "ready") return;
    setBusy(card.companyId);
    setError(null);
    const result = await withDb(CARDS_COPY.changeFailed, (db) => undecide(db, card.companyId));
    setBusy(null);
    if (!result.ok) return setError({ companyId: card.companyId, message: result.message });
    setRemoved({ card, index: state.cards.findIndex((c) => c.companyId === card.companyId) });
    setState({ kind: "ready", cards: state.cards.filter((c) => c.companyId !== card.companyId) });
  }, [state, withDb, setState]);

  /** Puts the removed company back, with its decision and its date, in its old place. */
  const undoRemove = useCallback(async () => {
    if (!removed) return;
    const { card, index } = removed;
    setRemoved(null);
    const result = await withDb(CARDS_COPY.undoFailed, (db) => decide(db, card.companyId, card.decision, new Date(card.decidedAt)));
    if (!result.ok) return setError({ companyId: null, message: result.message });
    setState((now) => (now.kind === "ready" ? { kind: "ready", cards: [...now.cards.slice(0, index), card, ...now.cards.slice(index)] } : now));
  }, [removed, withDb, setState]);

  const dismissUndo = useCallback(() => setRemoved(null), []);
  return { state, busy, error, removed, retry, markReached, remove, undoRemove, dismissUndo };
}

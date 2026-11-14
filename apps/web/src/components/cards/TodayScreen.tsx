"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { useProfile } from "@/components/profile/useProfile";
import { useFirstVisitGate } from "@/components/start/useFirstVisitGate";
import { CARDS_COPY, cardLine } from "@/lib/cards/copy";
import { cardPosition, tally } from "@/lib/cards/day";
import { MATCHES_PATH } from "@/lib/matches/constants";
import { CompanyCardView } from "./CompanyCardView";
import { DoneSheet } from "./DoneSheet";
import { UndoBar } from "./UndoBar";
import { useToday } from "./useToday";

/** Today's five (`/today`), the front door after the first visit: one company card at a time, "Card N of 5", each
 *  decision saved before the next card shows, Undo for a few seconds; after each five, the done sheet. A new card
 *  starts at the top of the page with focus on its name; nothing else moves the page. */
export function TodayScreen() {
  const profile = useProfile();
  const firstVisit = useFirstVisitGate(profile.state, profile.userId);
  const ready = profile.state.kind === "ready" && !firstVisit;
  const today = useToday(profile.withDb, ready);
  const { state, busy, error, done, undoMessage, retry, choose, undoLast, dismissUndo, fiveMore } = today;
  const current = state.kind === "ready" && !done ? state.queue[0] ?? null : null;
  const shownKey = done ? "done" : current?.companyId ?? "none";

  useEffect(() => {
    if (state.kind === "ready") window.scrollTo({ top: 0 });
  }, [shownKey, state.kind]);

  if (profile.state.kind === "failed") return <Failed message={profile.state.message} onRetry={profile.retry} />;
  if (!ready || state.kind === "loading") return <p className="font-mono text-xs text-muted">{CARDS_COPY.loading}</p>;
  if (state.kind === "failed") return <Failed message={state.message} onRetry={retry} />;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <h1 className="sr-only">{CARDS_COPY.todayTitle}</h1>
      {done ? <DoneSheet tally={tally(state.decided.map((d) => d.decision))} onFiveMore={fiveMore} /> : current ? (
        <>
          <p className="font-mono text-xs text-ink tabular-nums">{cardLine(cardPosition(state.decided.length))}</p>
          <div key={current.companyId}>
            <CompanyCardView card={current} busy={busy} error={error} onDecide={choose} />
          </div>
        </>
      ) : (
        <EmptySheet shape="half" color="off" tile="red">
          <p className="text-lg font-black text-ink">{CARDS_COPY.emptyTitle}</p>
          <p className="font-mono text-xs leading-5 text-muted">{CARDS_COPY.emptyLine}</p>
          <ButtonLink variant="secondary" href={MATCHES_PATH}>{CARDS_COPY.allRoles}</ButtonLink>
        </EmptySheet>
      )}
      {error && done && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      <UndoBar message={undoMessage} onUndo={undoLast} onClose={dismissUndo} />
    </div>
  );
}

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-bold text-danger">{message}</p>
      <Button variant="secondary" onClick={onRetry}>{CARDS_COPY.tryAgain}</Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { useProfile } from "@/components/profile/useProfile";
import { useFirstVisitGate } from "@/components/start/useFirstVisitGate";
import { ShortCard } from "@/components/company/ShortCard";
import { CARDS_COPY } from "@/lib/cards/copy";
import { companyHref } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import { MATCHES_PATH } from "@/lib/matches/constants";
import { UndoBar } from "./UndoBar";
import { useTodayList } from "./useTodayList";

const QUIET = "font-mono text-xs text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50";

/** Today (`/today`), the front door after the first visit: the best five companies as short cards on one page (user,
 *  2026-11-21). Each opens its company page, where the roles and the message are; Save and "Not for me" take it off
 *  the list, Undo brings it back. */
export function TodayScreen() {
  const profile = useProfile();
  const firstVisit = useFirstVisitGate(profile.state, profile.userId);
  const ready = profile.state.kind === "ready" && !firstVisit;
  const { state, busy, error, retry, choose, undoLast, undoMessage, dismissUndo, fiveMore, canShowMore } = useTodayList(profile.withDb, ready);

  if (profile.state.kind === "failed") return <Failed message={profile.state.message} onRetry={profile.retry} />;
  if (!ready || state.kind === "loading") return <p className="font-mono text-xs text-muted">{CARDS_COPY.loading}</p>;
  if (state.kind === "failed") return <Failed message={state.message} onRetry={retry} />;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-black tracking-[-0.03em] text-ink">{COMPANY_COPY.todayTitle}</h1>
        <p className="font-mono text-xs text-muted">{COMPANY_COPY.todayLine}</p>
      </div>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      {state.cards.length === 0 ? (
        <EmptySheet shape="half" color="off" tile="red">
          <p className="text-lg font-black text-ink">{CARDS_COPY.emptyTitle}</p>
          <p className="font-mono text-xs leading-5 text-muted">{CARDS_COPY.emptyLine}</p>
          <ButtonLink variant="secondary" href={MATCHES_PATH}>{CARDS_COPY.allRoles}</ButtonLink>
        </EmptySheet>
      ) : (
        <ul className="flex flex-col gap-4">
          {state.cards.map((card) => (
            <ShortCard key={card.companyId} card={card}>
              <Link href={companyHref(card.companyId, card.roles[0]?.id ?? null)} className={buttonClass({})}>{COMPANY_COPY.open} →</Link>
              <Button variant="secondary" onClick={() => choose(card, "saved")} disabled={busy !== null}>
                {busy === card.companyId ? COMPANY_COPY.deciding : COMPANY_COPY.save}
              </Button>
              <button type="button" onClick={() => choose(card, "skipped")} disabled={busy !== null} className={`ml-auto ${QUIET}`}>{COMPANY_COPY.notForMe}</button>
            </ShortCard>
          ))}
        </ul>
      )}
      {canShowMore && <Button variant="ghost" className="self-start" onClick={fiveMore}>{COMPANY_COPY.moreFive}</Button>}
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

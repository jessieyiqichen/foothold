"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProfile } from "@/components/profile/useProfile";
import { TODAY_PATH } from "@/lib/cards/constants";
import { CARDS_COPY, DECISION_LABEL } from "@/lib/cards/copy";
import type { SavedCard } from "@/lib/cards/types";
import { MATCHES_PATH } from "@/lib/matches/constants";
import Link from "next/link";
import { ShortCard } from "@/components/company/ShortCard";
import { buttonClass } from "@/components/ui/Button";
import { companyHref } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import { UndoBar } from "./UndoBar";
import { useSaved } from "./useSaved";

/** The decision as a small flat tile: reached out in green, saved in mustard; the word always says which. */
const DECISION_TILE = {
  reached_out: "bg-tile-green text-tile-off",
  saved: "bg-tile-mustard text-ink",
} as const;

interface SavedCardProps {
  card: SavedCard;
  busy: boolean;
  error: string | null;
  onRemove: () => void;
}

/** A saved company as a short card (user, 2026-11-21): its decision as a tile, Open for its page, where the roles,
 *  the message and "I reached out" are, and Remove. */
function SavedCardView({ card, busy, error, onRemove }: SavedCardProps) {
  const tag = <span className={`px-1.5 py-0.5 font-mono text-[11px] leading-4 ${DECISION_TILE[card.decision]}`}>{DECISION_LABEL[card.decision]}</span>;
  return (
    <ShortCard card={card} tag={tag}>
      <Link href={companyHref(card.companyId, card.roles[0]?.id ?? null)} className={buttonClass({})}>{COMPANY_COPY.open} →</Link>
      <Button variant="ghost" onClick={onRemove} disabled={busy} aria-label={`${CARDS_COPY.remove} ${card.name}`}>{CARDS_COPY.remove}</Button>
      {error && <p role="alert" className="w-full text-sm font-bold text-danger">{error}</p>}
    </ShortCard>
  );
}

/** Saved (`/saved`): the companies saved or reached out to, newest first, as short cards that open their pages; all
 *  roles linked quietly at the foot. */
export function SavedScreen() {
  const profile = useProfile();
  const ready = profile.state.kind === "ready";
  const { state, busy, error, removed, retry, remove, undoRemove, dismissUndo } = useSaved(profile.withDb, ready);
  const failed = profile.state.kind === "failed" ? profile.state : state.kind === "failed" ? state : null;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <PageHeader title={CARDS_COPY.savedTitle} intro={CARDS_COPY.savedIntro} back={null} />
      {failed ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="font-bold text-danger">{failed.message}</p>
          <Button variant="secondary" onClick={profile.state.kind === "failed" ? profile.retry : retry}>{CARDS_COPY.tryAgain}</Button>
        </div>
      ) : !ready || state.kind !== "ready" ? <p className="font-mono text-xs text-muted">{CARDS_COPY.savedLoading}</p>
        : state.cards.length === 0 ? (
          <EmptySheet shape="square" color="cobalt" tile="off">
            <p className="text-lg font-black text-ink">{CARDS_COPY.savedEmptyTitle}</p>
            <p className="font-mono text-xs leading-5 text-muted">{CARDS_COPY.savedEmptyLine}</p>
            <ButtonLink href={TODAY_PATH}>{CARDS_COPY.toToday}</ButtonLink>
          </EmptySheet>
        ) : (
          <ul className="flex flex-col gap-4">
            {state.cards.map((card) => (
              <SavedCardView key={card.companyId} card={card} busy={busy === card.companyId} error={error?.companyId === card.companyId ? error.message : null}
                onRemove={() => remove(card)} />
            ))}
          </ul>
        )}
      {error?.companyId === null && <p role="alert" className="text-sm font-bold text-danger">{error.message}</p>}
      <p className="border-t border-hairline pt-4 font-mono text-xs leading-5 text-muted">
        {CARDS_COPY.allRolesLine} · <ButtonLink variant="ghost" href={MATCHES_PATH}>{CARDS_COPY.allRoles}</ButtonLink>
      </p>
      <UndoBar message={removed ? `${CARDS_COPY.removed} ${removed.card.name}` : null} onUndo={undoRemove} onClose={dismissUndo} />
    </div>
  );
}

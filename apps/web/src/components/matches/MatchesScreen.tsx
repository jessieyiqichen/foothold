"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { FlashNumber } from "@/components/ui/FlashNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFirstVisitGate } from "@/components/start/useFirstVisitGate";
import { START_PATH } from "@/lib/start/constants";
import { useProfile } from "@/components/profile/useProfile";
import { countLine, MATCHES_COPY, showMoreLabel } from "@/lib/matches/copy";
import { hasMore } from "@/lib/matches/remote";
import { FRESH_DAYS } from "@/lib/matches/constants";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { PROFILE_PATH } from "@/lib/profile/constants";
import type { Profile } from "@/lib/profile/types";
import { LevelFilter } from "./LevelFilter";
import { MatchRow } from "./MatchRow";
import { useMatches } from "./useMatches";

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-bold text-danger">{message}</p>
      <Button variant="secondary" onClick={onRetry}>{MATCHES_COPY.tryAgain}</Button>
    </div>
  );
}

/** The invitation to pick the kind of work, while none is picked. */
function PickFamilies() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-ink">{MATCHES_COPY.noFamilies}</p>
      <ButtonLink variant="secondary" href={PROFILE_PATH}>{MATCHES_COPY.pickFamilies}</ButtonLink>
    </div>
  );
}

/** The list for a person with a resume: the invitation to pick a direction if none is picked, the level filter, the
 *  count, the rows, and Show more. While new rows are on their way the old ones stay, dimmed. */
function Matches({ profile, filterLevels, withDb }: { profile: Profile } & Pick<ReturnType<typeof useProfile>, "filterLevels" | "withDb">) {
  // Off by default: only roles first posted in the last 60 days (docs/architecture.md, freshness)
  const [includeOld, setIncludeOld] = useState(false);
  const { state, more, refreshing, retry, showMore } = useMatches(`${profile.updatedAt}|${includeOld}`, withDb, includeOld ? null : FRESH_DAYS);
  const ready = state.kind === "ready" ? state : null;

  return (
    <>
      {profile.families.length === 0 && <PickFamilies />}
      <div className="self-start">
        <ToggleChip on={includeOld} onClick={() => setIncludeOld(!includeOld)}>{MATCHES_COPY.olderLabel}</ToggleChip>
      </div>
      {/* The count sits beside the levels where there is room. It keeps its place and height while rows load */}
      <LevelFilter
        levels={profile.levels}
        onChange={filterLevels}
        aside={
          <p id="matches-count" aria-live="polite" className="min-h-6 text-base font-extrabold tracking-[-0.01em] text-ink">
            {/* Lights up when a level filter changes the count; not on the first load */}
            {ready ? <FlashNumber value={ready.page.total} className="px-1">{countLine(ready.page.matches.length, ready.page.total)}</FlashNumber> : ""}
          </p>
        }
      />

      {state.kind === "loading" && <p className="font-mono text-xs text-muted">{MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {ready && (
        <section aria-labelledby="matches-count" aria-busy={refreshing} className={`flex flex-col gap-2 border-t-2 border-ink ${refreshing ? "opacity-60" : ""}`}>
          {ready.page.matches.length === 0 && (
            <EmptySheet shape="half" color="off" tile="red">
              <p className="text-ink">{profile.levels.length > 0 ? MATCHES_COPY.emptyAtLevels : MATCHES_COPY.empty}</p>
              {profile.levels.length === 0 && <ButtonLink variant="secondary" href={PROFILE_PATH}>{MATCHES_COPY.editProfile}</ButtonLink>}
            </EmptySheet>
          )}
          <ul className="flex flex-col">
            {ready.page.matches.map((match) => <MatchRow key={match.id} match={match} />)}
          </ul>
          {hasMore({ asked: ready.asked, total: ready.page.total }) && (
            <div className="flex flex-col items-start gap-2 pt-2">
              {more === "failed" && <p role="alert" className="font-bold text-danger">{MATCHES_COPY.moreFailed}</p>}
              <Button variant="secondary" onClick={showMore} disabled={more === "loading"}>
                {more === "loading" ? MATCHES_COPY.showingMore : showMoreLabel(ready.page.total, ready.asked)}
              </Button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

/** All roles (`/matches`): every role that fits, reached from today's done screen and the foot of Saved. Loading,
 *  couldn't load, or the list. Someone the first visit still has a question for is sent there (`/start`) instead. */
export function MatchesScreen() {
  const { state, userId, retry, filterLevels, withDb } = useProfile();
  const firstVisit = useFirstVisitGate(state, userId);

  return (
    <div className="flex w-full flex-col gap-5 lg:max-w-4xl">
      <PageHeader title={MATCHES_COPY.title} intro={MATCHES_COPY.intro} back={null} />
      {(state.kind === "loading" || firstVisit) && <p className="font-mono text-xs text-muted">{MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {/* Not reached while the first visit sends anyone without a resume to /start; kept should that ever fail */}
      {state.kind === "ready" && !firstVisit && state.profile === null && (
        <EmptySheet shape="arch" color="mustard" tile="navy">
          <p className="text-ink">{MATCHES_COPY.noResume}</p>
          <ButtonLink href={START_PATH}>{MATCHES_COPY.toProfile}</ButtonLink>
        </EmptySheet>
      )}
      {state.kind === "ready" && !firstVisit && state.profile && <Matches profile={state.profile} filterLevels={filterLevels} withDb={withDb} />}
    </div>
  );
}

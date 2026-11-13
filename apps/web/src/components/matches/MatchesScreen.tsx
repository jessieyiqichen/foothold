"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProfile } from "@/components/profile/useProfile";
import { countLine, MATCHES_COPY, showMoreLabel } from "@/lib/matches/copy";
import { hasMore } from "@/lib/matches/remote";
import { PROFILE_PATH } from "@/lib/profile/constants";
import type { Profile } from "@/lib/profile/types";
import { LevelFilter } from "./LevelFilter";
import { MatchRow } from "./MatchRow";
import { useMatches } from "./useMatches";

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-medium text-danger">{message}</p>
      <Button variant="secondary" onClick={onRetry}>{MATCHES_COPY.tryAgain}</Button>
    </div>
  );
}

/** The list for a person with a resume: the invitation to pick a direction if none is picked, the level filter, the
 *  count, the rows, and Show more. While new rows are on their way the old ones stay, dimmed. */
function Matches({ profile, filterLevels, withDb }: { profile: Profile } & Pick<ReturnType<typeof useProfile>, "filterLevels" | "withDb">) {
  const { state, more, refreshing, retry, showMore } = useMatches(profile.updatedAt, withDb);
  const ready = state.kind === "ready" ? state : null;

  return (
    <>
      {profile.families.length === 0 && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-ink">{MATCHES_COPY.noFamilies}</p>
          <ButtonLink variant="secondary" href={PROFILE_PATH}>{MATCHES_COPY.pickFamilies}</ButtonLink>
        </div>
      )}
      {/* The count sits beside the levels where there is room. It keeps its place and height while rows load */}
      <LevelFilter
        levels={profile.levels}
        onChange={filterLevels}
        aside={
          <p id="matches-count" aria-live="polite" className="min-h-5 text-sm font-medium tabular-nums text-ink">
            {ready ? countLine(ready.page.matches.length, ready.page.total) : ""}
          </p>
        }
      />

      {state.kind === "loading" && <p className="text-muted">{MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {ready && (
        <section aria-labelledby="matches-count" aria-busy={refreshing} className={`flex flex-col gap-2 border-t border-hairline ${refreshing ? "opacity-60" : ""}`}>
          {ready.page.matches.length === 0 && (
            <div className="flex flex-col items-start gap-3 pt-4">
              <p className="text-ink">{profile.levels.length > 0 ? MATCHES_COPY.emptyAtLevels : MATCHES_COPY.empty}</p>
              {profile.levels.length === 0 && <ButtonLink variant="secondary" href={PROFILE_PATH}>{MATCHES_COPY.editProfile}</ButtonLink>}
            </div>
          )}
          <ul className="flex flex-col">
            {ready.page.matches.map((match) => <MatchRow key={match.id} match={match} />)}
          </ul>
          {hasMore({ asked: ready.asked, total: ready.page.total }) && (
            <div className="flex flex-col items-start gap-2 pt-2">
              {more === "failed" && <p role="alert" className="font-medium text-danger">{MATCHES_COPY.moreFailed}</p>}
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

/** The matches page, Foothold's front door: loading, couldn't load, no resume yet (one line and the way to the
 *  profile), or the person's matches. */
export function MatchesScreen() {
  const { state, retry, filterLevels, withDb } = useProfile();

  return (
    <div className="flex w-full flex-col gap-5 lg:max-w-4xl">
      <PageHeader title={MATCHES_COPY.title} intro={MATCHES_COPY.intro} back={null} />
      {state.kind === "loading" && <p className="text-muted">{MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {state.kind === "ready" && state.profile === null && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-ink">{MATCHES_COPY.noResume}</p>
          <ButtonLink href={PROFILE_PATH}>{MATCHES_COPY.toProfile}</ButtonLink>
        </div>
      )}
      {state.kind === "ready" && state.profile && <Matches profile={state.profile} filterLevels={filterLevels} withDb={withDb} />}
    </div>
  );
}

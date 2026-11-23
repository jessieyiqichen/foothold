"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { FlashNumber } from "@/components/ui/FlashNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/roles/FilterChips";
import { RolesToolbar } from "@/components/roles/RolesToolbar";
import { useRoleFilters } from "@/components/roles/useRoleFilters";
import { useRoles } from "@/components/roles/useRoles";
import { useFirstVisitGate } from "@/components/start/useFirstVisitGate";
import { useProfile } from "@/components/profile/useProfile";
import { MATCHES_COPY, showMoreLabel } from "@/lib/matches/copy";
import { hasMore } from "@/lib/matches/remote";
import type { ProfilePicks } from "@/lib/roles/filters";
import { useSessionDb } from "@/components/auth/useSessionDb";
import { NumbersStrip } from "@/components/public/NumbersStrip";
import { JobsBanner } from "@/components/public/SignInPrompt";
import { PUBLIC_COPY } from "@/lib/public/copy";
import { SORTS, type Sort } from "@/lib/roles/constants";
import { ROLES_COPY, rolesCount } from "@/lib/roles/copy";
import { START_PATH } from "@/lib/start/constants";
import { MATCHES_PATH } from "@/lib/matches/constants";
import { LANDING_COPY, landingById, type LandingId, type LandingPage } from "@/lib/roles/landing";
import { LandingLinks } from "./LandingLinks";
import { MatchRow } from "./MatchRow";

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-bold text-danger">{message}</p>
      <Button variant="secondary" onClick={onRetry}>{MATCHES_COPY.tryAgain}</Button>
    </div>
  );
}

/** The count on the left, lit up when a filter changes it, and Sort on the right (left out for a signed-out visitor:
 *  without a resume the list is newest first). */
function ResultLine({ total, sort, onSort }: { total: number | null; sort: Sort | null; onSort: (sort: Sort) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-2">
      <p id="roles-count" aria-live="polite" className="min-h-6 text-base font-extrabold tracking-[-0.01em] text-ink">
        {total === null ? "" : <FlashNumber value={total} className="px-1">{rolesCount(total)}</FlashNumber>}
      </p>
      {sort && <label className="flex items-center gap-2 font-mono text-xs text-ink">
        {ROLES_COPY.sort}
        <select value={sort} onChange={(event) => onSort(event.target.value as Sort)}
          className="min-h-9 border border-ink bg-surface px-2 font-sans text-sm text-ink focus-visible:outline-3 focus-visible:outline-focus">
          {SORTS.map((value) => <option key={value} value={value}>{value === "fit" ? ROLES_COPY.fit : ROLES_COPY.newest}</option>)}
        </select>
      </label>}
    </div>
  );
}

/** The roles for a person with a resume: the toolbar, the active filters, the count and sort, the rows and Show more.
 *  Kind of work and level start from the profile; changing them here does not change it. While new rows are on their
 *  way the old ones stay, dimmed, so nothing jumps. On a landing page (`landing`) one filter is locked and hidden. */
function Roles({ profile, withDb, mode = "mine", landing }: { profile: ProfilePicks & { updatedAt: string }; mode?: "mine" | "public"; landing?: LandingPage } & Pick<ReturnType<typeof useProfile>, "withDb">) {
  const preset = landing?.preset;
  const { filters, query, setFilters } = useRoleFilters(preset);
  const { state, facets, more, refreshing, retry, showMore } = useRoles(filters, `${query}|${profile.updatedAt}`, withDb, mode, profile.levels);
  const ready = state.kind === "ready" ? state : null;
  const controls = { filters, profile, facets, onChange: setFilters, preset };
  return (
    <>
      <RolesToolbar {...controls} total={ready ? ready.page.total : null} />
      <FilterChips {...controls} />
      <ResultLine total={ready ? ready.page.total : null} sort={mode === "mine" ? filters.sort : null} onSort={(sort) => setFilters({ ...filters, sort })} />
      {state.kind === "loading" && <p className="font-mono text-xs text-muted">{mode === "public" ? PUBLIC_COPY.loading : MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {ready && (
        <section aria-labelledby="roles-count" aria-busy={refreshing} className={`flex flex-col gap-2 ${refreshing ? "opacity-60" : ""}`}>
          {ready.page.matches.length === 0 && (
            <EmptySheet shape="half" color="off" tile="red"><p className="text-ink">{mode === "public" ? PUBLIC_COPY.empty : MATCHES_COPY.empty}</p></EmptySheet>
          )}
          <ul className="flex flex-col">{ready.page.matches.map((match) => <MatchRow key={match.id} match={match} personal={mode === "mine"} />)}</ul>
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

/** All roles (`/matches`): every role that fits, with the filters in a toolbar. Someone the first visit still has a
 *  question for is sent there (`/start`) instead. With `landing`, one of the internship, new-grad and remote pages:
 *  the same list, its own title and line, one filter locked. */
export function MatchesScreen({ landing: id }: { landing?: LandingId } = {}) {
  const { isLoaded, userId: signedIn } = useSessionDb();
  const landing = id ? landingById(id) : undefined;
  if (isLoaded && !signedIn) return <PublicJobs landing={landing} />;
  return <MyJobs landing={landing} />;
}

/** Jobs' title with the quick links to the landing pages, or a landing page's title, its one line and the way back. */
function Header({ landing }: { landing?: LandingPage }) {
  // The quick links sit right under Jobs' title, ahead of the numbers and the banner (review, 2026-11-22)
  if (!landing) return <><PageHeader title={MATCHES_COPY.title} back={null} /><LandingLinks /></>;
  return <PageHeader title={landing.title} intro={landing.line} back={MATCHES_PATH} backLabel={LANDING_COPY.back} />;
}

/** A person who has no picks: nothing narrows the list until they choose here. */
const NO_PICKS = { families: [], levels: [], updatedAt: "public" };

/** Jobs for a signed-out visitor (user, 2026-11-21): the live numbers, what signing in adds, then every role, newest
 *  first, with the same filters. Each title opens its company's page. A landing page leaves the numbers out: they
 *  count every role and would read as the page's own count. */
function PublicJobs({ landing }: { landing?: LandingPage }) {
  const { withDb } = useSessionDb();
  return (
    <div className="flex w-full flex-col gap-4 lg:max-w-4xl">
      <Header landing={landing} />
      {!landing && <NumbersStrip withDb={withDb} />}
      <JobsBanner />
      <Roles profile={NO_PICKS} withDb={withDb} mode="public" landing={landing} />
    </div>
  );
}

function MyJobs({ landing }: { landing?: LandingPage }) {
  const { state, userId, retry, withDb } = useProfile();
  const firstVisit = useFirstVisitGate(state, userId);

  return (
    <div className="flex w-full flex-col gap-4 lg:max-w-4xl">
      <Header landing={landing} />
      {(state.kind === "loading" || firstVisit) && <p className="font-mono text-xs text-muted">{MATCHES_COPY.loading}</p>}
      {state.kind === "failed" && <Failed message={state.message} onRetry={retry} />}
      {/* Not reached while the first visit sends anyone without a resume to /start; kept should that ever fail */}
      {state.kind === "ready" && !firstVisit && state.profile === null && (
        <EmptySheet shape="arch" color="mustard" tile="navy">
          <p className="text-ink">{MATCHES_COPY.noResume}</p>
          <ButtonLink href={START_PATH}>{MATCHES_COPY.toProfile}</ButtonLink>
        </EmptySheet>
      )}
      {state.kind === "ready" && !firstVisit && state.profile && <Roles profile={state.profile} withDb={withDb} landing={landing} />}
    </div>
  );
}

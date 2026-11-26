"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSessionDb } from "@/components/auth/useSessionDb";
import { Button } from "@/components/ui/Button";
import { EmptySheet } from "@/components/ui/EmptySheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { investorsLine, stageWords } from "@/lib/cards/copy";
import { leadSentence } from "@/lib/cards/trim";
import { companyHref } from "@/lib/company/constants";
import { BACKERS, COMPANY_SORTS, STAGE_GROUPS, type CompanySort, type StageGroup } from "@/lib/companies/constants";
import { COMPANIES_COPY, companiesCount, newestLine, openRolesCount } from "@/lib/companies/copy";
import type { CompanyFilters, CompanyRow } from "@/lib/companies/types";
import { LEVEL_TILE_CLASS } from "@/lib/matches/tiles";
import { SEARCH_DEBOUNCE_MS } from "@/lib/roles/constants";
import { useCompanies } from "./useCompanies";

const FIELD = "min-h-10 border-2 border-ink bg-surface px-2 text-sm text-ink focus-visible:outline-3 focus-visible:outline-focus";
const SORT_LABEL: Record<CompanySort, string> = { recent: COMPANIES_COPY.recent, roles: COMPANIES_COPY.roles, fit: COMPANIES_COPY.fit };

/** Companies (`/companies`, user 2026-11-21): every company, open to signed-out visitors. Search, stage, who backs them,
 *  hiring now, and the order; signed in, it starts in the order that fits the person. Each row opens the company page. */
export function CompaniesScreen() {
  const { isLoaded, userId, withDb } = useSessionDb();
  const [filters, setFilters] = useState<Omit<CompanyFilters, "sort">>({ query: "", stage: "", backer: "", hiring: true });
  const [typed, setTyped] = useState("");
  // Signed in, the list starts in the order that fits the person; a choice they make stands. Fit needs a resume, so a
  // signed-out visitor gets the newest roles first
  const [chosen, setChosen] = useState<CompanySort | null>(null);
  const wanted = chosen ?? (userId ? "fit" : "recent");
  const sort: CompanySort = wanted === "fit" && !userId ? "recent" : wanted;
  const { state, more, refreshing, retry, showMore } = useCompanies({ ...filters, sort }, withDb, isLoaded);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.query === typed ? f : { ...f, query: typed })), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [typed]);

  const sorts = COMPANY_SORTS.filter((s) => s !== "fit" || userId);
  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader title={COMPANIES_COPY.title} back={null} />
      <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={COMPANIES_COPY.search} aria-label={COMPANIES_COPY.search} maxLength={100} className={`${FIELD} w-full px-3`} />
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={COMPANIES_COPY.stage} value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value as StageGroup | "" })} className={FIELD}>
          <option value="">{COMPANIES_COPY.anyStage}</option>
          {STAGE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <select aria-label={COMPANIES_COPY.backer} value={filters.backer} onChange={(e) => setFilters({ ...filters, backer: e.target.value })} className={FIELD}>
          <option value="">{`${COMPANIES_COPY.backer}: ${COMPANIES_COPY.anyBacker}`}</option>
          {BACKERS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <label className="inline-flex min-h-10 items-center gap-2 border-2 border-ink bg-surface px-2 text-sm font-bold text-ink">
          <input type="checkbox" checked={filters.hiring} onChange={(e) => setFilters({ ...filters, hiring: e.target.checked })} className="size-4 accent-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus" />
          {COMPANIES_COPY.hiring}
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-2">
        <p aria-live="polite" className="min-h-6 text-base font-extrabold text-ink">{state.kind === "ready" ? companiesCount(state.page.total) : ""}</p>
        <label className="flex items-center gap-2 font-mono text-xs text-ink">
          {COMPANIES_COPY.sort}
          <select value={sort} onChange={(e) => setChosen(e.target.value as CompanySort)} className="min-h-9 border border-ink bg-surface px-2 font-sans text-sm text-ink focus-visible:outline-3 focus-visible:outline-focus">
            {sorts.map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
          </select>
        </label>
      </div>
      {state.kind === "loading" && <p className="font-mono text-xs text-muted">{COMPANIES_COPY.loading}</p>}
      {state.kind === "failed" && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="font-bold text-danger">{state.message}</p>
          <Button variant="secondary" onClick={retry}>{COMPANIES_COPY.tryAgain}</Button>
        </div>
      )}
      {state.kind === "ready" && (
        <section aria-busy={refreshing} className={`flex flex-col gap-2 ${refreshing ? "opacity-60" : ""}`}>
          {state.page.rows.length === 0 && <EmptySheet shape="half" color="off" tile="red"><p className="text-ink">{COMPANIES_COPY.empty}</p></EmptySheet>}
          <ul className="flex flex-col">{state.page.rows.map((row) => <Row key={row.companyId} row={row} />)}</ul>
          {state.asked < state.page.total && (
            <div className="flex flex-col items-start gap-2 pt-2">
              {more === "failed" && <p role="alert" className="font-bold text-danger">{COMPANIES_COPY.moreFailed}</p>}
              <Button variant="secondary" onClick={showMore} disabled={more === "loading"}>{COMPANIES_COPY.more}</Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/** One company, in three weights (user, 2026-11-24): its name, the heaviest, and one quiet sentence on the left; how
 *  many roles it has open as the lead number on the right, a link to its page, then when the newest was posted, its
 *  stage and batch as small tiles and its backers, all quiet. */
function Row({ row }: { row: CompanyRow }) {
  const tiles = [stageWords(row.stage), row.batch ? `YC ${row.batch}` : null].filter((tile): tile is string => Boolean(tile));
  const newest = row.openRoles > 0 ? newestLine(row.lastPostedAt) : null;
  return (
    <li className="flex min-w-0 flex-col gap-2 border-b border-hairline py-4 last:border-b-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:gap-x-10">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xl leading-tight font-black tracking-[-0.02em]">
          <Link href={companyHref(row.companyId)} className="-my-1.5 inline-block py-1.5 break-words text-ink underline-offset-4 hover:text-link hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">{row.name}</Link>
        </h2>
        {row.oneLiner && <p className="text-sm leading-snug text-muted">{leadSentence(row.oneLiner).lead}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="leading-tight">
          {row.openRoles > 0 ? (
            // The count opens the company's page, where every open role is listed (user, 2026-11-24): a link, so it
            // looks like one and not like the name
            <Link href={companyHref(row.companyId)} className="text-lg font-black text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">{openRolesCount(row.openRoles)} →</Link>
          ) : <span className="text-sm text-muted">{openRolesCount(row.openRoles)}</span>}
          {newest && <span className="block font-mono text-xs text-muted">{newest}</span>}
        </p>
        {tiles.length > 0 && <p className="flex flex-wrap gap-1.5">{tiles.map((tile) => <span key={tile} className={LEVEL_TILE_CLASS}>{tile}</span>)}</p>}
        {row.investors.length > 0 && <p className="font-mono text-[11px] leading-4 text-muted">{investorsLine(row.investors)}</p>}
      </div>
    </li>
  );
}

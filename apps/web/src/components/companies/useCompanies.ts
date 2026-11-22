"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { COMPANIES_PAGE_SIZE } from "@/lib/companies/constants";
import { COMPANIES_COPY } from "@/lib/companies/copy";
import { loadCompanies } from "@/lib/companies/remote";
import type { CompaniesPage, CompanyFilters } from "@/lib/companies/types";

export type CompaniesState = { kind: "loading" } | { kind: "failed"; message: string } | { kind: "ready"; page: CompaniesPage; asked: number };

/** The companies for the filters, read again when they change (the old rows stay, dimmed, until the new ones come),
 *  and "Show more". Only the newest read's answer is shown. */
export function useCompanies(filters: CompanyFilters, withDb: WithDb, enabled: boolean) {
  const [state, setState] = useState<CompaniesState>({ kind: "loading" });
  const [shownFor, setShownFor] = useState<string | null>(null);
  const [more, setMore] = useState<"loading" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(filters);
  const latest = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const mine = ++latest.current;
    withDb(COMPANIES_COPY.loadFailed, (db) => loadCompanies(db, filters, 0)).then((r) => {
      if (mine !== latest.current) return;
      setMore(null);
      setShownFor(key);
      setState(r.ok ? { kind: "ready", page: r.value, asked: COMPANIES_PAGE_SIZE } : { kind: "failed", message: r.message });
    });
    // `filters` is read through `key`, which changes whenever they do
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, withDb, enabled, attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const showMore = useCallback(async () => {
    if (state.kind !== "ready" || more === "loading") return;
    const { asked } = state;
    const mine = latest.current;
    setMore("loading");
    const r = await withDb(COMPANIES_COPY.moreFailed, (db) => loadCompanies(db, filters, asked));
    if (mine !== latest.current) return;
    setMore(r.ok ? null : "failed");
    if (!r.ok) return;
    setState((now) => {
      if (now.kind !== "ready") return now;
      const seen = new Set(now.page.rows.map((row) => row.companyId));
      return { kind: "ready", page: { rows: [...now.page.rows, ...r.value.rows.filter((row) => !seen.has(row.companyId))], total: r.value.total }, asked: asked + COMPANIES_PAGE_SIZE };
    });
  }, [state, more, withDb, filters]);

  return { state, more, refreshing: state.kind === "ready" && shownFor !== key, retry, showMore };
}

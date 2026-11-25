// "More roles at {company}" on a role page (user, 2026-11-23): one page is one role, so the company's other roles are
// plain links to their own pages, one line each with at most two short words. Pure.
import { daysBetween } from "../cards/age";
import { roleTitle } from "../cards/copy";
import type { CardRole } from "../cards/types";
import type { Level } from "../profile/roles";
import { roleHref } from "./constants";
import { ROLE_PAGE_COPY } from "./pageCopy";
import { ROLES_SHOWN } from "./roles";

export interface MoreRoleRow {
  id: string;
  title: string;
  href: string;
  /** "Internship" or "Full-time"; null when the level is not known. */
  kind: string | null;
  /** "6 days", "2 mo"; null when the date is not known. */
  age: string | null;
}

export function kindWord(level: Level): string | null {
  if (level === "intern") return ROLE_PAGE_COPY.internship;
  return level === "unspecified" ? null : ROLE_PAGE_COPY.fullTime;
}

/** The age as a short muted word: "today", "1 day", "6 days", "3 wk", "2 mo", "1 yr+". */
export function shortAge(iso: string | null, now: Date = new Date()): string | null {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  const days = daysBetween(new Date(iso), now);
  if (days === 0) return "today";
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.floor(days / 7)} wk`;
  if (days < 365) return `${Math.floor(days / 30)} mo`;
  return "1 yr+";
}

const time = (iso: string | null): number => (iso && !Number.isNaN(Date.parse(iso)) ? Date.parse(iso) : -Infinity);

/** The other roles, the page's own left out: in fh_company's best-fit order when signed in ("mine"), newest first
 *  signed out (undated last). A new array. */
export function moreRoleRows(roles: readonly CardRole[], current: string | null, mode: "mine" | "public", now: Date = new Date()): MoreRoleRow[] {
  const others = roles.filter((role) => role.id !== current);
  const ordered = mode === "public" ? [...others].sort((a, b) => time(b.postedAt) - time(a.postedAt)) : others;
  return ordered.map((role) => ({
    id: role.id, title: roleTitle(role), href: roleHref(role.id), kind: kindWord(role.level), age: shortAge(role.postedAt, now),
  }));
}

/** The first ROLES_SHOWN, or all once opened; and how many "See all" would add. */
export function shownRows<T>(rows: readonly T[], open: boolean): { shown: T[]; hidden: number } {
  const shown = open ? [...rows] : rows.slice(0, ROLES_SHOWN);
  return { shown, hidden: rows.length - shown.length };
}

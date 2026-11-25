// The role page's header (user, 2026-11-23, Clera's layout in Foothold's own style): the pay line, up to three quiet
// chips, and the "See similar roles" link. Pure.
import type { CardRole } from "../cards/types";
import { MATCHES_PATH } from "../matches/constants";
import type { Level } from "../profile/roles";
import { DEFAULT_FILTERS, filtersToQuery } from "../roles/filters";
import { CURRENCY_SIGNS } from "../signals/constants";
import { money } from "../signals/format";
import type { Signals } from "../signals/types";
import { kindWord } from "./moreRoles";
import { ROLE_PAGE_COPY } from "./pageCopy";

/** Chips under the title. */
export const MAX_CHIPS = 3;
/** The same words the Jobs place filter reads as remote. */
const REMOTE = /remote|anywhere|distributed/i;

/** "$150k – $180k", "$35 – $40/hr", "From $120k", with " OTE" and " + equity" when the posting says so; null when it
 *  states no pay. */
export function salaryHeadline(signals: Signals | null | undefined): string | null {
  const salary = signals?.salary;
  if (!salary) return null;
  const sign = CURRENCY_SIGNS[salary.currency] ?? `${salary.currency} `;
  const at = (n: number) => `${sign}${money(n, salary.period)}`;
  const { min, max } = salary;
  const range = min !== null && max !== null
    ? (min === max ? at(min) : `${at(min)} – ${at(max)}`)
    : min !== null ? `${ROLE_PAGE_COPY.from} ${at(min)}` : `${ROLE_PAGE_COPY.upTo} ${at(max as number)}`;
  return `${range}${salary.period === "hour" ? "/hr" : ""}${salary.ote ? " OTE" : ""}${signals.equity ? ` ${ROLE_PAGE_COPY.plusEquity}` : ""}`;
}

/** The places in a posting's location, which can list several ("NYC; Remote - US", "SF | London"). */
const placesOf = (location: string | null): string[] =>
  (location ?? "").split(/\s*(?:;|\||\n|\s\/\s)\s*/).map((place) => place.trim()).filter(Boolean);

/** Up to three chips: the first place (+N when more), "Remote" when a place says so and the first does not, and the
 *  kind ("Internship" or "Full-time"); each left out when unknown. */
export function roleChips(location: string | null, level: Level): string[] {
  const places = placesOf(location);
  const first = places[0];
  const chips = [
    first ? (places.length > 1 ? `${first} +${places.length - 1}` : first) : null,
    places.some((place) => REMOTE.test(place)) && !(first && REMOTE.test(first)) ? ROLE_PAGE_COPY.remote : null,
    kindWord(level),
  ];
  return chips.filter((chip): chip is string => !!chip).slice(0, MAX_CHIPS);
}

/** Jobs with this role's kind of work and level picked, through the Jobs page's own URL filters. A role with no kind
 *  of work leaves that filter to the profile. */
export function similarRolesHref(role: Pick<CardRole, "family" | "level">): string {
  const query = filtersToQuery({ ...DEFAULT_FILTERS, families: role.family ? [role.family] : null, levels: [role.level] });
  return query ? `${MATCHES_PATH}?${query}` : MATCHES_PATH;
}

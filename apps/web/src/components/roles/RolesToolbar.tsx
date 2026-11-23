"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/ui/Field";
import { MAX_TEXT, SEARCH_DEBOUNCE_MS } from "@/lib/roles/constants";
import { filtersButton, ROLES_COPY } from "@/lib/roles/copy";
import { effectiveFamilies, effectiveLevels, isFiltering, placeTrigger, postedTrigger, triggerLabel } from "@/lib/roles/filters";
import { hiddenControls, lockedNarrowing } from "@/lib/roles/landing";
import { kindPanel, levelPanel, placePanel, postedPanel, type ControlsProps } from "./FilterControls";
import { FilterMenu } from "./FilterMenu";
import { FilterSheet } from "./FilterSheet";

/** The search box: typing waits ~300 ms before the search runs. Follows the URL when it changes elsewhere (a chip
 *  removed, back), adjusted while rendering as React recommends. */
function SearchBox({ filters, onChange }: Pick<ControlsProps, "filters" | "onChange">) {
  const [text, setText] = useState(filters.query);
  const [seen, setSeen] = useState(filters.query);
  if (seen !== filters.query) {
    setSeen(filters.query);
    setText(filters.query);
  }
  const latest = useRef({ filters, onChange });
  useEffect(() => {
    latest.current = { filters, onChange };
  });
  useEffect(() => {
    if (text.trim() === seen) return;
    const timer = setTimeout(() => latest.current.onChange({ ...latest.current.filters, query: text.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, seen]);
  return (
    <div className="w-full">
      <label htmlFor="roles-search" className="sr-only">{ROLES_COPY.searchLabel}</label>
      <input id="roles-search" type="search" value={text} maxLength={MAX_TEXT} placeholder={ROLES_COPY.searchLabel}
        onChange={(event) => setText(event.target.value)} className={inputClass} />
    </div>
  );
}

/** The search box on its own row, full width; under it the four filters as dropdowns (from 640px), or one Filters
 *  button that opens a sheet (on a phone). Quieter than the rest of the page: thin edges, keys only on the triggers,
 *  no tape. Posted and Location name their value on the trigger ("Last 60 days", "Remote"). */
export function RolesToolbar({ total, ...props }: ControlsProps & { total: number | null }) {
  const { filters, profile } = props;
  const on = isFiltering(filters, profile);
  const narrowing = lockedNarrowing(filters, profile, props.preset);
  const hidden = hiddenControls(props.preset);
  return (
    <div className="flex flex-col gap-3">
      <SearchBox filters={filters} onChange={props.onChange} />
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <FilterMenu label={triggerLabel(ROLES_COPY.kind, effectiveFamilies(filters, profile).length)} pressed={on.families}>
          {(close) => kindPanel(props, false, close)}
        </FilterMenu>
        {!hidden.levels && <FilterMenu label={triggerLabel(ROLES_COPY.level, effectiveLevels(filters, profile).length)} pressed={on.levels}>
          {(close) => levelPanel(props, false, close)}
        </FilterMenu>}
        <FilterMenu label={postedTrigger(filters.days)} pressed={on.days} align="right">
          {(close) => postedPanel(props, false, close, "roles-posted")}
        </FilterMenu>
        {!hidden.place && <FilterMenu label={placeTrigger(filters.place)} pressed={on.place} align="right">
          {(close) => placePanel(props, false, close, "roles-place")}
        </FilterMenu>}
      </div>
      <div className="sm:hidden">
        <FilterSheet label={filtersButton(narrowing)} pressed={narrowing > 0} total={total} {...props} />
      </div>
    </div>
  );
}

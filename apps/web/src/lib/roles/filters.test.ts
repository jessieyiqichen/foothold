import { describe, expect, it } from "vitest";
import {
  activeChips, applyChange, clearAll, DEFAULT_FILTERS, effectiveFamilies, effectiveLevels, filtersToQuery, isFiltering,
  parseFilters, rolesArgs, facetsArgs, triggerLabel, postedTrigger, placeTrigger, narrowingCount, type RoleFilters,
} from "./filters";

const PROFILE = { families: ["product", "research"] as const, levels: ["intern", "entry"] as const };
const profile = { families: [...PROFILE.families], levels: [...PROFILE.levels] };
const parse = (query: string) => parseFilters(new URLSearchParams(query));

describe("parseFilters and filtersToQuery: the filters live in the URL", () => {
  it("reads an empty query as the defaults: the profile's kinds of work and levels, the last 60 days, best fit", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
    expect(DEFAULT_FILTERS).toEqual({ query: "", families: null, levels: null, days: 60, place: "", sort: "fit" });
    expect(filtersToQuery(DEFAULT_FILTERS)).toBe("");
  });

  it("round-trips every filter", () => {
    const filters: RoleFilters = { query: "product analyst", families: ["product", "data"], levels: ["entry"], days: 7, place: "New York", sort: "newest" };
    expect(parse(filtersToQuery(filters))).toEqual(filters);
  });

  it("keeps picks in the list's own order, whatever order the URL had", () => {
    expect(parse("kind=data,product").families).toEqual(["product", "data"]);
  });

  it("tells 'as on my profile' (no key) apart from 'no filter' (an empty key)", () => {
    expect(parse("kind=").families).toEqual([]);
    expect(parse("level=").levels).toEqual([]);
    expect(filtersToQuery({ ...DEFAULT_FILTERS, families: [], levels: [] })).toBe("kind=&level=");
  });

  it("reads Any time as no age limit", () => {
    expect(parse("posted=any").days).toBeNull();
    expect(filtersToQuery({ ...DEFAULT_FILTERS, days: null })).toBe("posted=any");
  });

  it("drops what it does not know, keeping the rest", () => {
    expect(parse("kind=product,wizardry,product&level=boss,senior&posted=5&sort=random&place=%20%20")).toEqual({
      ...DEFAULT_FILTERS, families: ["product"], levels: ["senior"],
    });
  });

  it("caps the search and the place at a sensible length", () => {
    expect(parse(`q=${"a".repeat(500)}`).query).toHaveLength(100);
    expect(parse(`place=${"b".repeat(500)}`).place).toHaveLength(100);
  });
});

describe("effective picks: the profile's until the person changes them here", () => {
  it("uses the profile's kinds of work and levels when the URL does not say", () => {
    expect(effectiveFamilies(DEFAULT_FILTERS, profile)).toEqual(["product", "research"]);
    expect(effectiveLevels(DEFAULT_FILTERS, profile)).toEqual(["intern", "entry"]);
  });

  it("uses the URL's when it says, even none", () => {
    expect(effectiveFamilies({ ...DEFAULT_FILTERS, families: ["data"] }, profile)).toEqual(["data"]);
    expect(effectiveLevels({ ...DEFAULT_FILTERS, levels: [] }, profile)).toEqual([]);
  });
});

describe("triggerLabel and isFiltering: what a dropdown's trigger shows", () => {
  it("names the filter and how many are picked", () => {
    expect(triggerLabel("Level", 3)).toBe("Level · 3");
    expect(triggerLabel("Level", 0)).toBe("Level");
  });

  it("is pressed when the filter narrows anything", () => {
    expect(isFiltering(DEFAULT_FILTERS, profile)).toEqual({ families: true, levels: true, days: true, place: false });
    expect(isFiltering({ ...DEFAULT_FILTERS, families: [], levels: [], days: null }, { families: [], levels: [] })).toEqual({ families: false, levels: false, days: false, place: false });
    expect(isFiltering({ ...DEFAULT_FILTERS, place: "remote" }, profile).place).toBe(true);
  });
});

describe("activeChips: only what the person changed here, each with a way to take it off", () => {
  const filters: RoleFilters = { query: "analyst", families: null, levels: ["entry"], days: 30, place: "remote", sort: "newest" };

  it("lists the search, levels picked here, a changed age and the place; the profile's own picks and the default 60 days are not chips", () => {
    expect(activeChips(filters, profile).map((chip) => chip.label)).toEqual(["“analyst”", "New grad or junior", "Last 30 days", "Remote"]);
    expect(activeChips(DEFAULT_FILTERS, profile)).toEqual([]);
  });

  it("takes one value off a list picked here", () => {
    const both = { ...filters, families: ["product", "research"] } as RoleFilters;
    expect(activeChips(both, profile).find((chip) => chip.label === "Research")?.without).toEqual({ ...both, families: ["product"] });
  });

  it("takes the age off as the default 60 days, and the search and place off as empty", () => {
    const chips = activeChips(filters, profile);
    expect(chips.find((chip) => chip.label === "Last 30 days")?.without.days).toBe(60);
    expect(chips.find((chip) => chip.label === "Remote")?.without.place).toBe("");
    expect(chips[0].without.query).toBe("");
  });

  it("names a free-text place as the person typed it; Any time is no filter, so no chip", () => {
    expect(activeChips({ ...DEFAULT_FILTERS, days: null, place: "Austin" }, profile).map((c) => c.label)).toEqual(["Place: Austin"]);
  });

  it("clears to nothing", () => {
    expect(activeChips(clearAll(filters), profile)).toEqual([]);
  });
});

describe("what the triggers and the phone button say", () => {
  it("names the age and the place on their triggers", () => {
    expect(postedTrigger(60)).toBe("Last 60 days");
    expect(postedTrigger(null)).toBe("Posted");
    expect(placeTrigger("remote")).toBe("Remote");
    expect(placeTrigger("San Francisco Bay Area")).toBe("San Francisco Ba…");
    expect(placeTrigger("")).toBe("Location");
  });

  it("counts every narrowing filter for the phone's Filters button, the profile's included", () => {
    expect(narrowingCount(DEFAULT_FILTERS, profile)).toBe(5);
    expect(narrowingCount(clearAll(DEFAULT_FILTERS), profile)).toBe(0);
  });
});

describe("applyChange", () => {
  it("returns a new filters object with the change, leaving the old one as it was", () => {
    const before = { ...DEFAULT_FILTERS };
    const after = applyChange(before, { levels: ["senior"] });
    expect(after.levels).toEqual(["senior"]);
    expect(before.levels).toBeNull();
  });
});

describe("rolesArgs and facetsArgs: what fh_roles and fh_roles_facets are asked", () => {
  it("sends null for the profile's picks, so the database reads them itself", () => {
    expect(rolesArgs(DEFAULT_FILTERS, 0)).toEqual({ p_families: null, p_levels: null, p_days: 60, p_query: null, p_place: null, p_sort: "fit", p_limit: 50, p_offset: 0 });
  });

  it("sends the person's picks, an empty list for none, and Remote as its special value", () => {
    const filters: RoleFilters = { query: "  analyst ", families: [], levels: ["entry"], days: null, place: "Remote", sort: "newest" };
    expect(rolesArgs(filters, 50)).toEqual({ p_families: [], p_levels: ["entry"], p_days: null, p_query: "analyst", p_place: "remote", p_sort: "newest", p_limit: 50, p_offset: 50 });
    expect(facetsArgs(filters)).toEqual({ p_families: [], p_levels: ["entry"], p_days: null, p_query: "analyst", p_place: "remote" });
  });

  it("sends a typed place as typed, trimmed", () => {
    expect(rolesArgs({ ...DEFAULT_FILTERS, place: " San Francisco " }, 0).p_place).toBe("San Francisco");
  });
});

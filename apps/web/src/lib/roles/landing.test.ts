import { describe, expect, it } from "vitest";
import { activeChips, clearAll, DEFAULT_FILTERS, narrowingCount, parseFilters, type RoleFilters } from "./filters";
import {
  hiddenControls, LANDING_COPY, LANDING_PAGES, landingMetadata, LANDING_PATHS, landingById, landingByPath, lockedChips, lockedClearAll, lockedFilters,
  lockedNarrowing, lockedQuery, type Preset,
} from "./landing";

const FULL_STOP = /\.(\s|$)/;
const profile = { families: ["product" as const], levels: ["entry" as const, "senior" as const] };
const none = { families: [], levels: [] };
const parse = (query: string) => parseFilters(new URLSearchParams(query));
const [internships, newGrad, remote] = LANDING_PAGES;
const INTERN: Preset = internships.preset;
const REMOTE: Preset = remote.preset;

describe("LANDING_PAGES: the three pages and what each one shows", () => {
  it("are internships, new grad and remote, each at its own path under /jobs", () => {
    expect(LANDING_PAGES.map((page) => page.id)).toEqual(["internships", "new-grad", "remote"]);
    expect(LANDING_PATHS).toEqual(["/jobs/internships", "/jobs/new-grad", "/jobs/remote"]);
  });

  it("lock the level to intern, the level to entry, and the place to remote", () => {
    expect(internships.preset).toEqual({ field: "levels", value: ["intern"] });
    expect(newGrad.preset).toEqual({ field: "levels", value: ["entry"] });
    expect(remote.preset).toEqual({ field: "place", value: "remote" });
  });

  it("have a title, one plain line, a quick link label and a title and description for sharing", () => {
    expect(LANDING_PAGES.map((page) => page.title)).toEqual(["Internships", "New grad roles", "Remote roles"]);
    for (const page of LANDING_PAGES) {
      for (const line of [page.title, page.line, page.chip, page.description]) {
        expect(line.length, page.id).toBeGreaterThan(0);
        expect(line, line).not.toMatch(FULL_STOP);
      }
      expect(page.metaTitle).toBe(`${page.title} · Foothold`);
    }
  });

  it("say where the level and the place come from", () => {
    expect(internships.line).toMatch(/job title/);
    expect(newGrad.line).toMatch(/job title/);
    // fh_roles_filter matches remote|anywhere|distributed anywhere in the location (review, 2026-11-22)
    expect(remote.line).toMatch(/remote, anywhere or distributed/);
  });

  it("are found by id and by exact path only", () => {
    expect(landingById("remote")).toBe(remote);
    expect(landingByPath("/jobs/new-grad")).toBe(newGrad);
    for (const path of ["/jobs", "/jobs/", "/jobs/other", "/jobs/internships-x", "/jobs/internships/1", "/matches"]) {
      expect(landingByPath(path), path).toBeNull();
    }
  });
});

describe("landingMetadata and LANDING_COPY: what search, sharing and the quick links say", () => {
  it("gives each page its title and description, for search and for a shared link", () => {
    expect(landingMetadata("remote")).toEqual({
      title: "Remote roles · Foothold", description: remote.description,
      openGraph: { title: "Remote roles · Foothold", description: remote.description },
    });
  });

  it("has no full stop", () => {
    for (const line of Object.values(LANDING_COPY)) expect(line, line).not.toMatch(FULL_STOP);
  });
});

describe("lockedFilters: the preset on top of what the URL says", () => {
  it("adds the preset to empty filters", () => {
    expect(lockedFilters(DEFAULT_FILTERS, INTERN)).toEqual({ ...DEFAULT_FILTERS, levels: ["intern"] });
    expect(lockedFilters(DEFAULT_FILTERS, REMOTE)).toEqual({ ...DEFAULT_FILTERS, place: "remote" });
  });

  it("ignores a URL that tries to override it", () => {
    expect(lockedFilters(parse("level=senior,management"), INTERN).levels).toEqual(["intern"]);
    expect(lockedFilters(parse("level="), newGrad.preset).levels).toEqual(["entry"]);
    expect(lockedFilters(parse("place=Paris"), REMOTE).place).toBe("remote");
  });

  it("keeps every other filter from the URL, the other of level and place included", () => {
    const parsed = parse("q=design&kind=design,data&level=senior&posted=7&place=New%20York&sort=newest");
    expect(lockedFilters(parsed, INTERN)).toEqual({ ...parsed, levels: ["intern"] });
    expect(lockedFilters(parsed, REMOTE)).toEqual({ ...parsed, place: "remote" });
  });

  it("leaves the filters as they are without a preset, and never changes the object it is given", () => {
    const parsed = parse("level=senior");
    expect(lockedFilters(parsed, undefined)).toBe(parsed);
    lockedFilters(parsed, INTERN);
    expect(parsed.levels).toEqual(["senior"]);
  });
});

describe("lockedQuery: the URL never carries the preset", () => {
  it("leaves the locked key out", () => {
    expect(lockedQuery({ ...DEFAULT_FILTERS, levels: ["intern"] }, INTERN)).toBe("");
    expect(lockedQuery({ ...DEFAULT_FILTERS, place: "remote" }, REMOTE)).toBe("");
  });

  it("keeps the rest", () => {
    const filters: RoleFilters = { ...DEFAULT_FILTERS, query: "ml", families: ["data"], levels: ["entry"], days: 7, place: "remote", sort: "newest" };
    expect(lockedQuery(filters, REMOTE)).toBe("q=ml&kind=data&level=entry&posted=7&sort=newest");
    expect(lockedQuery(filters, INTERN)).toBe("q=ml&kind=data&posted=7&place=remote&sort=newest");
  });

  it("round-trips through the URL with the preset put back", () => {
    const filters = lockedFilters(parse("q=ml&kind=data&posted=30"), INTERN);
    expect(lockedFilters(parse(lockedQuery(filters, INTERN)), INTERN)).toEqual(filters);
  });
});

describe("hiddenControls: the locked control is not shown", () => {
  it("hides Level on the two level pages and Location on the remote page", () => {
    expect(hiddenControls(INTERN)).toEqual({ levels: true, place: false });
    expect(hiddenControls(newGrad.preset)).toEqual({ levels: true, place: false });
    expect(hiddenControls(REMOTE)).toEqual({ levels: false, place: true });
    expect(hiddenControls(undefined)).toEqual({ levels: false, place: false });
  });
});

describe("lockedChips and lockedClearAll: the preset is not a filter a person can take off", () => {
  it("gives the preset no chip", () => {
    expect(lockedChips(lockedFilters(DEFAULT_FILTERS, INTERN), profile, INTERN)).toEqual([]);
    expect(lockedChips(lockedFilters(DEFAULT_FILTERS, REMOTE), profile, REMOTE)).toEqual([]);
  });

  it("keeps the other chips, each taking off only its own filter and keeping the preset", () => {
    const filters = lockedFilters(parse("q=ml&level=entry&posted=7"), REMOTE);
    const chips = lockedChips(filters, profile, REMOTE);
    expect(chips.map((chip) => chip.label)).toEqual(["“ml”", "New grad or junior", "Last 7 days"]);
    for (const chip of chips) expect(chip.without.place).toBe("remote");
    expect(chips[1].without.levels).toEqual([]);
  });

  it("keeps the place chip on a level page", () => {
    const filters = lockedFilters(parse("place=Austin"), INTERN);
    const chips = lockedChips(filters, profile, INTERN);
    expect(chips.map((chip) => chip.label)).toEqual(["Place: Austin"]);
    expect(chips[0].without).toEqual({ ...filters, place: "" });
  });

  it("is Jobs' own chips without a preset", () => {
    const filters = parse("q=ml&level=entry&place=remote");
    expect(lockedChips(filters, profile, undefined)).toEqual(activeChips(filters, profile));
  });

  it("clears every filter but the preset (and the sort)", () => {
    const filters = lockedFilters(parse("q=ml&kind=data&posted=7&place=Austin&sort=newest"), INTERN);
    expect(lockedClearAll(filters, INTERN)).toEqual({ ...clearAll(filters), levels: ["intern"] });
    expect(lockedClearAll(lockedFilters(parse("level=entry"), REMOTE), REMOTE)).toEqual({ ...clearAll(DEFAULT_FILTERS), place: "remote" });
    expect(lockedClearAll(filters, undefined)).toEqual(clearAll(filters));
  });
});

describe("lockedNarrowing: the phone's Filters count leaves the preset out", () => {
  it("does not count the locked level or the profile's levels it replaces", () => {
    expect(lockedNarrowing(lockedFilters({ ...DEFAULT_FILTERS, days: null }, INTERN), none, INTERN)).toBe(0);
    // The profile's one kind of work and the default 60 days; its two levels do not apply here
    expect(lockedNarrowing(lockedFilters(DEFAULT_FILTERS, INTERN), profile, INTERN)).toBe(2);
  });

  it("does not count the locked place, but counts the profile's levels on the remote page", () => {
    expect(lockedNarrowing(lockedFilters({ ...DEFAULT_FILTERS, days: null }, REMOTE), none, REMOTE)).toBe(0);
    expect(lockedNarrowing(lockedFilters(DEFAULT_FILTERS, REMOTE), profile, REMOTE)).toBe(4);
  });

  it("is Jobs' own count without a preset", () => {
    expect(lockedNarrowing(DEFAULT_FILTERS, profile, undefined)).toBe(narrowingCount(DEFAULT_FILTERS, profile));
  });
});

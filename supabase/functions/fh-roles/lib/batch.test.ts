import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FAMILIES, familyOf, LEVELS, levelOf } from "../../../../packages/core/src/roles";
import { LIMIT_DEFAULT, LIMIT_MAX, pickLimit, reachedEnd, readPostings, shouldRecount, withRoles } from "./batch";

describe("pickLimit", () => {
  it("keeps a whole number inside 1..LIMIT_MAX", () => {
    expect(pickLimit(500)).toBe(500);
    expect(pickLimit(0)).toBe(1);
    expect(pickLimit(-3)).toBe(1);
    expect(pickLimit(LIMIT_MAX + 1)).toBe(LIMIT_MAX);
  });
  it("falls back to the default for anything that is not a whole number", () => {
    for (const v of [undefined, null, "500", 2.5, Number.NaN, {}, [10]]) expect(pickLimit(v)).toBe(LIMIT_DEFAULT);
  });
});

describe("readPostings", () => {
  it("keeps rows with a whole-number id; a title that is not text becomes null", () => {
    const data = [{ id: 7, title: "Product Manager" }, { id: 8, title: null }, { id: 9, title: 42 }, { id: 10 }];
    expect(readPostings(data)).toEqual([
      { id: 7, title: "Product Manager" }, { id: 8, title: null }, { id: 9, title: null }, { id: 10, title: null },
    ]);
  });
  it("drops rows without a usable id, and anything that is not a list", () => {
    expect(readPostings([null, "x", {}, { id: "7", title: "a" }, { id: 1.5, title: "a" }, { id: -1, title: "a" }])).toEqual([]);
    expect(readPostings(null)).toEqual([]);
    expect(readPostings({ id: 1, title: "a" })).toEqual([]);
  });
});

describe("withRoles", () => {
  it("labels each posting from its title, in order, without touching the input", () => {
    const postings = [
      { id: 1, title: "Product Manager - Agent Platform" },
      { id: 2, title: "Senior Software Engineer" },
      { id: 3, title: "Data Analyst Intern" },
      { id: 4, title: null },
    ];
    const before = structuredClone(postings);
    expect(withRoles(postings, familyOf, levelOf)).toEqual([
      { id: 1, family: "product", level: "unspecified" },
      { id: 2, family: "engineering", level: "senior" },
      { id: 3, family: "data", level: "intern" },
      { id: 4, family: "other", level: "unspecified" },
    ]);
    expect(postings).toEqual(before);
  });
});

// The migration repeats the ids of FAMILIES and LEVELS in four check constraints. This fails when the two drift.
describe("the matching migration", () => {
  const sql = readFileSync(new URL("../../../migrations/20261112100000_foothold_matching.sql", import.meta.url), "utf8");
  const listAfter = (marker: string): string[] => {
    const at = sql.indexOf(marker);
    expect(at, marker).toBeGreaterThan(-1);
    const rest = sql.slice(at + marker.length);
    return [...rest.slice(0, rest.search(/[)\]]/)).matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  };
  const families = FAMILIES.map((f) => f.id);
  const levels = LEVELS.map((l) => l.id);

  it("allows exactly the family ids on postings and on profiles", () => {
    expect(listAfter("check (family in (")).toEqual(families);
    expect(listAfter("families <@ array[")).toEqual(families);
  });
  it("allows exactly the level ids on postings and on profiles", () => {
    expect(listAfter("check (level in (")).toEqual(levels);
    expect(listAfter("levels <@ array[")).toEqual(levels);
  });
  it("lets the roles worker record its runs", () => {
    expect(listAfter("fh_runs_source_check check (source in (")).toEqual(["yc", "hn", "vc", "ats", "tag", "roles"]);
  });
});

describe("when a call recounts the tags", () => {
  it("only the call that labelled the last rows does", () => {
    expect(shouldRecount(120, 500, 120)).toBe(true);
  });
  it("a full batch is not the end", () => {
    expect(reachedEnd(500, 500)).toBe(false);
    expect(shouldRecount(500, 500, 500)).toBe(false);
  });
  it("a call that changed nothing never recounts, however it is asked", () => {
    expect(shouldRecount(0, 1, 0)).toBe(false);
    expect(shouldRecount(0, 500, 0)).toBe(false);
    expect(shouldRecount(3, 500, 0)).toBe(false); // read three, none of them still there to update
  });
  it("the batch limit stays under the 1,000 rows the API returns at most", () => {
    expect(LIMIT_MAX).toBeLessThan(1000);
  });
});

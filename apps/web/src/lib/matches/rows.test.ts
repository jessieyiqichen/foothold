import { describe, expect, it } from "vitest";
import { readMatches, rowToMatch } from "./rows";

const row = {
  id: 4812, title: "Associate Product Manager", company_name: "Acme", url: "https://jobs.ashbyhq.com/acme/123",
  locations: ["New York", "San Francisco"], posted_at: "2026-11-03T10:00:00+00:00", family: "product", level: "entry",
  shared: ["product management", "sql"], score: 7.5, total: 312,
};

describe("rowToMatch: a row from fh_matches is checked before it is shown", () => {
  it("reads a well-formed row", () => {
    expect(rowToMatch(row)).toEqual({
      id: "4812", title: "Associate Product Manager", companyName: "Acme", url: "https://jobs.ashbyhq.com/acme/123",
      locations: ["New York", "San Francisco"], postedAt: "2026-11-03T10:00:00+00:00", family: "product", level: "entry",
      shared: ["product management", "sql"], score: 7.5,
    });
  });

  it("accepts a text id, no company, no places and no date", () => {
    expect(rowToMatch({ ...row, id: "a-1", company_name: null, locations: null, posted_at: null }))
      .toMatchObject({ id: "a-1", companyName: null, locations: [], postedAt: null });
  });

  it("drops a row whose link is not https, so a posting can never open a script or a plain-http page", () => {
    for (const url of ["http://jobs.example.com/1", "javascript:alert(1)", "//jobs.example.com/1", "jobs.example.com", "", null, 5]) {
      expect(rowToMatch({ ...row, url }), String(url)).toBeNull();
    }
  });

  it("drops a row with a missing or mistyped field", () => {
    const bad = [
      null, "row", {}, { ...row, id: null }, { ...row, title: "" }, { ...row, title: 4 }, { ...row, company_name: 4 },
      { ...row, locations: "New York" }, { ...row, locations: ["New York", 3] }, { ...row, posted_at: "soon" },
      { ...row, shared: null }, { ...row, shared: ["sql", 1] }, { ...row, score: "7" }, { ...row, family: 3 }, { ...row, level: null },
    ];
    for (const value of bad) expect(rowToMatch(value), JSON.stringify(value)).toBeNull();
  });

  it("reads a family or level this page does not know as Other and as not stated, rather than hiding the role", () => {
    expect(rowToMatch({ ...row, family: "astronaut", level: "wizard" })).toMatchObject({ family: "other", level: "unspecified" });
  });

  it("trims the title and leaves out empty places", () => {
    expect(rowToMatch({ ...row, title: "  Product Manager ", locations: ["Chicago", " ", ""] })).toMatchObject({ title: "Product Manager", locations: ["Chicago"] });
  });
});

describe("readMatches: one page as the RPC answers it", () => {
  it("keeps the readable rows in order and counts what it dropped", () => {
    const page = readMatches([row, { ...row, id: 2, url: "http://plain.example.com" }, { ...row, id: 3 }]);
    expect(page?.matches.map((m) => m.id)).toEqual(["4812", "3"]);
    expect(page?.dropped).toBe(1);
  });

  it("takes the count of all matches from the rows", () => {
    expect(readMatches([row, { ...row, id: 2 }])?.total).toBe(312);
  });

  it("is an empty page with a count of zero when there are no rows", () => {
    expect(readMatches([])).toEqual({ matches: [], total: 0, dropped: 0 });
  });

  it("never claims fewer matches than it is showing when the count is missing or wrong", () => {
    expect(readMatches([{ ...row, total: "many" }, { ...row, id: 2, total: -4 }])?.total).toBe(2);
  });

  it("is null when the answer is not a list at all", () => {
    expect(readMatches(null)).toBeNull();
    expect(readMatches({ rows: [] })).toBeNull();
  });
});

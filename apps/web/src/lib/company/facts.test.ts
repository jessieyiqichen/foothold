import { describe, expect, it } from "vitest";
import { factRows, type FactsInput } from "./facts";

const NOW = new Date("2026-11-14T15:00:00Z");
const full: FactsInput = {
  stage: "Series A", batch: "W24", teamSize: 38, investors: ["accel", "Y Combinator"], recentRoles: 6,
  lastPostedAt: "2026-10-24T10:00:00Z", website: "https://www.acme.ai/about",
};
const none: FactsInput = { stage: null, batch: null, teamSize: null, investors: [], recentRoles: null, lastPostedAt: null, website: null };

describe("factRows: the company facts table", () => {
  it("gives every row it has data for, in order", () => {
    expect(factRows(full, NOW)).toEqual([
      { key: "stage", label: "Stage", value: "Series A" },
      { key: "batch", label: "YC batch", value: "W24" },
      { key: "team", label: "Team size", value: "38 people" },
      { key: "investors", label: "Investors", value: "Accel and Y Combinator" },
      { key: "recent", label: "Roles posted, last 60 days", value: "6" },
      { key: "posted", label: "Last posted", value: "3 weeks ago" },
      { key: "website", label: "Website", value: "acme.ai", href: "https://www.acme.ai/about" },
    ]);
  });

  it("leaves out every row with no data", () => {
    expect(factRows(none, NOW)).toEqual([]);
  });

  it("leaves out a stage that says nothing and zero recent roles", () => {
    expect(factRows({ ...none, stage: "series_unknown", recentRoles: 0 }, NOW)).toEqual([]);
  });

  it("reads a VC board's stage code and leaves out its size band", () => {
    expect(factRows({ ...none, stage: "series_c_plus", teamSize: 5, investors: ["thrive"] }, NOW)).toEqual([
      { key: "stage", label: "Stage", value: "Series C+" },
      { key: "investors", label: "Investors", value: "Thrive Capital" },
    ]);
  });

  it("names one person in the singular", () => {
    expect(factRows({ ...none, teamSize: 1 }, NOW)).toEqual([{ key: "team", label: "Team size", value: "1 person" }]);
  });
});

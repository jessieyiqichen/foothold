// House style (docs/AGENTS-a3-a5.md): no full stops in the interface; errors say what to do next and take no "!".
import { describe, expect, it } from "vitest";
import { MAX_PLACES_SHOWN } from "./constants";
import { countLine, familyLabel, levelLabel, MATCHES_COPY, MATCHES_ERRORS, placesLine, postedLine, showMoreLabel, whyLine } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("matches page lines", () => {
  const lines = [
    ...Object.values(MATCHES_COPY), countLine(50, 1234), countLine(1, 1), countLine(0, 0), placesLine(["Chicago", "New York"]),
    postedLine("2026-11-03T10:00:00Z", "UTC"), showMoreLabel(1234, 50), whyLine(["sql", "node.js"]), familyLabel("data"), levelLabel("unspecified"),
  ];

  it("have no full stop", () => {
    expect(lines.length).toBeGreaterThan(15);
    for (const line of lines) expect(line, line).not.toMatch(FULL_STOP);
  });

  it("errors take no \"!\" and each says what to do next", () => {
    expect(MATCHES_ERRORS.length).toBeGreaterThan(1);
    for (const line of MATCHES_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });
});

describe("countLine", () => {
  it("says how many are shown of how many there are", () => {
    expect(countLine(50, 1234)).toBe("Showing 50 of 1,234 matches");
    expect(countLine(12, 12)).toBe("12 matches");
    expect(countLine(1, 1)).toBe("1 match");
    expect(countLine(0, 0)).toBe("No matches");
  });
});

describe("placesLine: one role in several cities is one row", () => {
  it("joins a few places", () => {
    expect(placesLine(["Chicago"])).toBe("Chicago");
    expect(placesLine(["Chicago", "New York", "Remote"])).toBe("Chicago, New York, Remote");
  });

  it("cuts a long list and says how many more", () => {
    expect(MAX_PLACES_SHOWN).toBe(3);
    expect(placesLine(["Chicago", "New York", "Remote", "Austin", "Boston"])).toBe("Chicago, New York, Remote +2 more");
  });

  it("says nothing when there is no place", () => {
    expect(placesLine([])).toBe("");
  });
});

describe("postedLine", () => {
  it("gives the day the role was posted, with the year", () => {
    expect(postedLine("2026-11-03T10:00:00Z", "UTC")).toBe("Posted Nov 3, 2026");
  });

  it("says nothing when the date is unknown", () => {
    expect(postedLine(null)).toBe("");
  });
});

describe("labels and reasons", () => {
  it("uses the shared package's names for a family and a level", () => {
    expect(familyLabel("data")).toBe("Data and analytics");
    expect(levelLabel("unspecified")).toBe("Level not in the title");
    expect(levelLabel("entry")).toBe("New grad or junior");
  });

  it("names the shared skills as the reason a role is listed", () => {
    expect(whyLine(["product management", "sql"])).toBe("product management · sql");
    expect(whyLine([])).toBe(MATCHES_COPY.noShared);
  });

  it("says how many the button will add, never more than are left", () => {
    expect(showMoreLabel(1234, 50)).toBe("Show 50 more");
    expect(showMoreLabel(62, 50)).toBe("Show 12 more");
  });
});

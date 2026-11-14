// House style: no full stops; errors take no "!" and say what to do next.
import { describe, expect, it } from "vitest";
import { CARDS_COPY, CARDS_ERRORS, cardLine, decidedLine, doingLines, investorsLine, personName, roleTitle, sourceLine } from "./copy";

const FULL_STOP = /\.(\s|$)/;
const NOW = new Date("2026-11-14T15:00:00Z");

describe("card lines", () => {
  it("have no full stop", () => {
    const lines = [
      ...Object.values(CARDS_COPY), cardLine({ n: 3, of: 5 }), decidedLine("saved", "Acme"), decidedLine("reached_out", "Acme"), decidedLine("skipped", "Acme"),
      sourceLine("hn", "2026-11-12T08:00:00Z", "UTC"), ...doingLines({ stage: "Series A", batch: "W24", teamSize: 38, investors: ["Accel"], lastPostedAt: "2026-10-24T10:00:00Z", recentRoles: 6 }, NOW),
    ];
    for (const line of lines) expect(line, line).not.toMatch(FULL_STOP);
  });

  it("errors take no \"!\" and each says what to do next", () => {
    for (const line of CARDS_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("says which card this is", () => {
    expect(cardLine({ n: 3, of: 5 })).toBe("Card 3 of 5");
  });
});

describe("sourceLine: where a person was found, and when, always", () => {
  it("names the source in words and the day it was seen", () => {
    expect(sourceLine("hn", "2026-11-12T08:00:00Z", "UTC")).toBe("from a Hacker News hiring post, seen Nov 12");
    expect(sourceLine("sec", "2026-11-12T08:00:00Z", "UTC")).toBe("from an SEC Form D filing, seen Nov 12");
    expect(sourceLine("yc", "2026-11-12T08:00:00Z", "UTC")).toBe("from the company's YC page, seen Nov 12");
    expect(sourceLine("site", "2026-11-12T08:00:00Z", "UTC")).toBe("from the company's own website, seen Nov 12");
  });
});

describe("doingLines: how the company is doing", () => {
  it("gives stage or batch, size, investors, recent roles and when it last posted", () => {
    expect(doingLines({ stage: "Series A", batch: "W24", teamSize: 38, investors: ["Accel", "Y Combinator"], lastPostedAt: "2026-10-24T10:00:00Z", recentRoles: 6 }, NOW)).toEqual([
      "Series A · YC W24", "38 people", "Backed by Accel and Y Combinator", "6 roles posted in the last 60 days, the last 3 weeks ago",
    ]);
  });

  it("leaves out what is not known", () => {
    expect(doingLines({ stage: null, batch: null, teamSize: 1, investors: [], lastPostedAt: "2026-11-14T10:00:00Z", recentRoles: null }, NOW)).toEqual(["1 person", "Last posted a role today"]);
    expect(doingLines({ stage: null, batch: null, teamSize: null, investors: [], lastPostedAt: null, recentRoles: null }, NOW)).toEqual([CARDS_COPY.littleKnown]);
  });

  it("cuts a long list of investors", () => {
    expect(investorsLine(["A", "B", "C", "D", "E"])).toBe("Backed by A, B, C +2 more");
  });
});

describe("roleTitle and personName: what a card says when the source gave no title or name", () => {
  it("names a role with no title by where it came from", () => {
    expect(roleTitle({ title: null })).toBe("Role from a Hacker News hiring post");
    expect(roleTitle({ title: "Product Analyst" })).toBe("Product Analyst");
  });

  it("names a person with no name by what they did", () => {
    expect(personName({ name: null })).toBe("The person who posted this role");
    expect(personName({ name: "Dana Lee" })).toBe("Dana Lee");
  });
});

describe("decidedLine: what the Undo bar says", () => {
  it("names the decision and the company", () => {
    expect(decidedLine("saved", "Acme")).toBe("Saved Acme");
    expect(decidedLine("reached_out", "Acme")).toBe("Marked Acme as reached out");
    expect(decidedLine("skipped", "Acme")).toBe("Skipped Acme");
  });
});

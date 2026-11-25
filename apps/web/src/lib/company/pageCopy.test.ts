import { describe, expect, it } from "vitest";
import { aboutCompanyLine, moreRolesTitle, needsYearsLine, peopleLine, reachOutLine, ROLE_PAGE_COPY, ROLE_PAGE_ERRORS, seeAllLine } from "./pageCopy";

describe("role page lines", () => {
  const lines = [
    ...Object.values(ROLE_PAGE_COPY).flat().flatMap((v) => (typeof v === "string" ? [v] : [v.title, v.line])), needsYearsLine(4), reachOutLine("Acme"), moreRolesTitle("Acme", 12), seeAllLine(12),
    aboutCompanyLine("Acme"), peopleLine(1), peopleLine(38),
  ];

  it("have no full stop and no dash between clauses", () => {
    for (const line of lines) {
      expect(line, line).not.toMatch(/\.(\s|$)/);
      expect(line, line).not.toMatch(/—| – /);
    }
  });

  it("errors take no \"!\" and each says what to do next", () => {
    for (const line of ROLE_PAGE_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("names the company and counts", () => {
    expect(reachOutLine("Acme")).toBe("Reach out to Acme");
    expect(moreRolesTitle("Acme", 12)).toBe("More roles at Acme (12)");
    expect(seeAllLine(12)).toBe("See all 12");
    expect(peopleLine(1)).toBe("1 person");
    expect(peopleLine(38)).toBe("38 people");
    expect(needsYearsLine(5)).toBe("Asks for 5+ years of experience");
  });

  it("has three one-line steps in How it works", () => {
    expect(ROLE_PAGE_COPY.howSteps).toHaveLength(3);
  });
});

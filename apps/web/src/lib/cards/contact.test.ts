import { describe, expect, it } from "vitest";
import { contactWays } from "./contact";
import { rowToCard } from "./rows";
import { row } from "./testRow";

const card = (over: Record<string, unknown>) => {
  const read = rowToCard({ ...row, ...over });
  if (!read) throw new Error("the test row did not read");
  return read;
};

describe("contactWays: the ways in shown under Who to contact", () => {
  it("shows the person, and the founders' YC page beneath as a second way in", () => {
    expect(contactWays(card({}))).toEqual({ person: true, founders: "https://www.ycombinator.com/companies/acme-ai", website: null });
  });

  it("shows the person alone when there is no YC page", () => {
    expect(contactWays(card({ founders_url: null }))).toEqual({ person: true, founders: null, website: null });
  });

  it("with no person, points to the founders' YC page instead of the website", () => {
    expect(contactWays(card({ person: null }))).toEqual({ person: false, founders: "https://www.ycombinator.com/companies/acme-ai", website: null });
  });

  it("with neither, keeps the company's website as the way in", () => {
    expect(contactWays(card({ person: null, founders_url: null }))).toEqual({ person: false, founders: null, website: "https://acme.ai" });
    expect(contactWays(card({ person: null, founders_url: null, website: null }))).toEqual({ person: false, founders: null, website: null });
  });
});

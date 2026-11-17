// House style: no full stops; errors take no "!" and say what to do next.
import { describe, expect, it } from "vitest";
import { DAILY_DRAFT_LIMIT } from "./constants";
import { DRAFT_COPY, DRAFT_ERRORS } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("draft lines", () => {
  it("have no full stop, and the errors no \"!\", each saying what to do next", () => {
    for (const line of Object.values(DRAFT_COPY)) expect(line, line).not.toMatch(FULL_STOP);
    for (const line of DRAFT_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("states the daily limit from the constant, as tries", () => {
    expect(DRAFT_COPY.limit).toContain(`${DAILY_DRAFT_LIMIT} tries`);
    expect(DRAFT_COPY.limit).not.toMatch(/drafts written/);
    expect(DRAFT_COPY.limit).toContain("midnight UTC");
    expect(DRAFT_COPY.limit).not.toContain("tomorrow");
  });

  it("tells a model that could not be reached apart from a draft that failed its checks", () => {
    expect(DRAFT_COPY.unavailable).toBe("I couldn't reach the writing model, try again later");
    expect(DRAFT_COPY.unverified).toBe("The draft didn't hold up to checking, try again");
  });

  it("says plainly that nothing is sent", () => {
    expect(DRAFT_COPY.neverSends).toBe("Foothold never sends anything for you");
  });
});

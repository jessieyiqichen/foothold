// House style: no full stops; errors take no "!" and say what to do next.
import { describe, expect, it } from "vitest";
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

  it("says plainly that nothing is sent", () => {
    expect(DRAFT_COPY.neverSends).toBe("Foothold never sends anything for you");
  });
});

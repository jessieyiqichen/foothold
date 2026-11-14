// House style (docs/archive/AGENTS-a3-a5.md): no full stops; cheering lines may end in "!", errors take no "!" and
// each says what to do next.
import { describe, expect, it } from "vitest";
import { START_COPY, START_ERRORS, stepLine } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("first visit lines", () => {
  it("have no full stop", () => {
    const lines = [...Object.values(START_COPY), stepLine(1), stepLine(5)];
    expect(lines.length).toBeGreaterThan(20);
    for (const line of lines) expect(line, line).not.toMatch(FULL_STOP);
  });

  it("errors take no \"!\" and each says what to do next", () => {
    expect(START_ERRORS.length).toBeGreaterThan(1);
    for (const line of START_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("says where the person is", () => {
    expect(stepLine(2)).toBe("Step 2 of 5");
  });
});

// House style (docs/AGENTS-a3-a5.md): no full stops in the interface; errors say what to do next and take no "!".
import { describe, expect, it } from "vitest";
import { addedLine, addLabel, charCountLine, offeredCount, PROFILE_COPY, PROFILE_ERRORS, removedLine, removeLabel, savedLine } from "./copy";

const FULL_STOP = /\.(\s|$)/;

describe("profile page lines", () => {
  const lines = [...Object.values(PROFILE_COPY), charCountLine(1234), savedLine("2026-11-11T18:00:00.000Z", "resume.pdf"), savedLine("2026-11-11T18:00:00.000Z", null),
    removeLabel("node.js", true), removeLabel("node.js", false), addLabel("node.js"), removedLine("node.js"), addedLine("node.js"), offeredCount("Data", 21)];

  it("have no full stop", () => {
    expect(lines.length).toBeGreaterThan(20);
    for (const line of lines) expect(line, line).not.toMatch(FULL_STOP);
  });

  it("errors take no \"!\" and each says what to do next", () => {
    expect(PROFILE_ERRORS.length).toBeGreaterThan(8);
    for (const line of PROFILE_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });

  it("state the limits from the constants, not by hand", () => {
    expect(PROFILE_COPY.tooBig).toContain("5 MB");
    expect(PROFILE_COPY.tooLong).toContain("50,000");
    expect(PROFILE_COPY.tooManyPages).toContain("20 pages");
    expect(charCountLine(1234)).toBe("1,234 of 50,000 characters");
  });

  it("names each tag's control for a screen reader, and says which tags are the person's own", () => {
    expect(removeLabel("sql", false)).toBe("Remove sql");
    expect(removeLabel("tableau", true)).toBe("Remove tableau, added by you");
    expect(addLabel("tableau")).toBe("Add tableau");
    expect(offeredCount("Data", 21)).toBe("Data · 21 more");
    expect(PROFILE_COPY.tagsFull).toContain("60 skills");
  });

  it("says when and from which file a profile was saved", () => {
    expect(savedLine("2026-11-11T18:00:00.000Z", "resume.pdf", "UTC")).toBe("Saved Nov 11, 2026, 6:00 PM from resume.pdf");
    expect(savedLine("2026-11-11T18:00:00.000Z", null, "UTC")).toBe("Saved Nov 11, 2026, 6:00 PM");
  });
});

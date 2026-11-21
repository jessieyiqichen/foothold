import { describe, expect, it } from "vitest";
import { aboutLine, COMPANY_COPY, COMPANY_ERRORS } from "./copy";

describe("company page lines", () => {
  it("have no full stop", () => {
    for (const line of [...Object.values(COMPANY_COPY), aboutLine("Data Analyst")]) expect(line, line).not.toMatch(/\.(\s|$)/);
  });
  it("errors take no \"!\" and each says what to do next", () => {
    for (const line of COMPANY_ERRORS) {
      expect(line, line).not.toMatch(/!$/);
      expect(line, line).toContain(", ");
    }
  });
  it("names the role a message is about", () => {
    expect(aboutLine("Applied Data Researcher")).toBe("About: Applied Data Researcher");
  });
});

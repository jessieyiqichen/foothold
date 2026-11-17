import { describe, expect, it } from "vitest";
import { leadSentence, someSkills } from "./trim";

// The card ran to 2.3 screens; the user asked for it shorter (2026-11-17)
describe("leadSentence: the company in one sentence, the rest behind More", () => {
  const figma = "Figma is a design platform for teams who build products together. Figma helps the entire product team create, test, and ship better designs, faster. On a mission to make design accessible to all.";

  it("keeps the first sentence and says there is more", () => {
    expect(leadSentence(figma)).toEqual({ lead: "Figma is a design platform for teams who build products together.", more: true });
  });
  it("gives a one-sentence text whole", () => {
    expect(leadSentence("Voice AI agents for Indian businesses, in 10 languages")).toEqual({ lead: "Voice AI agents for Indian businesses, in 10 languages", more: false });
  });
  it("does not split at a dot inside a name or an abbreviation", () => {
    expect(leadSentence("Built on Node.js by ex-Google engineers, e.g. at scale. Second sentence.").lead).toBe("Built on Node.js by ex-Google engineers, e.g. at scale.");
  });
  it("cuts a long first sentence at a word, with an ellipsis", () => {
    const long = `${"word ".repeat(60)}end. Next one.`;
    const { lead, more } = leadSentence(long);
    expect(lead.endsWith("…")).toBe(true);
    expect(lead.length).toBeLessThanOrEqual(181);
    expect(lead).not.toMatch(/wor…$/);
    expect(more).toBe(true);
  });
});

describe("someSkills: the first five shared skills and how many more", () => {
  it("shows five and counts the rest", () => {
    expect(someSkills(["a", "b", "c", "d", "e", "f", "g"])).toEqual({ shown: ["a", "b", "c", "d", "e"], more: 2 });
  });
  it("shows a short list whole", () => {
    expect(someSkills(["sql", "python"])).toEqual({ shown: ["sql", "python"], more: 0 });
  });
});

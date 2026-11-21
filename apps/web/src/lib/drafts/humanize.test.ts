import { describe, expect, it } from "vitest";
import { humanProblems, straightQuotes } from "./humanize";

// The user, 2026-11-21: drafts must not read as written by AI. The tells come from the humanizer guide (Wikipedia's
// "Signs of AI writing"): the words models overuse, em dashes, "not only... but", "-ing" tails, chatbot phrases
describe("humanProblems: the tells of AI writing in a draft", () => {
  it("passes plain writing", () => {
    expect(humanProblems("I built a 30-question eval set for a live AI assistant. It found that 44% of calls failed. Could we talk for 15 minutes about the role?")).toEqual([]);
  });
  it("names each overused AI word, as a whole word, in the list's order", () => {
    expect(humanProblems("I want to delve into your pivotal work and showcase my crucial skills.")).toEqual([
      'the body uses the AI-sounding word "crucial"', 'the body uses the AI-sounding word "delve"',
      'the body uses the AI-sounding word "pivotal"', 'the body uses the AI-sounding word "showcase"',
    ]);
    expect(humanProblems("Additionally, this aligns with your landscape.")).toEqual([
      'the body uses the AI-sounding word "additionally"', 'the body uses the AI-sounding word "aligns with"', 'the body uses the AI-sounding word "landscape"',
    ]);
  });
  it("does not flag a word that is part of the role's title or the company's name", () => {
    expect(humanProblems("I want to talk about your Dynamic Pricing Analyst role.", ["Dynamic Pricing Analyst"])).toEqual([]);
    expect(humanProblems("A dynamic team.", ["Pricing Analyst"])).toEqual(['the body uses the AI-sounding word "dynamic"']);
  });
  it("does not flag a word inside another word", () => {
    expect(humanProblems("I enhanced nothing; I used a keyboard and a monkey wrench.")).toEqual([]);
  });
  it("refuses em and en dashes used as punctuation", () => {
    expect(humanProblems("I built evals — forty of them.")).toContain("the body uses a dash as punctuation; use a comma or a full stop");
    expect(humanProblems("I built evals – forty of them.")).toContain("the body uses a dash as punctuation; use a comma or a full stop");
    expect(humanProblems("A 30-question eval set, 2024-25")).toEqual([]);
  });
  it("refuses negative parallels and -ing tails", () => {
    expect(humanProblems("It is not only fast but also accurate.")).toContain('the body uses "not only... but"; say the one thing plainly');
    expect(humanProblems("It's not just about speed, it's about trust.")).toContain('the body uses "not just... it\'s"; say the one thing plainly');
    expect(humanProblems("I shipped the module, highlighting my skills.")).toContain('the body ends a sentence on ", highlighting"; cut it or make it its own sentence');
  });
  it("refuses chatbot phrases", () => {
    expect(humanProblems("Certainly! Let me know if you have questions.")).toEqual(['the body uses the chatbot phrase "certainly!"', 'the body uses the chatbot phrase "let me know if"']);
  });
});

describe("straightQuotes", () => {
  it("turns curly quotes into straight ones", () => {
    expect(straightQuotes("“Hi”, it’s me")).toBe("\"Hi\", it's me");
  });
});

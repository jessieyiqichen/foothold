import { describe, expect, it } from "vitest";
import { checkDraft, quotedIn, wordCount } from "./verify";

const resume = "Built Nous, a cognitive-profile app\nthat turns  interviews into structured insight.\nShipped RAG evals for a lecture assistant.";
const company = "Bolna builds voice AI agents for Indian businesses, in 10 languages.";

describe("quotedIn: a quote must appear word for word in its source", () => {
  it("finds a quote across line breaks and runs of spaces, ignoring case", () => {
    expect(quotedIn("turns interviews into structured insight", resume)).toBe(true);
    expect(quotedIn("Shipped RAG evals", resume)).toBe(true);
    expect(quotedIn("VOICE AI AGENTS for Indian businesses", company)).toBe(true);
  });
  it("tolerates curly quotes and dashes the model may swap in", () => {
    expect(quotedIn("cognitive‐profile app", resume)).toBe(true);
  });
  it("refuses a paraphrase, a quote that adds a word, and one too short to mean anything", () => {
    expect(quotedIn("turns interviews into insight", resume)).toBe(false);
    expect(quotedIn("Shipped RAG evals and fine-tuning", resume)).toBe(false);
    expect(quotedIn("RAG", resume)).toBe(false);
    expect(quotedIn("", resume)).toBe(false);
  });
});

describe("checkDraft", () => {
  const ok = {
    subject: "Voice agents and evals",
    body: Array.from({ length: 90 }, (_, i) => `w${i}`).join(" "),
    resumeQuote: "Shipped RAG evals for a lecture assistant",
    companyQuote: "voice AI agents for Indian businesses",
  };
  it("passes a draft whose quotes are real and whose body is a short email", () => {
    expect(checkDraft(ok, { resume, company })).toEqual([]);
  });
  it("names every problem", () => {
    const bad = { ...ok, resumeQuote: "Led a team of 40", companyQuote: "the leading platform", body: "Hi", subject: "" };
    expect(checkDraft(bad, { resume, company })).toEqual([
      "the subject is empty",
      "the body has 1 words; it must have 40 to 160",
      "the resume quote is not word for word in the resume",
      "the company quote is not word for word in the company description",
    ]);
  });
  it("refuses an email address or a link in the body: the user adds their own", () => {
    expect(checkDraft({ ...ok, body: `${ok.body} me@x.com` }, { resume, company })).toContain("the body must not contain an email address or a link");
    expect(checkDraft({ ...ok, body: `${ok.body} https://x.com` }, { resume, company })).toContain("the body must not contain an email address or a link");
  });
  it("counts words", () => {
    expect(wordCount("  one two\nthree ")).toBe(3);
  });
});

describe("checkDraft: what a hostile company text could make the model write (review, 2026-11-16)", () => {
  const base = {
    subject: "Voice agents and evals",
    body: Array.from({ length: 90 }, (_, i) => `w${i}`).join(" "),
    resumeQuote: "Shipped RAG evals for a lecture assistant",
    companyQuote: "voice AI agents for Indian businesses",
  };
  const problems = (d: Partial<typeof base>) => checkDraft({ ...base, ...d }, { resume, company });
  it("refuses a link or an address in the subject", () => {
    expect(problems({ subject: "Re: https://acme-careers.co/verify" })).toContain("the subject must not contain an email address or a link");
    expect(problems({ subject: "write ops@evil.example" })).toContain("the subject must not contain an email address or a link");
  });
  it("refuses bare domains and short links in the body", () => {
    expect(problems({ body: `${base.body} confirm at acme-careers.co/verify` })).toContain("the body must not contain an email address or a link");
    expect(problems({ body: `${base.body} or bit.ly/x9` })).toContain("the body must not contain an email address or a link");
  });
  it("refuses a phone number in the body", () => {
    expect(problems({ body: `${base.body} call me at +1 (312) 555-0199` })).toContain("the body must not contain a phone number");
    expect(problems({ body: `${base.body} 312.555.0199` })).toContain("the body must not contain a phone number");
  });
  it("keeps ordinary numbers and words with dots", () => {
    expect(problems({ body: `${base.body} in 10 languages, 2027, Node.js and e.g. evals` })).toEqual([]);
  });
  it("caps the subject, the body and each quote in characters", () => {
    expect(problems({ subject: "x".repeat(151) })).toContain("the subject is longer than 150 characters");
    expect(problems({ body: `${base.body} ${"y".repeat(1600)}` })).toContain("the body is longer than 1500 characters");
    expect(problems({ resumeQuote: "Shipped RAG evals for a lecture assistant".padEnd(301, "x") })).toContain("a quote is longer than 300 characters");
  });
});

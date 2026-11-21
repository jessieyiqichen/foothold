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
    // Opens in the first person, as every draft must (2026-11-21)
    body: `I built ${Array.from({ length: 90 }, (_, i) => `w${i}`).join(" ")}`,
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
      'the first sentence must be in the first person ("I\'m ..."), not about the writer in the third person',
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
    // Opens in the first person, as every draft must (2026-11-21)
    body: `I built ${Array.from({ length: 90 }, (_, i) => `w${i}`).join(" ")}`,
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

// A real draft for Figma (2026-11-17) opened "Hello, I am a product manager" for a student who had interned as a PM,
// and leaned on "reaching out because I have long admired": the user asked for drafts that state who they are
// truthfully and do not read like a template
describe("checkDraft: who the writer says they are, and stock phrases", () => {
  const base = {
    subject: "Voice agents and evals",
    // Opens in the first person, as every draft must (2026-11-21)
    body: `I built ${Array.from({ length: 90 }, (_, i) => `w${i}`).join(" ")}`,
    resumeQuote: "Shipped RAG evals for a lecture assistant",
    companyQuote: "voice AI agents for Indian businesses",
  };
  // Placed after the opening, so these test the claim and the phrase, not how the email opens
  const problems = (body: string) => checkDraft({ ...base, body: `${base.body}. ${body}` }, { resume, company });

  it("refuses a job title claimed as the writer's own", () => {
    for (const claim of ["Hello, I am a product manager with an economics background.", "I'm a data scientist.", "As a software engineer, I", "I am an experienced PM"]) {
      expect(problems(claim).some((p) => p.startsWith("the body calls the writer"))).toBe(true);
    }
  });
  it("keeps a title in a true frame: an intern, a student, a role at the company", () => {
    for (const ok of ["As a PM intern at Droi I shipped", "I am a master's student who interned as a product manager.", "Your product manager role caught my eye"]) {
      expect(problems(ok)).toEqual([]);
    }
  });
  it("names each stock phrase it finds", () => {
    expect(problems("I am reaching out because I have long admired Figma.")).toEqual([
      'the body uses the stock phrase "reaching out"', 'the body uses the stock phrase "long admired"',
    ]);
    expect(problems("I hope this email finds you well. I am passionate about AI")).toEqual([
      'the body uses the stock phrase "hope this email finds you well"', 'the body uses the stock phrase "passionate about"',
    ]);
  });
});

// The user, 2026-11-17: the draft read like a student introducing themself, not someone after a role. A draft now
// names one role the company is hiring for, opens with it, and asks for a short chat; it never asks for a referral
describe("checkDraft: a draft about one role, asking for a chat", () => {
  const base = {
    subject: "Applied Data Researcher: built AI eval sets",
    body: `I saw you are hiring an Applied Data Researcher. ${Array.from({ length: 80 }, (_, i) => `w${i}`).join(" ")}`,
    resumeQuote: "Shipped RAG evals for a lecture assistant",
    companyQuote: "voice AI agents for Indian businesses",
  };
  const roles = ["Applied Data Researcher", "PhD Intern, AI Applied Scientist (2027)"];
  const problems = (d: Partial<typeof base>) => checkDraft({ ...base, ...d }, { resume, company, roles });

  it("passes a draft that names a role", () => {
    expect(problems({})).toEqual([]);
  });
  it("accepts a role named without its year or other brackets, or by one part of a long title", () => {
    expect(problems({ body: `Your AI Applied Scientist opening caught my eye. ${base.body}` .replace("an Applied Data Researcher", "a researcher") })).toEqual([]);
  });
  it("refuses a draft that names none of the roles", () => {
    expect(problems({ body: base.body.replace("Applied Data Researcher", "role") })).toContain(
      'the body must name one of the roles they hire for: "Applied Data Researcher"; "PhD Intern, AI Applied Scientist (2027)"',
    );
  });
  it("has nothing to require when no role is known", () => {
    expect(checkDraft({ ...base, body: base.body.replace("Applied Data Researcher", "role") }, { resume, company, roles: [] })).toEqual([]);
  });
  it("refuses a request for a referral", () => {
    for (const ask of ["Could you refer me to the hiring manager?", "Would you be open to a referral?", "I'd be grateful if you could pass my resume along"]) {
      expect(problems({ body: `${base.body} ${ask}` })).toContain("the body must not ask for a referral; ask only for a short chat");
    }
  });
  // The user, 2026-11-17: the opening says who the writer is, short and direct, together with the role
  it("accepts a one-line self-introduction that leads to the role", () => {
    const opening = "I'm a UChicago master's student who interned as a PM, writing about your Applied Data Researcher role.";
    expect(problems({ body: `${opening} ${base.body}` })).toEqual([]);
  });
});

// A real draft, 2026-11-21: "An M.A. student ... is writing to apply" and the company's own "faster, better, and
// cheaper, at scale" pasted in
describe("checkDraft: written by the person, in their own words", () => {
  const base = {
    subject: "Voice agents and evals",
    body: `I'm a student writing about your Product Manager role. ${Array.from({ length: 60 }, (_, i) => `w${i}`).join(" ")}`,
    resumeQuote: "Shipped RAG evals for a lecture assistant",
    companyQuote: "voice AI agents for Indian businesses",
  };
  const problems = (d: Partial<typeof base>) => checkDraft({ ...base, ...d }, { resume, company });
  it("passes a first-person opening, after a greeting too", () => {
    expect(problems({})).toEqual([]);
    expect(problems({ body: `Hi Dana, ${base.body}` })).toEqual([]);
  });
  it("refuses a third-person opening", () => {
    expect(problems({ body: `An M.A. student is writing about your Product Manager role. ${base.body}` }))
      .toContain('the first sentence must be in the first person ("I\'m ..."), not about the writer in the third person');
  });
  it("refuses the company's own words pasted in", () => {
    expect(problems({ body: `${base.body} You build voice AI agents for Indian businesses.` }))
      .toContain("the body pastes the company's own words; say what they do in a few words of your own, or leave it out");
  });
});

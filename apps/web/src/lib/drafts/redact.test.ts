import { describe, expect, it } from "vitest";
import { nameFrom, resumeForModel, withoutContacts } from "./redact";

const resume = [
  "Jessie Chen",
  "jessie@example.com | +1 (312) 555-0199 | linkedin.com/in/someone",
  "Chicago, IL 60637",
  "GitHub: someone",
  "",
  "EDUCATION",
  "The University of Chicago, MA in Computational Social Science, 2025 to 2027",
  "EXPERIENCE",
  "Product Intern, Shanghai, 2026.07 to 2026.09",
  "Diagnosed where the AI assistant's answers went wrong and turned it into fixes the team shipped.",
  "Built Lecture Companion, which answers questions from a course's own materials, see https://example.dev/lc",
].join("\n");

describe("resumeForModel", () => {
  const out = resumeForModel(resume);
  it("drops the name line and every line carrying an address, a link, a phone number or a contact label", () => {
    for (const gone of ["Jessie Chen", "jessie@example.com", "555-0199", "linkedin.com", "IL 60637", "GitHub: someone", "https://"]) {
      expect(out).not.toContain(gone);
    }
  });
  it("keeps the experience and education lines word for word", () => {
    expect(out).toContain("Diagnosed where the AI assistant's answers went wrong and turned it into fixes the team shipped.");
    expect(out).toContain("The University of Chicago, MA in Computational Social Science, 2025 to 2027");
    expect(out).toContain("Product Intern, Shanghai, 2026.07 to 2026.09");
  });
  it("keeps a line that only mentions a link, without the link", () => {
    expect(out).toContain("Built Lecture Companion, which answers questions from a course's own materials, see");
  });
  it("keeps a short first line that is a heading, not a name", () => {
    expect(resumeForModel("EXPERIENCE\nBuilt a thing that people used every week.")).toContain("EXPERIENCE");
  });
  it("drops Chinese contact labels too", () => {
    expect(resumeForModel("陈亦奇\n电话：13476171356\n微信：someone\n产品实习生，负责 AI 助手质量诊断")).toBe("产品实习生，负责 AI 助手质量诊断");
  });
});

describe("withoutContacts: the person's own text, with no way to reach them", () => {
  it("takes out addresses, links and phone numbers and keeps the words", () => {
    expect(withoutContacts("I built evals, write me at jess@uchicago.edu or +1 (312) 555-0199. See jessie.dev/work")).toBe("I built evals, write me at or . See");
  });
  it("takes out the greeting, the sign-off and everything after it, contact lines and the person's name", () => {
    const edit = "Hi Dana,\nI built a 30-question eval set with Jessie's team.\nWeChat: bnananaaaawow\nBest,\nJessie Chen\nUChicago";
    const out = withoutContacts(edit, nameFrom("Jessie Chen\nMA, UChicago"));
    expect(out).toBe("I built a 30-question eval set with 's team.");
    expect(out).not.toMatch(/Dana|Jessie|Chen|bnananaaaawow/);
  });
  it("finds the name only when the resume's first line looks like one", () => {
    expect(nameFrom("Jessie Chen\nExperience")).toBe("Jessie Chen");
    expect(nameFrom("EXPERIENCE\nProduct intern")).toBeNull();
  });
});

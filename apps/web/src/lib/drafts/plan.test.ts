import { describe, expect, it } from "vitest";
import { checkPlan, readPlan, type PlanSources } from "./plan";

const sources: PlanSources = {
  resume: "Built a 30-question eval set for a live AI assistant.\nShipped a content module to 300K daily UV.",
  company: "Bolna builds voice AI agents for Indian businesses, in 10 languages.",
  posting: "You will review conversations and design quality metrics for our voice agents.",
  roles: ["Conversation Quality Analyst", "Product Manager"],
  avoid: null,
};
const good = {
  role_title: "Conversation Quality Analyst", resume_quote: "Built a 30-question eval set for a live AI assistant",
  posting_quote: "design quality metrics for our voice agents", company_quote: "voice AI agents for Indian businesses",
  angle: "Their analyst designs quality metrics; she built an eval set for a live assistant.",
};

describe("readPlan", () => {
  it("reads a plan, empty role and posting quote as none", () => {
    expect(readPlan(good)).toMatchObject({ roleTitle: "Conversation Quality Analyst", postingQuote: "design quality metrics for our voice agents" });
    expect(readPlan({ ...good, role_title: "", posting_quote: "" })).toMatchObject({ roleTitle: null, postingQuote: null });
    expect(readPlan({ ...good, angle: undefined })).toBeNull();
  });
});

describe("checkPlan: every quote word for word, the role one of theirs", () => {
  const plan = readPlan(good)!;
  it("passes a plan whose quotes are real", () => {
    expect(checkPlan(plan, sources)).toEqual([]);
  });
  it("names each problem", () => {
    const bad = readPlan({ ...good, role_title: "Data Scientist", resume_quote: "Led a team of 40 engineers", posting_quote: "own the roadmap end to end", company_quote: "the leading voice platform" })!;
    expect(checkPlan(bad, sources)).toEqual([
      'role_title must be one of: "Conversation Quality Analyst"; "Product Manager"',
      "resume_quote is not word for word in the RESUME",
      "posting_quote is not word for word in the POSTING",
      "company_quote is not word for word under About in COMPANY",
    ]);
  });
  it("needs no posting quote when there is no posting, and no role when none is listed", () => {
    expect(checkPlan(readPlan({ ...good, posting_quote: "", role_title: "" })!, { ...sources, posting: null, roles: [] })).toEqual([]);
  });
  it("refuses the resume line the person asked to move away from", () => {
    expect(checkPlan(plan, { ...sources, avoid: "Built a 30-question eval set for a live AI assistant" }))
      .toContain("resume_quote is the line the person asked to move away from; pick another one");
  });
});

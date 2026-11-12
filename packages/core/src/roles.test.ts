import { describe, expect, it } from "vitest";
import { FAMILIES, familyOf, LEVELS, levelOf } from "./roles";

// Every title below is a real one, read from fh_postings on 2026-11-12.
const FAMILY_CASES: [title: string, family: string][] = [
  ["Product Manager - Agent Platform", "product"],
  ["Senior / Staff Product Manager - IoT Connected Devices", "product"],
  ["Monetization Growth Product Manager", "product"],
  ["Product Management MBA Intern", "product"],
  ["Head of Product", "product"],
  ["Founding Product Lead", "product"],
  ["Vertical PM - Travel, Transportation and Hospitality", "product"],
  ["Product Marketing Lead, Enterprise", "marketing"],
  ["Principal Product Marketing Manager -  Go-To-Market", "marketing"],
  ["Head of Demand Generation", "marketing"],
  ["Technical SEO Specialist", "marketing"],
  ["Senior / Staff Product Designer - Patient", "design"],
  ["Sr. Marketing Designer", "design"],
  ["Product Design Intern", "design"],
  ["Head of Design", "design"],
  ["Product Engineer", "engineering"],
  ["Software Engineer, Product", "engineering"],
  ["Member of Technical Staff, Product", "engineering"],
  ["Engineering Manager - Experimentation", "engineering"],
  ["Senior Snowflake Data Engineer - Talent Pipeline", "engineering"],
  ["Staff Machine Learning Engineer - Edge AI", "engineering"],
  ["Mobile Developer", "engineering"],
  ["Data Scientist - Credit (Retros)", "data"],
  ["Marketing & GTM Data Analyst", "data"],
  ["Director, Performance Analytics", "data"],
  ["Staff Business Analyst", "data"],
  ["Research Engineer, Frontier Data", "research"],
  ["Senior Applied ML/AI Scientist - Search", "research"],
  ["Applied Researcher - Chip Design", "research"],
  ["Director, Clinical Research", "research"],
  ["Account Executive", "sales"],
  ["Sales Engineer", "sales"],
  ["Solutions Engineer - EMEA", "sales"],
  ["Founding Account Executive, Talent Solutions - Mid-Market", "sales"],
  ["Director, Business Development - Search & Evaluation", "sales"],
  ["Sales Development Representative (SDR)", "sales"],
  ["Customer Success Manager", "customer"],
  ["Customer Success Architect, Japan", "customer"],
  ["AI Support Engineer", "customer"],
  ["Director, Client Success", "customer"],
  ["Technical Sourcer - Engineering", "people"],
  ["Lead Talent Acquisitions Partner (Engineering)", "people"],
  ["Recruiting Coordinator", "people"],
  ["Human Resources Business Partner", "people"],
  ["Product Finance Director, AI Products & GPU Investment Strategy", "finance"],
  ["GL Accountant", "finance"],
  ["Controller", "finance"],
  ["Commercial Counsel", "legal"],
  ["Legal Operations Manager (3-6m Contract)", "legal"],
  ["Chief of Staff", "operations"],
  ["Revenue Operations Analyst", "operations"],
  ["Strategic Program Manager", "operations"],
  ["Senior Strategy & Operations Manager", "operations"],
  ["Mobile Dog Groomer", "other"],
  ["Join our Talent Community!", "other"],
  ["Open Application (m/f/d)", "other"],
  ["Nurse", "other"],
];

const LEVEL_CASES: [title: string, level: string][] = [
  ["Software Engineering Intern, iOS (Summer 2027)", "intern"],
  ["Summer 2027 Internship - Supply Chain", "intern"],
  ["Co-Op, AI Nucleic Acid Design", "intern"],
  ["BizOps Junior Associate (Student Position)", "intern"],
  ["Product Management MBA Intern", "intern"],
  ["Integrated Safety Analysis Engineer (New Grad)", "entry"],
  ["May 2027 New Graduate Engineer, GNC & Modeling and Simulation", "entry"],
  ["Junior Project Manager", "entry"],
  ["Junior Counsel", "entry"],
  ["Customer Success Associate - Mexico City (Hybrid)", "entry"],
  ["Associate Account Executive – Italy (Italian Speaking)", "entry"],
  ["Director of Engineering", "management"],
  ["Manager, Engineering", "management"],
  ["Sr. Manager, Website Operations", "management"],
  ["Engineering Manager, Security", "management"],
  ["Head of Product", "management"],
  ["Vice President of Finance", "management"],
  ["VP, People", "management"],
  ["Chief Marketing Officer (CMO)", "management"],
  ["Associate RVP, Mid Market", "management"],
  ["Senior Product Manager - User Platform", "senior"],
  ["Sr. Growth Marketing Manager, AI Discovery", "senior"],
  ["Staff Application Security Engineer", "senior"],
  ["Principal Product Designer-Onboarding", "senior"],
  ["Lead Product Designer - Design Systems", "senior"],
  ["Product Manager", "unspecified"],
  ["Account Executive", "unspecified"],
  ["Chief of Staff", "unspecified"],
  ["Customer Success Manager", "unspecified"],
  ["Founding Product Designer", "unspecified"],
  ["Software Engineer 2, Managed Gateways", "unspecified"],
];

describe("familyOf: the kind of work a title names", () => {
  it.each(FAMILY_CASES)("%s is %s", (title, family) => expect(familyOf(title)).toBe(family));
  it("answers with a listed family for anything, and 'other' for nothing", () => {
    const ids = new Set(FAMILIES.map((f) => f.id));
    for (const title of [null, "", "   ", "シニアバイリンガルソフトウェアエンジニア（日英）", "!!!"]) expect(ids.has(familyOf(title))).toBe(true);
    expect(familyOf(null)).toBe("other");
  });
  it("does not read a word inside another word", () => {
    expect(familyOf("Spam Fighter")).toBe("other"); // not "PM"
    expect(familyOf("Counselor, Youth Programs")).toBe("other"); // not "counsel"
  });
});

describe("levelOf: the level a title states, and nothing it does not", () => {
  it.each(LEVEL_CASES)("%s is %s", (title, level) => expect(levelOf(title)).toBe(level));
  it("answers with a listed level for anything", () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    for (const title of [null, "", "Foundation Models", "Internal Tools Engineer", "International Sales"]) expect(ids.has(levelOf(title))).toBe(true);
    expect(levelOf("Internal Tools Engineer")).toBe("unspecified"); // not "intern"
    expect(levelOf(null)).toBe("unspecified");
  });
});

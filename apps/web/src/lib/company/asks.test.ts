import { describe, expect, it } from "vitest";
import { ASK_MAX_CHARS, askBullets, isAskHeading, MIN_FALLBACK_ASKS } from "./asks";

const posting = (...lines: string[]) => lines.join("\n");

describe("isAskHeading", () => {
  it("knows the usual requirement headings, any case, with or without a colon", () => {
    for (const line of ["Requirements", "requirements:", "Qualifications:", "Minimum Qualifications", "What you'll bring", "What You’ll Bring:", "What we're looking for", "About you", "You have:"]) {
      expect(isAskHeading(line), line).toBe(true);
    }
  });

  it("knows the longer headings postings write in words (2026-11-23: 47% of postings found, these lift it to ~80%)", () => {
    for (const line of [
      "We'd love to hear from you if you have:", "Who you are", "You might be a fit if you have", "What you'll need",
      "The ideal candidate", "Must-haves:", "You should have:", "Skills and experience", "What we’re looking for in you",
    ]) {
      expect(isAskHeading(line), line).toBe(true);
    }
  });

  it("knows the fit and background headings real postings use (2026-11-23: a sample of the ~18% still missed)", () => {
    for (const line of [
      "You are:", "You", "YOU MAY BE A FIT IF:", "To thrive in this role, you have", "You'll thrive here if", "Great fit if you:", "You might thrive in this role if you:", "You’re a great fit if you:",
      "YOU’RE THE RIGHT PERSON FOR THIS ROLE IF:", "What makes you a great fit:", "You could be a match if you are or have:",
      "Your background looks something like this", "What Makes the Right Candidate", "Are you the person we’re looking for?",
      "What we expect from you:", "Your Expertise", "Required:", "Experience & Education", "SKILLS & EXPERIENCE - CORE",
      "✅ Lo que buscamos:", "¿Qué buscamos?",
    ]) {
      expect(isAskHeading(line), line).toBe(true);
    }
  });

  it("does not take a question that is a sentence, or the pluses section", () => {
    expect(isAskHeading("Don’t meet every requirement for the role?")).toBe(false);
    expect(isAskHeading("SKILLS & EXPERIENCE - PLUSES")).toBe(false);
    expect(isAskHeading("Benefits fit for you")).toBe(false);
    for (const line of ["WHY YOU’LL THRIVE HERE", "YOU MAY NOT BE A GREAT FIT IF", "Business Fit/Collaboration", "Forus has exceptional product-market fit and is growing rapidly:"]) {
      expect(isAskHeading(line), line).toBe(false);
    }
  });

  it("does not take a sentence that only mentions them", () => {
    expect(isAskHeading("Requirements change fast here, and so do we.")).toBe(false);
    expect(isAskHeading("Benefits")).toBe(false);
    expect(isAskHeading("If you have questions, write to our recruiting team and we will get back to you soon.")).toBe(false);
  });

  it("leaves the optional sections to the preferred heading, not the asks", () => {
    for (const line of ["Preferred qualifications:", "Nice to have:", "While it's not required, it's an added plus if you also have:", "Bonus points if you have"]) {
      expect(isAskHeading(line), line).toBe(false);
    }
  });
});

describe("askBullets: up to three one-line asks from the requirements section", () => {
  it("takes the bullets under the heading until the next heading", () => {
    const text = posting(
      "We build agents.", "What you'll do:", "- Ship features", "Requirements:", "- 2+ years with SQL", "• Python", "* Clear writing", "- Curiosity", "Benefits:", "- Health",
    );
    expect(askBullets(text)).toEqual(["2+ years with SQL", "Python", "Clear writing"]);
  });

  it("stops at the next heading even before three", () => {
    const text = posting("About you", "1. You know SQL", "2) You like evals", "What we offer", "Equity");
    expect(askBullets(text)).toEqual(["You know SQL", "You like evals"]);
  });

  it("skips empty lines and lines too long to be a bullet", () => {
    const long = "word ".repeat(90).trim();
    const text = posting("Qualifications", "", long, "Strong SQL", "  ", "Python");
    expect(askBullets(text)).toEqual(["Strong SQL", "Python"]);
  });

  it("keeps long bullets (Figma's run 220 characters) and ends the section at the optional one (2026-11-23, a real posting)", () => {
    const req = "Deep expertise in machine learning, statistics, causal inference and evaluation methods, applied to real products with millions of users, and a record of shipping research that changed what the team built next";
    const text = posting("We'd love to hear from you if you have:", req, req, "While it's not required, it's an added plus if you also have:", "Experience with human labeling");
    const asks = askBullets(text);
    expect(asks).toHaveLength(2);
    expect(asks[0].startsWith("Deep expertise in machine learning")).toBe(true);
    expect(asks.join(" ")).not.toContain("labeling");
  });

  it("skips a sub-heading inside the section instead of showing it as an ask (GoFundMe, 2026-11-23)", () => {
    const text = posting("The Job", "- Run the roadmap", "You", "Experience & Education", "- 3+ years in product", "- A degree or the same experience", "Preferred", "- Payments");
    expect(askBullets(text)).toEqual(["3+ years in product", "A degree or the same experience"]);
  });

  it("cuts a line at a word near the cap, with an ellipsis", () => {
    const line = "Experience designing evaluation pipelines for large language model products at a fast growing company";
    const [first] = askBullets(posting("Requirements", line));
    expect(first?.endsWith("…")).toBe(true);
    expect(first!.length).toBeLessThanOrEqual(ASK_MAX_CHARS + 1);
    expect(line.startsWith(first!.slice(0, -1))).toBe(true);
    expect(first!.slice(0, -1).endsWith(" ")).toBe(false);
  });

  it("gives nothing when there is no requirements section", () => {
    expect(askBullets(posting("We build agents.", "Benefits:", "- Health"))).toEqual([]);
    expect(askBullets("")).toEqual([]);
  });

  it("gives nothing when the section has no usable line", () => {
    expect(askBullets(posting("Requirements:", "Benefits:", "- Health"))).toEqual([]);
  });
});

describe("askBullets fallback: no requirements heading (2026-11-23, ~12% of postings)", () => {
  it("takes the lines anywhere that read as an ask", () => {
    const text = posting(
      "About the role", "You will own the roadmap for our data platform.", "What excites you", "- Own the roadmap",
      "- 3+ years of experience in product management", "- Shipping fast", "- Experience with SQL and dashboards", "- A degree in economics or a related field",
      "- Proficiency in Python",
    );
    expect(askBullets(text)).toEqual(["3+ years of experience in product management", "Experience with SQL and dashboards", "A degree in economics or a related field"]);
  });

  it("skips the nice-to-have, benefits and equal opportunity sections", () => {
    const text = posting(
      "The work", "- Experience with SQL", "Nice to have", "- Familiarity with dbt", "Benefits", "- Knowledge of our 401(k) match",
      "Equal opportunity", "- Ability to request an accommodation at any stage", "Day to day", "- Strong communication skills",
    );
    expect(askBullets(text)).toEqual(["Experience with SQL", "Strong communication skills"]);
  });

  it("skips what the company says about itself", () => {
    const text = posting("We have 10 years of experience in payments.", "Our team has deep knowledge of risk.", "- Experience with Stripe", "- Ability to write clearly");
    expect(askBullets(text)).toEqual(["Experience with Stripe", "Ability to write clearly"]);
  });

  it("skips hiring-process lines, funding lines and asks marked a plus (2026-11-23, real postings)", () => {
    const text = posting(
      "In just 2 years we've raised $100M+ from great investors", "- 6+ years in product, ideally B2B SaaS",
      "- Experience with Application Security products (a plus).", "- Ability to break down complex technical concepts",
      "If you require any reasonable adjustments at any stage of the recruitment process, tell us",
    );
    expect(askBullets(text)).toEqual(["6+ years in product, ideally B2B SaaS", "Ability to break down complex technical concepts"]);
  });

  it(`shows nothing with fewer than ${MIN_FALLBACK_ASKS} such lines`, () => {
    expect(askBullets(posting("What excites you", "- Working with data", "- Experience with SQL", "- Clear thinking"))).toEqual([]);
  });

  it("leaves a posting with a heading to the heading", () => {
    const text = posting("- Experience with Go", "- Ability to travel", "Requirements:", "- Strong SQL", "- Python");
    expect(askBullets(text)).toEqual(["Strong SQL", "Python"]);
  });
});

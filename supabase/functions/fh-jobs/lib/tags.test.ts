import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SKILLS } from "./skills";
import { MAX_TAGS, tagsOf } from "./tags";

const tags = (text: string, title = "") => tagsOf(title, text);

describe("tagsOf", () => {
  it("finds skills whatever the case, as whole words", () => {
    expect(tags("We use SQL, python and dbt. You will run A/B tests.")).toEqual(expect.arrayContaining(["sql", "python", "dbt", "experimentation"]));
    expect(tags("A javascript developer")).toContain("javascript");
    expect(tags("We are unsqled and pythonic")).toEqual([]);
  });

  it("keeps case where a word means something else in lower case", () => {
    expect(tags("Advanced Excel skills")).toContain("excel");
    expect(tags("You excel at teamwork")).not.toContain("excel");
    expect(tags("Services in Go, Rust and Java")).toEqual(expect.arrayContaining(["go", "rust", "java"]));
    expect(tags("Our go-to-market team will go far; rust never sleeps")).toEqual(["go-to-market"]);
    expect(tags("Analysis in R and Python")).toEqual(expect.arrayContaining(["r", "python"]));
    expect(tags("R&D team, Series R")).not.toContain("r");
  });

  it("maps what a social science resume says onto what postings say", () => {
    const resume = "Ran difference-in-differences and regression models in Stata and R; designed surveys; econometrics coursework";
    expect(tags(resume)).toEqual(expect.arrayContaining(["causal inference", "regression", "stata", "r", "survey design", "econometrics"]));
  });

  it("reads the title too, and returns each tag once, sorted", () => {
    const out = tagsOf("Account Executive, Enterprise", "Sell to enterprise accounts. Account executives own the full cycle. Salesforce.");
    expect(out).toEqual([...new Set(out)].sort());
    expect(out).toEqual(expect.arrayContaining(["account executive", "enterprise sales", "salesforce"]));
  });

  it("tags a real job-board role", () => {
    const [job] = JSON.parse(readFileSync(new URL("../fixtures/ashby.json", import.meta.url), "utf8")).jobs;
    const out = tagsOf(job.title, job.descriptionPlain);
    expect(out.length).toBeGreaterThan(2);
    expect(out.length).toBeLessThanOrEqual(MAX_TAGS);
  });

  it("handles empty input and never returns more than the cap", () => {
    expect(tagsOf("", "")).toEqual([]);
    const everything = SKILLS.map(([, tag]) => tag).join(", ");
    expect(tagsOf("", everything).length).toBeLessThanOrEqual(MAX_TAGS);
  });
});

describe("the vocabulary", () => {
  it("has patterns that compile, lower-case tags, and a known group on every row", () => {
    const groups = new Set(["engineering", "ai", "data", "research", "product", "design", "sales", "marketing", "operations", "finance", "people", "legal", "industry", "language", "condition"]);
    for (const [group, tag, pattern, flag] of SKILLS) {
      expect(groups.has(group), `${tag}: group ${group}`).toBe(true);
      expect(tag, tag).toBe(tag.toLowerCase());
      expect(() => new RegExp(pattern), `${tag}: ${pattern}`).not.toThrow();
      expect(flag === undefined || flag === "cs", tag).toBe(true);
    }
  });
});

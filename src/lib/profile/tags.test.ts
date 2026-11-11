import { describe, expect, it } from "vitest";
import { groupTags, resumeTags, tagCountLine } from "./tags";
import { SKILLS, SKILLS_VERSION, tagsOf } from "./vocabulary";

describe("resumeTags: a resume is tagged by the function that tags postings", () => {
  const resume = "Ran difference-in-differences and regression models in Stata and R; built dashboards in SQL and Python";

  it("gives exactly what tagsOf gives for the same text", () => {
    expect(resumeTags(resume)).toEqual(tagsOf(null, resume));
    expect(resumeTags(resume)).toEqual(expect.arrayContaining(["causal inference", "regression", "stata", "sql", "python"]));
  });

  it("is empty for an empty text", () => {
    expect(resumeTags("")).toEqual([]);
  });

  it("comes from the same vocabulary version the postings are tagged with", () => {
    expect(SKILLS_VERSION).toBeGreaterThan(0);
    expect(SKILLS.length).toBeGreaterThan(100);
  });
});

describe("groupTags: tags under their vocabulary group", () => {
  const rows: [string, string, string][] = [
    ["engineering", "python", "python"],
    ["ai", "machine learning", "ML"],
    ["ai", "machine learning", "machine learning"],
    ["data", "sql", "sql"],
    ["ai", "llm", "llms?"],
  ];

  it("puts each tag in its group, groups in the vocabulary's order, tags in the order given", () => {
    expect(groupTags(["llm", "machine learning", "python", "sql"], rows)).toEqual([
      { group: "engineering", label: "Engineering", tags: ["python"] },
      { group: "ai", label: "AI", tags: ["llm", "machine learning"] },
      { group: "data", label: "Data", tags: ["sql"] },
    ]);
  });

  it("leaves out a group with no tag", () => {
    expect(groupTags(["sql"], rows).map((g) => g.group)).toEqual(["data"]);
    expect(groupTags([], rows)).toEqual([]);
  });

  it("shows a tag the vocabulary no longer has under Other, last, and each tag once", () => {
    expect(groupTags(["cobol", "sql", "sql"], rows)).toEqual([
      { group: "data", label: "Data", tags: ["sql"] },
      { group: "other", label: "Other", tags: ["cobol"] },
    ]);
  });

  it("places every tag of the real vocabulary in a named group", () => {
    const all = [...new Set(SKILLS.map(([, tag]) => tag))];
    const groups = groupTags(all);
    expect(groups.flatMap((g) => g.tags).sort()).toEqual([...all].sort());
    expect(groups.some((g) => g.group === "other")).toBe(false);
    for (const { label } of groups) expect(label).toMatch(/^[A-Z]/);
  });
});

describe("tagCountLine", () => {
  it("counts in words a person would say", () => {
    expect(tagCountLine(0)).toBe("No skills found yet");
    expect(tagCountLine(1)).toBe("1 skill found");
    expect(tagCountLine(12)).toBe("12 skills found");
  });
});

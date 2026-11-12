import { describe, expect, it } from "vitest";
import { GROUP_FAMILIES, MAX_FAMILIES, MAX_SUGGESTED_FAMILIES } from "./constants";
import { PROFILE_COPY } from "./copy";
import { cleanFamilies, cleanLevels, sameChoice, suggestFamilies, toggleFamily, toggleLevel } from "./directions";
import { FAMILIES, LEVELS } from "./roles";
import { SKILLS } from "./vocabulary";

describe("cleanFamilies: the kinds of work a row or a click may name", () => {
  it("keeps known family ids, each once, in the order picked, at most three", () => {
    expect(cleanFamilies(["product", "data", "product"])).toEqual(["product", "data"]);
    expect(cleanFamilies(["product", "data", "research", "design"])).toEqual(["product", "data", "research"]);
  });

  it("drops what is not a family id", () => {
    expect(cleanFamilies(["product", "wizardry", 7, null, "Product"])).toEqual(["product"]);
  });

  it("reads a row from before the column existed as no choice", () => {
    expect(cleanFamilies(undefined)).toEqual([]);
    expect(cleanFamilies(null)).toEqual([]);
    expect(cleanFamilies("product")).toEqual([]);
  });
});

describe("cleanLevels", () => {
  it("keeps known level ids, each once, in the order the levels are listed", () => {
    expect(cleanLevels(["senior", "intern", "senior", "boss", 3])).toEqual(["intern", "senior"]);
  });

  it("reads a row from before the column existed as no filter", () => {
    expect(cleanLevels(undefined)).toEqual([]);
  });
});

describe("toggleFamily: picking up to three", () => {
  it("adds a family that is not picked and takes off one that is", () => {
    expect(toggleFamily(["product"], "data")).toEqual({ ok: true, value: ["product", "data"] });
    expect(toggleFamily(["product", "data"], "product")).toEqual({ ok: true, value: ["data"] });
  });

  it("refuses the fourth pick and says why", () => {
    const three = ["product", "data", "research"] as const;
    expect(MAX_FAMILIES).toBe(3);
    expect(toggleFamily([...three], "design")).toEqual({ ok: false, message: PROFILE_COPY.tooManyFamilies });
    expect(PROFILE_COPY.tooManyFamilies).toContain("three");
  });

  it("still lets one of three be taken off", () => {
    expect(toggleFamily(["product", "data", "research"], "data")).toEqual({ ok: true, value: ["product", "research"] });
  });

  it("does not change the list it is given", () => {
    const picked = ["product" as const];
    toggleFamily(picked, "data");
    expect(picked).toEqual(["product"]);
  });
});

describe("toggleLevel: the level filter, any number of levels", () => {
  it("adds and removes, kept in the order the levels are listed", () => {
    expect(toggleLevel(["senior"], "intern")).toEqual(["intern", "senior"]);
    expect(toggleLevel(["intern", "senior"], "intern")).toEqual(["senior"]);
    expect(toggleLevel(LEVELS.map((l) => l.id), "entry")).toHaveLength(LEVELS.length - 1);
  });
});

describe("sameChoice", () => {
  it("compares two picks whatever their order", () => {
    expect(sameChoice(["product", "data"], ["data", "product"])).toBe(true);
    expect(sameChoice(["product"], ["product", "data"])).toBe(false);
    expect(sameChoice([], [])).toBe(true);
  });
});

describe("GROUP_FAMILIES: which vocabulary group points at which kind of work", () => {
  it("names only real vocabulary groups and real families", () => {
    const groups = new Set(SKILLS.map(([group]) => group));
    const families = new Set<string>(FAMILIES.map((f) => f.id));
    for (const [group, family] of Object.entries(GROUP_FAMILIES)) {
      expect(groups.has(group), group).toBe(true);
      expect(families.has(family), family).toBe(true);
    }
  });

  it("leaves out the groups that say nothing about the job wanted", () => {
    for (const group of ["ai", "industry", "language", "condition"]) expect(GROUP_FAMILIES).not.toHaveProperty(group);
  });
});

describe("suggestFamilies: a first guess from the profile's skills", () => {
  it("suggests product-like work for a product-oriented profile that also knows AI and data tools", () => {
    // The shape of the first real profile: mostly ai, product, data and research, with a little engineering
    const tags = [
      "llm", "agents", "evals", "prompt engineering", "ai tools", "machine learning",
      "product management", "product strategy", "product analytics",
      "sql", "data analysis", "experimentation", "econometrics", "regression", "stata", "r",
      "research", "user research", "survey design", "economics",
      "python", "apis",
    ];
    const suggestion = suggestFamilies(tags);
    expect(suggestion[0]).toBe("product");
    expect(suggestion).not.toContain("engineering");
    expect(suggestion).toHaveLength(MAX_SUGGESTED_FAMILIES);
    expect(suggestion).toEqual(["product", "research"]);
  });

  it("suggests engineering for an engineering profile", () => {
    expect(suggestFamilies(["python", "typescript", "react", "aws", "docker", "kubernetes", "postgresql", "backend", "sql"])).toEqual(["engineering"]);
  });

  it("weighs a group by the share of its skills on the profile, so a large group does not win by size", () => {
    // Two of design's six skills against three of engineering's thirty-nine
    expect(suggestFamilies(["figma", "prototyping", "python", "react", "docker"])[0]).toBe("design");
  });

  it("does not suggest a kind of work on the strength of one stray skill beside a clear one", () => {
    expect(suggestFamilies(["product management", "product strategy", "product analytics", "growth", "python"])).toEqual(["product"]);
  });

  it("suggests nothing when the skills point nowhere", () => {
    expect(suggestFamilies([])).toEqual([]);
    expect(suggestFamilies(["llm", "spanish", "phd", "not a tag"])).toEqual([]);
  });
});

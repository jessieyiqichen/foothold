import { describe, expect, it } from "vitest";
import { MAX_FAMILIES } from "../profile/constants";
import { NO_EDITS } from "../profile/tagEdits";
import type { Profile } from "../profile/types";
import { STEP_COUNT, SUGGESTED_LEVELS } from "./constants";
import { START_COPY } from "./copy";
import { checkFamilies, familiesDraft, foundResult, levelsDraft, markAfter, readMark, resumeStep, skillChips } from "./steps";

const profile = (over: Partial<Profile> = {}): Profile => ({
  resumeText: "Product work with SQL and user research. ".repeat(8), resumeName: "resume.pdf", tags: ["sql", "user research"],
  tagsAdded: [], tagsRemoved: [], families: [], levels: [], tagsVersion: 2, updatedAt: "2026-11-13T10:00:00.000Z", ...over,
});
const at = (p: Profile) => p.updatedAt;

describe("resumeStep: where a person picks up the first visit", () => {
  it("starts at the resume when there is no profile, whatever the mark says", () => {
    expect(resumeStep(null, null)).toBe(1);
    expect(resumeStep(null, { step: "directions", at: "2026-11-13T10:00:00.000Z" })).toBe(1);
  });

  it("asks to check the skills when a resume was saved but never confirmed here", () => {
    expect(resumeStep(profile(), null)).toBe(2);
  });

  it("goes on to the kinds of work once the skills were confirmed on this very row", () => {
    const p = profile();
    expect(resumeStep(p, { step: "skills", at: at(p) })).toBe(3);
  });

  it("does not trust a mark left from an older row: the profile changed since, so the skills are checked again", () => {
    expect(resumeStep(profile(), { step: "skills", at: "2026-11-12T09:00:00.000Z" })).toBe(2);
  });

  it("asks for levels after the kinds of work were just saved here", () => {
    const p = profile({ families: ["product"] });
    expect(resumeStep(p, { step: "directions", at: at(p) })).toBe(4);
  });

  it("is done for anyone with a resume and kinds of work, so people who set up before the wizard skip it", () => {
    expect(resumeStep(profile({ families: ["product", "research"] }), null)).toBe("done");
    const p = profile({ families: ["product"], levels: ["entry"] });
    expect(resumeStep(p, { step: "levels", at: at(p) })).toBe("done");
    expect(resumeStep(profile({ families: ["product"] }), { step: "directions", at: "2026-11-01T00:00:00.000Z" })).toBe("done");
  });

  it("has five steps, and never resumes at the last: the number found is shown, not saved", () => {
    expect(STEP_COUNT).toBe(5);
  });
});

describe("readMark: the small note kept in the browser, checked before use", () => {
  it("reads a well-formed mark", () => {
    expect(readMark('{"step":"skills","at":"2026-11-13T10:00:00.000Z"}')).toEqual({ step: "skills", at: "2026-11-13T10:00:00.000Z" });
  });

  it("is null for anything else", () => {
    for (const raw of [null, "", "not json", "[]", '{"step":"cooking","at":"2026-11-13T10:00:00.000Z"}', '{"step":"skills","at":"yesterday"}', '{"step":"skills"}']) {
      expect(readMark(raw), String(raw)).toBeNull();
    }
  });
});

describe("markAfter", () => {
  it("names the step just saved and the row it was saved on", () => {
    expect(markAfter("directions", profile())).toEqual({ step: "directions", at: "2026-11-13T10:00:00.000Z" });
  });
});

describe("skillChips: the skills read from the resume, each on or off", () => {
  it("shows every skill found, on, in order", () => {
    expect(skillChips(["sql", "python"], NO_EDITS)).toEqual([{ tag: "python", on: true }, { tag: "sql", on: true }]);
  });

  it("keeps a skill tapped off in its place, off, so tapping it again puts it back and nothing jumps", () => {
    expect(skillChips(["python", "sql"], { added: [], removed: ["python"] })).toEqual([{ tag: "python", on: false }, { tag: "sql", on: true }]);
  });

  it("adds a skill picked from the list, on", () => {
    expect(skillChips(["sql"], { added: ["tableau"], removed: [] })).toEqual([{ tag: "sql", on: true }, { tag: "tableau", on: true }]);
  });

  it("does not show a removed skill this resume never had", () => {
    expect(skillChips(["sql"], { added: [], removed: ["accounting"] })).toEqual([{ tag: "sql", on: true }]);
  });
});

describe("familiesDraft and checkFamilies: step 3", () => {
  it("starts from the saved kinds of work, or the suggestion from the skills, labelled as one", () => {
    expect(familiesDraft(profile({ families: ["design"] }))).toEqual({ families: ["design"], suggested: false });
    const fromSkills = familiesDraft(profile({ tags: ["product management", "product strategy", "user research", "survey design"] }));
    expect(fromSkills.suggested).toBe(true);
    expect(fromSkills.families[0]).toBe("product");
  });

  it("is an empty pick, not a suggestion, when the skills point nowhere", () => {
    expect(familiesDraft(profile({ tags: [] }))).toEqual({ families: [], suggested: false });
  });

  it("needs at least one kind of work to go on, and never more than three", () => {
    expect(checkFamilies([])).toBe(START_COPY.pickOne);
    expect(checkFamilies(["product"])).toBeNull();
    expect(MAX_FAMILIES).toBe(3);
  });
});

describe("levelsDraft: step 4", () => {
  it("suggests internships, new grad roles and roles whose title states no level", () => {
    expect(SUGGESTED_LEVELS).toEqual(["intern", "entry", "unspecified"]);
    expect(levelsDraft(profile())).toEqual({ levels: ["intern", "entry", "unspecified"], suggested: true });
  });

  it("starts from the saved levels when there are some", () => {
    expect(levelsDraft(profile({ levels: ["senior"] }))).toEqual({ levels: ["senior"], suggested: false });
  });
});

describe("foundResult: step 5", () => {
  it("reports the number found", () => {
    expect(foundResult(420)).toEqual({ kind: "found", total: 420, heading: "I found 420 roles for you!" });
    expect(foundResult(1)).toEqual({ kind: "found", total: 1, heading: "I found 1 role for you!" });
    expect(foundResult(1234).heading).toBe("I found 1,234 roles for you!");
  });

  it("sends a person with none back to the kinds of work, with a suggestion to widen them", () => {
    expect(foundResult(0)).toEqual({ kind: "zero", total: 0, heading: START_COPY.zeroHeading, backTo: 3 });
  });
});

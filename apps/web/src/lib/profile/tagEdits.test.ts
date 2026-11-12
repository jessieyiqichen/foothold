import { describe, expect, it } from "vitest";
import { MAX_TAG_EDITS, MAX_TAG_LISTS_BYTES } from "./constants";
import { addTag, canAdd, cleanEdits, effectiveTags, isVocabularyTag, NO_EDITS, offProfileGroups, removeTag } from "./tagEdits";
import { MAX_TAGS, SKILLS } from "./vocabulary";

const FOUND = ["accounting", "python", "sql"];
const ALL = [...new Set(SKILLS.map(([, tag]) => tag))].sort();

describe("isVocabularyTag", () => {
  it("knows the vocabulary's tags and nothing else", () => {
    expect(isVocabularyTag("python")).toBe(true);
    expect(isVocabularyTag("Python")).toBe(false);
    expect(isVocabularyTag("underwater basket weaving")).toBe(false);
  });
});

describe("cleanEdits: what is kept of a person's adds and removes", () => {
  it("drops anything that is not a vocabulary tag, and anything that is not a string", () => {
    expect(cleanEdits({ added: ["tableau", "cobol", 7, null], removed: ["accounting", "<script>"] }))
      .toEqual({ added: ["tableau"], removed: ["accounting"] });
  });

  it("keeps each tag once, sorted", () => {
    expect(cleanEdits({ added: ["tableau", "stata", "tableau"], removed: [] })).toEqual({ added: ["stata", "tableau"], removed: [] });
  });

  it("a tag cannot be both added and removed: removed wins", () => {
    expect(cleanEdits({ added: ["stata", "tableau"], removed: ["tableau"] })).toEqual({ added: ["stata"], removed: ["tableau"] });
  });

  it("reads a row from before tags could be edited as no edits", () => {
    expect(cleanEdits({ added: undefined, removed: undefined })).toEqual(NO_EDITS);
    expect(cleanEdits({ added: null, removed: "sql" })).toEqual(NO_EDITS);
  });

  it("never holds more than the columns allow", () => {
    expect(cleanEdits({ added: ALL, removed: [] }).added.length).toBeLessThanOrEqual(MAX_TAG_EDITS);
  });
});

describe("effectiveTags: found in the text, plus added, minus removed", () => {
  it("is the found tags when nothing was edited", () => {
    expect(effectiveTags(FOUND, NO_EDITS)).toEqual(FOUND);
  });

  it("adds, removes, and stays sorted with each tag once", () => {
    expect(effectiveTags(FOUND, { added: ["tableau", "python"], removed: ["accounting"] })).toEqual(["python", "sql", "tableau"]);
  });

  it("ignores edits that are not vocabulary tags", () => {
    expect(effectiveTags(FOUND, { added: ["cobol"], removed: ["nothing"] })).toEqual(FOUND);
  });

  it("is capped at MAX_TAGS, and the person's own adds are the last to go", () => {
    const found = ALL.filter((tag) => tag !== "tableau").slice(0, MAX_TAGS);
    const out = effectiveTags(found, { added: ["tableau"], removed: [] });
    expect(out).toHaveLength(MAX_TAGS);
    expect(out).toContain("tableau");
    expect(out).toEqual([...out].sort());
  });
});

describe("addTag", () => {
  it("adds a vocabulary tag that the text did not yield", () => {
    expect(addTag(FOUND, NO_EDITS, "tableau")).toEqual({ added: ["tableau"], removed: [] });
  });

  it("drops a tag that is not in the vocabulary", () => {
    expect(addTag(FOUND, NO_EDITS, "cobol")).toEqual(NO_EDITS);
  });

  it("re-adding a removed tag just un-removes it", () => {
    expect(addTag(FOUND, { added: [], removed: ["accounting"] }, "accounting")).toEqual(NO_EDITS);
  });

  it("changes nothing for a tag already on the profile", () => {
    expect(addTag(FOUND, NO_EDITS, "python")).toEqual(NO_EDITS);
    expect(addTag(FOUND, { added: ["tableau"], removed: [] }, "tableau")).toEqual({ added: ["tableau"], removed: [] });
  });

  it("puts back a tag removed under an older resume that the new text does not yield", () => {
    const edits = addTag(["python"], { added: [], removed: ["accounting"] }, "accounting");
    expect(edits).toEqual({ added: ["accounting"], removed: [] });
    expect(effectiveTags(["python"], edits)).toEqual(["accounting", "python"]);
  });

  it("does not change the edits it is given", () => {
    const edits = { added: ["stata"], removed: ["accounting"] };
    addTag(FOUND, edits, "tableau");
    expect(edits).toEqual({ added: ["stata"], removed: ["accounting"] });
  });
});

describe("removeTag", () => {
  it("removes a tag the text yielded", () => {
    expect(removeTag(FOUND, NO_EDITS, "accounting")).toEqual({ added: [], removed: ["accounting"] });
  });

  it("removing an added tag just un-adds it", () => {
    expect(removeTag(FOUND, { added: ["tableau"], removed: [] }, "tableau")).toEqual(NO_EDITS);
  });

  it("changes nothing for a tag that is not on the profile, or not in the vocabulary", () => {
    expect(removeTag(FOUND, NO_EDITS, "tableau")).toEqual(NO_EDITS);
    expect(removeTag(FOUND, NO_EDITS, "cobol")).toEqual(NO_EDITS);
  });

  it("takes off a tag that was added and that the new text now yields as well", () => {
    const edits = removeTag(["python", "tableau"], { added: ["tableau"], removed: [] }, "tableau");
    expect(edits).toEqual({ added: [], removed: ["tableau"] });
    expect(effectiveTags(["python", "tableau"], edits)).toEqual(["python"]);
  });
});

describe("on Replace: the new text is tagged afresh and the person's edits are kept", () => {
  const edits = { added: ["tableau"], removed: ["accounting"] };

  it("keeps an add the new text lacks and a remove the new text yields again", () => {
    expect(effectiveTags(["accounting", "r", "stata"], edits)).toEqual(["r", "stata", "tableau"]);
  });

  it("keeps a remove even when the new text does not yield the tag, for the text after that", () => {
    expect(effectiveTags(["r"], edits)).toEqual(["r", "tableau"]);
    expect(cleanEdits(edits)).toEqual(edits);
  });
});

describe("canAdd", () => {
  it("is false once the profile holds MAX_TAGS", () => {
    expect(canAdd(FOUND, NO_EDITS)).toBe(true);
    expect(canAdd(ALL.slice(0, MAX_TAGS), NO_EDITS)).toBe(false);
    expect(canAdd(ALL.slice(0, MAX_TAGS), { added: [], removed: [ALL[0]] })).toBe(true);
  });
});

describe("offProfileGroups: the vocabulary tags a person could add, by group", () => {
  const groups = offProfileGroups(["python", "sql"]);

  it("lists every vocabulary tag that is not on the profile, and none that is", () => {
    const offered = groups.flatMap((g) => g.tags);
    expect(offered).not.toContain("python");
    expect([...offered, "python", "sql"].sort()).toEqual(ALL);
  });

  it("opens the groups that already have a tag on the profile and closes the rest", () => {
    const open = groups.filter((g) => g.open).map((g) => g.group);
    expect(open.sort()).toEqual(["data", "engineering"]);
    expect(groups.find((g) => g.group === "sales")?.open).toBe(false);
  });
});

describe("MAX_TAG_LISTS_BYTES: the database's cap on the three tag lists together", () => {
  /** A list as Postgres writes it as text, which is what the check measures: {python,"machine learning"}. */
  const asText = (tags: string[]) => `{${tags.map((tag) => (/[\s,{}"\\]/.test(tag) ? `"${tag}"` : tag)).join(",")}}`;
  const bytes = (tags: string[]) => new TextEncoder().encode(asText(tags)).length;

  it("leaves the largest row this page can write at most half the cap", () => {
    const longestFirst = [...ALL].sort((a, b) => b.length - a.length);
    // tags: the MAX_TAGS longest; added and removed never share a tag, so together at most the whole vocabulary
    const largest = bytes(longestFirst.slice(0, MAX_TAGS)) + bytes(ALL) + bytes([]);
    expect(largest * 2).toBeLessThanOrEqual(MAX_TAG_LISTS_BYTES);
  });

  it("is far below what unbounded elements would allow", () => {
    expect(MAX_TAG_LISTS_BYTES).toBeLessThanOrEqual(16_384);
  });
});

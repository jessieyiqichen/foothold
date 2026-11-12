// A person's own corrections to their skill tags. The text is tagged by the vocabulary; the person may take a wrong
// tag off and put a missing one on. Both lists hold vocabulary tags only: what is matched against roles is always a
// word the roles are tagged with too.
import { MAX_TAG_EDITS } from "./constants";
import { groupTags, type TagGroup } from "./tags";
import { MAX_TAGS, SKILLS } from "./vocabulary";

export interface TagEdits {
  /** Tags the person added. */
  added: string[];
  /** Tags the person removed. */
  removed: string[];
}

export const NO_EDITS: TagEdits = { added: [], removed: [] };

const VOCABULARY: ReadonlySet<string> = new Set(SKILLS.map(([, tag]) => tag));

export const isVocabularyTag = (tag: unknown): tag is string => typeof tag === "string" && VOCABULARY.has(tag);

const tidy = (tags: unknown): string[] =>
  Array.isArray(tags) ? [...new Set(tags.filter(isVocabularyTag))].sort().slice(0, MAX_TAG_EDITS) : [];

/** Edits as they are stored and used: vocabulary tags only, each once, sorted; a tag in both lists counts as removed.
 *  Takes anything, so a row's columns (absent on a row from before tags could be edited) can be passed as they come. */
export function cleanEdits(edits: { added: unknown; removed: unknown }): TagEdits {
  const removed = tidy(edits.removed);
  return { added: tidy(edits.added).filter((tag) => !removed.includes(tag)), removed };
}

/** The tags a profile is matched on: found in the text, plus added, minus removed, sorted, at most MAX_TAGS. Over
 *  the cap, found tags give way before the person's own. */
export function effectiveTags(found: string[], edits: TagEdits): string[] {
  const { added, removed } = cleanEdits(edits);
  const fromText = found.filter((tag) => isVocabularyTag(tag) && !added.includes(tag) && !removed.includes(tag));
  return [...new Set([...added, ...fromText.sort()])].slice(0, MAX_TAGS).sort();
}

/** Whether one more tag fits on the profile. */
export const canAdd = (found: string[], edits: TagEdits): boolean => effectiveTags(found, edits).length < MAX_TAGS;

/** Puts a tag on the profile. A removed tag is un-removed; a tag the text does not yield is added. */
export function addTag(found: string[], edits: TagEdits, tag: string): TagEdits {
  if (!isVocabularyTag(tag)) return cleanEdits(edits);
  const removed = edits.removed.filter((t) => t !== tag);
  const added = found.includes(tag) ? edits.added : [...edits.added, tag];
  return cleanEdits({ added, removed });
}

/** Takes a tag off the profile. An added tag is un-added; a tag the text yields is recorded as removed. */
export function removeTag(found: string[], edits: TagEdits, tag: string): TagEdits {
  if (!isVocabularyTag(tag)) return cleanEdits(edits);
  const added = edits.added.filter((t) => t !== tag);
  const removed = found.includes(tag) ? [...edits.removed, tag] : edits.removed;
  return cleanEdits({ added, removed });
}

export type OfferedGroup = TagGroup & { open: boolean };

/** The vocabulary tags that are not on the profile, by group, for adding. A group that already has a tag on the
 *  profile starts open: that is where a missing neighbour is most likely. */
export function offProfileGroups(onProfile: string[]): OfferedGroup[] {
  const has = new Set(onProfile);
  const openGroups = new Set(groupTags(onProfile).map((g) => g.group));
  return groupTags([...VOCABULARY].filter((tag) => !has.has(tag)).sort())
    .map((group) => ({ ...group, open: openGroups.has(group.group) }));
}

import { GROUP_LABELS, OTHER_GROUP } from "./constants";
import { SKILLS, tagsOf } from "./vocabulary";

export interface TagGroup {
  group: string;
  label: string;
  tags: string[];
}

/** A resume has no title, so only the text is read. Same function, same vocabulary as every posting. */
export const resumeTags = (text: string): string[] => tagsOf(null, text);

const labelOf = (group: string) => GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1);

/** Tags under the vocabulary group each belongs to: groups in the vocabulary's order, a tag the vocabulary no longer
 *  has (saved under an older version) under Other, last. */
export function groupTags(tags: string[], skills: readonly (readonly [group: string, tag: string, ...rest: unknown[]])[] = SKILLS): TagGroup[] {
  const groupOf = new Map<string, string>();
  for (const [group, tag] of skills) if (!groupOf.has(tag)) groupOf.set(tag, group);
  const order = [...new Set(groupOf.values()), OTHER_GROUP];
  const byGroup = Map.groupBy(new Set(tags), (tag) => groupOf.get(tag) ?? OTHER_GROUP);
  return order
    .filter((group) => byGroup.has(group))
    .map((group) => ({ group, label: labelOf(group), tags: byGroup.get(group) ?? [] }));
}

export function tagCountLine(count: number): string {
  if (count === 0) return "No skills found yet";
  return count === 1 ? "1 skill found" : `${count} skills found`;
}

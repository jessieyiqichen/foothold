import { PROFILE_COPY } from "@/lib/profile/copy";
import { groupTags, tagCountLine } from "@/lib/profile/tags";

/** The skill tags under their vocabulary groups. Plain text on the page, no boxes: a tag cannot be tapped, and only
 *  things that can be pressed look pressable (design rules). */
export function TagGroups({ tags, heading }: { tags: string[]; heading: string }) {
  const groups = groupTags(tags);
  return (
    <section aria-labelledby="profile-tags" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="profile-tags" className="font-display text-xl font-semibold text-ink">{heading}</h2>
        <p className="text-sm font-semibold text-muted" aria-live="polite">{tagCountLine(tags.length)}</p>
      </div>
      {groups.length === 0 ? (
        <p className="text-muted">{PROFILE_COPY.noTags}</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {groups.map(({ group, label, tags: inGroup }) => (
            <div key={group} className="flex flex-col gap-0.5 border-t border-hairline pt-3 sm:flex-row sm:gap-4">
              <dt className="shrink-0 text-sm font-bold text-muted sm:w-48 sm:pt-0.5">{label}</dt>
              <dd className="font-semibold text-ink">{inGroup.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

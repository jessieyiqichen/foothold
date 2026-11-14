"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { addedLine, addLabel, offeredCount, PROFILE_COPY, removedLine, removeLabel } from "@/lib/profile/copy";
import { addTag, canAdd, editsOf, offProfileGroups, removeTag, type TagEdits } from "@/lib/profile/tagEdits";
import { groupTags, resumeTags, tagCountLine } from "@/lib/profile/tags";
import type { Profile, Result } from "@/lib/profile/types";

interface TagEditorProps {
  profile: Profile;
  onEdit: (edits: TagEdits) => Promise<Result<Profile>>;
}

type Change = { kind: "add" | "remove"; tag: string };
type Notice = { line: string; undo?: Change } | { error: string } | null;

/** One tag edit at a time: saved first, shown after. A failure leaves the skills as they were and says so. */
function useTagEdits(profile: Profile, onEdit: TagEditorProps["onEdit"]) {
  const found = useMemo(() => resumeTags(profile.resumeText), [profile.resumeText]);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  // After a change the pressed button is gone; focus moves here, where the result and Undo are. The page must not
  // scroll to it (user, 2026-11-11: every add or remove jumped to the top); the line follows the reader instead
  const noticeRef = useRef<HTMLDivElement>(null);

  async function change({ kind, tag }: Change, undoable = true) {
    if (pending) return;
    const edits = editsOf(profile);
    if (kind === "add" && !canAdd(found, edits)) return setNotice({ error: PROFILE_COPY.tagsFull });
    setPending(tag);
    const result = await onEdit(kind === "add" ? addTag(found, edits, tag) : removeTag(found, edits, tag));
    setPending(null);
    // "Changed in another tab" is said by the screen, which also reloads the profile
    if (!result.ok) setNotice(result.message === PROFILE_COPY.changedElsewhere ? null : { error: result.message });
    else if (kind === "add") setNotice({ line: addedLine(tag) });
    else setNotice({ line: removedLine(tag), undo: undoable ? { kind: "add", tag } : undefined });
    noticeRef.current?.focus({ preventScroll: true });
  }

  return { pending, notice, noticeRef, change };
}

/** The skills on a saved profile, each a button that takes it off, and under them the vocabulary's other skills by
 *  group, each a button that adds it: the same on-or-off chip as directions and levels, on for a skill you have. */
export function TagEditor({ profile, onEdit }: TagEditorProps) {
  const { pending, notice, noticeRef, change } = useTagEdits(profile, onEdit);
  const mine = new Set(profile.tagsAdded);

  return (
    <section aria-labelledby="profile-tags" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionHeading id="profile-tags">{PROFILE_COPY.savedHeading}</SectionHeading>
        <p className="font-mono text-xs tabular-nums text-muted">{tagCountLine(profile.tags.length)}</p>
      </div>
      <p className="-mt-2 font-mono text-xs leading-5 text-muted">{PROFILE_COPY.editHint}</p>

      <div ref={noticeRef} tabIndex={-1} className="sticky top-0 z-10 flex min-h-11 flex-wrap items-center gap-x-3 bg-page/95 backdrop-blur-sm focus:outline-none">
        <p role="status" className="text-sm font-medium text-ink">{pending ? PROFILE_COPY.savingEdit : notice && "line" in notice ? notice.line : ""}</p>
        {!pending && notice && "error" in notice && <p role="alert" className="text-sm font-bold text-danger">{notice.error}</p>}
        {!pending && notice && "undo" in notice && notice.undo && (
          <Button variant="ghost" onClick={() => change(notice.undo!, false)}>{PROFILE_COPY.undo}</Button>
        )}
      </div>

      <dl className="flex flex-col gap-3">
        {groupTags(profile.tags).map(({ group, label, tags }) => (
          <div key={group} className="flex flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:gap-4">
            <dt className="shrink-0 font-mono text-xs text-muted sm:w-48 sm:pt-2">{label}</dt>
            <dd className="flex flex-wrap gap-x-1.5 gap-y-2.5">
              {tags.map((tag) => (
                <ToggleChip key={tag} on aria-label={removeLabel(tag, mine.has(tag))} onClick={() => change({ kind: "remove", tag })}>
                  {tag}
                  {/* In the chip's own accent: muted grey would fall under 4.5:1 on the tint */}
                  {mine.has(tag) && <span className="text-xs font-normal">{PROFILE_COPY.yours}</span>}
                </ToggleChip>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <OfferedTags onProfile={profile.tags} onAdd={(tag) => change({ kind: "add", tag })} />
    </section>
  );
}

/** The vocabulary's skills that are not on the profile. A group with a skill already on the profile starts open. */
function OfferedTags({ onProfile, onAdd }: { onProfile: string[]; onAdd: (tag: string) => void }) {
  const groups = useMemo(() => offProfileGroups(onProfile), [onProfile]);
  return (
    <section aria-labelledby="profile-add" className="flex flex-col gap-2 border-t border-hairline pt-5">
      <SectionHeading id="profile-add">{PROFILE_COPY.addHeading}</SectionHeading>
      <p className="font-mono text-xs leading-5 text-muted">{PROFILE_COPY.addHint}</p>
      {groups.map(({ group, label, tags, open }) => (
        <details key={group} open={open} className="border-t border-hairline py-1">
          <summary className="flex min-h-10 cursor-pointer items-center font-mono text-xs text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
            {offeredCount(label, tags.length)}
          </summary>
          <div className="flex flex-wrap gap-x-1.5 gap-y-2.5 pb-3 pt-1">
            {tags.map((tag) => (
              <ToggleChip key={tag} on={false} aria-label={addLabel(tag)} onClick={() => onAdd(tag)}>{tag}</ToggleChip>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}

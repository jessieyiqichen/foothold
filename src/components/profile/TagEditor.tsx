"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  // After a change the pressed button is gone; focus moves here, where the result and Undo are
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
    noticeRef.current?.focus();
  }

  return { pending, notice, noticeRef, change };
}

/** The skills on a saved profile, each a button that takes it off, and under them the vocabulary's other skills by
 *  group, each a button that adds it. Buttons because they are pressed (design rules: only pressable things look so). */
export function TagEditor({ profile, onEdit }: TagEditorProps) {
  const { pending, notice, noticeRef, change } = useTagEdits(profile, onEdit);
  const mine = new Set(profile.tagsAdded);

  return (
    <section aria-labelledby="profile-tags" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="profile-tags" className="font-display text-xl font-semibold text-ink">{PROFILE_COPY.savedHeading}</h2>
        <p className="text-sm font-semibold text-muted">{tagCountLine(profile.tags.length)}</p>
      </div>
      <p className="-mt-2 text-sm text-muted">{PROFILE_COPY.editHint}</p>

      <div ref={noticeRef} tabIndex={-1} className="flex min-h-11 flex-wrap items-center gap-x-3 focus:outline-none">
        <p role="status" className="font-semibold text-ink">{pending ? PROFILE_COPY.savingEdit : notice && "line" in notice ? notice.line : ""}</p>
        {!pending && notice && "error" in notice && <p role="alert" className="font-semibold text-danger">{notice.error}</p>}
        {!pending && notice && "undo" in notice && notice.undo && (
          <Button variant="ghost" onClick={() => change(notice.undo!, false)}>{PROFILE_COPY.undo}</Button>
        )}
      </div>

      <dl className="flex flex-col gap-3">
        {groupTags(profile.tags).map(({ group, label, tags }) => (
          <div key={group} className="flex flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:gap-4">
            <dt className="shrink-0 text-sm font-bold text-muted sm:w-48 sm:pt-2">{label}</dt>
            <dd className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button key={tag} variant="secondary" aria-label={removeLabel(tag, mine.has(tag))} onClick={() => change({ kind: "remove", tag })}>
                  {tag}
                  {mine.has(tag) && <span className="text-sm font-semibold text-muted">{PROFILE_COPY.yours}</span>}
                  <span aria-hidden="true">×</span>
                </Button>
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
      <h2 id="profile-add" className="font-display text-xl font-semibold text-ink">{PROFILE_COPY.addHeading}</h2>
      <p className="text-sm text-muted">{PROFILE_COPY.addHint}</p>
      {groups.map(({ group, label, tags, open }) => (
        <details key={group} open={open} className="border-t border-hairline py-1">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-lg font-bold text-ink focus-visible:outline-3 focus-visible:outline-focus">
            {offeredCount(label, tags.length)}
          </summary>
          <div className="flex flex-wrap gap-2 pb-3 pt-1">
            {tags.map((tag) => (
              <Button key={tag} variant="secondary" aria-label={addLabel(tag)} onClick={() => onAdd(tag)}>
                <span aria-hidden="true">+</span>
                {tag}
              </Button>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}

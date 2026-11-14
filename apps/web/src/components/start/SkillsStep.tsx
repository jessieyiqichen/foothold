"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { addLabel, offeredCount, PROFILE_COPY } from "@/lib/profile/copy";
import { cleanResumeText } from "@/lib/profile/resumeText";
import { addTag, canAdd, effectiveTags, offProfileGroups, removeTag, type TagEdits } from "@/lib/profile/tagEdits";
import { resumeTags } from "@/lib/profile/tags";
import type { Profile, Result } from "@/lib/profile/types";
import { START_COPY } from "@/lib/start/copy";
import { skillChips } from "@/lib/start/steps";
import type { Draft } from "./ResumeStep";
import { StepHead } from "./StepHead";

const LINK_SUMMARY = "flex min-h-10 cursor-pointer items-center font-mono text-xs text-link underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

interface SkillsStepProps {
  draft: Draft;
  initialEdits: TagEdits;
  onSave: (draft: Draft, edits: TagEdits) => Promise<Result<Profile>>;
}

/** Step 2: the skills read from the resume, each a key that is on until tapped off; "Missing something?" opens the
 *  rest of the list by group; the text itself behind a link. "Looks right" saves the profile (text, skills, the
 *  person's adds and removes), and only a saved profile moves on. */
export function SkillsStep({ draft, initialEdits, onSave }: SkillsStepProps) {
  const found = useMemo(() => resumeTags(cleanResumeText(draft.text)), [draft.text]);
  const [edits, setEdits] = useState(initialEdits);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chips = skillChips(found, edits);
  const onProfile = effectiveTags(found, edits);

  function toggle(tag: string, on: boolean) {
    if (!on && !canAdd(found, edits)) return setError(PROFILE_COPY.tagsFull);
    setError(null);
    setEdits(on ? removeTag(found, edits, tag) : addTag(found, edits, tag));
  }

  async function confirm() {
    setSaving(true);
    setError(null);
    const result = await onSave(draft, edits);
    // On success the next step replaces this one
    if (!result.ok) {
      setSaving(false);
      setError(result.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHead title={START_COPY.skillsHeading} line={chips.length > 0 ? START_COPY.skillsLine : START_COPY.noSkills} shape="circle" color="off" tile="green" />
      <ul aria-label={START_COPY.skillsHeading} className="flex flex-wrap gap-x-1.5 gap-y-2.5">
        {chips.map(({ tag, on }) => (
          <li key={tag}><ToggleChip on={on} onClick={() => toggle(tag, on)}>{tag}</ToggleChip></li>
        ))}
      </ul>
      <MissingSkills onProfile={onProfile} onAdd={(tag) => toggle(tag, false)} />
      <details>
        <summary className={LINK_SUMMARY}>{START_COPY.textLink}</summary>
        <pre className="max-h-72 overflow-auto border-2 border-ink bg-surface p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-ink">{draft.text}</pre>
      </details>
      <div className="flex flex-col items-start gap-2">
        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <Button size="lg" onClick={confirm} disabled={saving}>{saving ? START_COPY.saving : START_COPY.looksRight}</Button>
      </div>
    </div>
  );
}

/** "Missing something?": every vocabulary skill not on the list yet, by group, each one tap to add. */
function MissingSkills({ onProfile, onAdd }: { onProfile: string[]; onAdd: (tag: string) => void }) {
  return (
    <details className="border-t-2 border-ink pt-3">
      <summary className={LINK_SUMMARY}>{START_COPY.missingLink}</summary>
      <p className="mb-2 font-mono text-xs leading-5 text-muted">{START_COPY.missingLine}</p>
      {offProfileGroups(onProfile).map(({ group, label, tags }) => (
        <details key={group} className="border-t border-hairline py-1">
          <summary className="flex min-h-10 cursor-pointer items-center font-mono text-xs text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">{offeredCount(label, tags.length)}</summary>
          <div className="flex flex-wrap gap-x-1.5 gap-y-2.5 pt-1 pb-3">
            {tags.map((tag) => <ToggleChip key={tag} on={false} aria-label={addLabel(tag)} onClick={() => onAdd(tag)}>{tag}</ToggleChip>)}
          </div>
        </details>
      ))}
    </details>
  );
}

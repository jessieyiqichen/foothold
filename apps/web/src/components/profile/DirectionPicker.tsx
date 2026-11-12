"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { PROFILE_COPY } from "@/lib/profile/copy";
import { sameChoice, suggestFamilies, toggleFamily } from "@/lib/profile/directions";
import { FAMILIES, type Family } from "@/lib/profile/roles";
import type { Profile, Result } from "@/lib/profile/types";

interface DirectionPickerProps {
  profile: Profile;
  onSave: (families: Family[]) => Promise<Result<Profile>>;
}

type Notice = { line: string } | { error: string } | null;

/** The picks on screen: what is saved, or a suggestion while nothing is, or what the person has changed since.
 *  Nothing reaches the database until they press the button. */
function useDirectionDraft({ profile, onSave }: DirectionPickerProps) {
  const suggestion = useMemo(() => suggestFamilies(profile.tags), [profile.tags]);
  // Null until the person touches a choice
  const [draft, setDraft] = useState<Family[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const suggesting = draft === null && profile.families.length === 0 && suggestion.length > 0;
  const picked = draft ?? (suggesting ? suggestion : profile.families);

  function toggle(family: Family) {
    const result = toggleFamily(picked, family);
    if (result.ok) setDraft(result.value);
    setNotice(result.ok ? null : { error: result.message });
  }

  async function save() {
    setSaving(true);
    const result = await onSave(picked);
    setSaving(false);
    if (result.ok) setDraft(null);
    // "Changed in another tab" is said by the screen, which also reloads the profile
    if (result.ok) setNotice({ line: PROFILE_COPY.directionSaved });
    else setNotice(result.message === PROFILE_COPY.changedElsewhere ? null : { error: result.message });
  }

  return { picked, suggesting, unsaved: !sameChoice(picked, profile.families), saving, notice, toggle, save };
}

/** What is said under the choices, one line at a time: saving, a problem, a suggestion, unsaved, saved, or none. */
function statusOf({ picked, suggesting, unsaved, saving, notice }: ReturnType<typeof useDirectionDraft>): string {
  if (saving) return PROFILE_COPY.savingDirection;
  if (notice && "error" in notice) return "";
  if (suggesting) return PROFILE_COPY.suggested;
  if (unsaved) return PROFILE_COPY.directionUnsaved;
  if (notice) return notice.line;
  return picked.length === 0 ? PROFILE_COPY.nonePicked : "";
}

/** "What kind of work do you want?": up to three kinds, each a button that is on or off. The fourth pick is refused
 *  with a line saying why. The page never scrolls or moves focus on a pick. */
export function DirectionPicker(props: DirectionPickerProps) {
  const draft = useDirectionDraft(props);
  const { picked, suggesting, unsaved, saving, notice, toggle, save } = draft;

  return (
    <section aria-labelledby="profile-direction" className="flex flex-col gap-3">
      <h2 id="profile-direction" className="font-display text-xl font-semibold text-ink">{PROFILE_COPY.directionHeading}</h2>
      <p className="-mt-1 text-sm text-muted">{PROFILE_COPY.directionHint}</p>
      <div role="group" aria-labelledby="profile-direction" className="flex flex-wrap gap-2">
        {FAMILIES.map(({ id, label }) => (
          <ToggleChip key={id} on={picked.includes(id)} onClick={() => toggle(id)}>{label}</ToggleChip>
        ))}
      </div>
      {/* Always the same height, so a line coming or going never moves what is under it */}
      <div className="flex min-h-12 flex-col justify-center">
        <p role="status" className="font-semibold text-ink">{statusOf(draft)}</p>
        {!saving && notice && "error" in notice && <p role="alert" className="font-semibold text-danger">{notice.error}</p>}
      </div>
      <Button className="self-start" onClick={save} disabled={saving || !(unsaved || suggesting)}>
        {suggesting ? PROFILE_COPY.confirmDirection : PROFILE_COPY.saveDirection}
      </Button>
    </section>
  );
}

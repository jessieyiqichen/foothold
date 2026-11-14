"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PaperDialog } from "@/components/ui/PaperDialog";
import { PROFILE_COPY, savedLine } from "@/lib/profile/copy";
import type { Family } from "@/lib/profile/roles";
import type { Profile, Result } from "@/lib/profile/types";
import type { TagEdits } from "@/lib/profile/tagEdits";
import { DirectionPicker } from "./DirectionPicker";
import { TagEditor } from "./TagEditor";

interface SavedProfileProps {
  profile: Profile;
  onEdit: (edits: TagEdits) => Promise<Result<Profile>>;
  onFamilies: (families: Family[]) => Promise<Result<Profile>>;
  onReplace: () => void;
  onDelete: () => Promise<Result<null>>;
}

/** A saved profile: when it was saved, its skills, and the two things to do with it. Deleting removes everything at
 *  once, so it asks first (design rules: Confirm for deleting everything, Undo only for one item). */
export function SavedProfile({ profile, onEdit, onFamilies, onReplace, onDelete }: SavedProfileProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const result = await onDelete();
    // On success the screen swaps to the empty profile and this dialog is gone with it
    if (!result.ok) {
      setDeleting(false);
      setError(result.message);
    }
  }

  function close() {
    if (deleting) return;
    setConfirming(false);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs tabular-nums text-muted">{savedLine(profile.updatedAt, profile.resumeName)}</p>
      <div className="border-t-2 border-ink pt-5">
        <DirectionPicker profile={profile} onSave={onFamilies} />
      </div>
      <div className="border-t-2 border-ink pt-5">
        <TagEditor profile={profile} onEdit={onEdit} />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t-2 border-ink pt-5">
        <Button variant="secondary" onClick={onReplace}>{PROFILE_COPY.replace}</Button>
        <Button variant="danger" onClick={() => setConfirming(true)}>{PROFILE_COPY.delete}</Button>
      </div>

      <PaperDialog open={confirming} title={PROFILE_COPY.confirmTitle} closeLabel={PROFILE_COPY.keep} onClose={close}>
        <div className="flex flex-col gap-4">
          <p>{PROFILE_COPY.confirmBody}</p>
          {error && <p role="alert" className="font-bold text-danger">{error}</p>}
          <Button variant="danger" onClick={confirmDelete} disabled={deleting} className="self-start">
            {deleting ? PROFILE_COPY.deleting : PROFILE_COPY.confirmDelete}
          </Button>
        </div>
      </PaperDialog>
    </div>
  );
}

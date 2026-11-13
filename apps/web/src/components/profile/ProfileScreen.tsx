"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PROFILE_COPY } from "@/lib/profile/copy";
import type { Family } from "@/lib/profile/roles";
import type { TagEdits } from "@/lib/profile/tagEdits";
import type { Profile, Result } from "@/lib/profile/types";
import { ResumeEditor } from "./ResumeEditor";
import { SavedProfile } from "./SavedProfile";
import { useProfile } from "./useProfile";

/** What the screen does with a profile, and the one line saying what just happened. */
function useProfileActions() {
  const { state, retry, save, saveEdits, pickFamilies, remove } = useProfile();
  const [replacing, setReplacing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveDraft(draft: { text: string; name: string | null }): Promise<Result<Profile>> {
    const result = await save(draft);
    if (result.ok) {
      setReplacing(false);
      setNotice(PROFILE_COPY.saved);
    }
    return result;
  }

  async function deleteResume(): Promise<Result<null>> {
    const result = await remove();
    if (result.ok) setNotice(PROFILE_COPY.deleted);
    return result;
  }

  /** A change refused because the profile changed in another tab is said here: the section may be gone by then. */
  async function said(result: Promise<Result<Profile>>): Promise<Result<Profile>> {
    const answer = await result;
    setNotice(!answer.ok && answer.message === PROFILE_COPY.changedElsewhere ? answer.message : null);
    return answer;
  }
  const editTags = (edits: TagEdits) => said(saveEdits(edits));
  const chooseFamilies = (families: Family[]) => said(pickFamilies(families));

  function setReplacingTo(on: boolean) {
    if (on) setNotice(null);
    setReplacing(on);
  }

  return { state, retry, replacing, notice, saveDraft, deleteResume, editTags, chooseFamilies, setReplacingTo };
}

/** The profile page: loading, couldn't load, no resume yet (the editor), a saved profile, or replacing it (the editor
 *  again, starting from what is saved). */
export function ProfileScreen() {
  const { state, retry, replacing, notice, saveDraft, deleteResume, editTags, chooseFamilies, setReplacingTo } = useProfileActions();

  return (
    <div className="flex w-full flex-col gap-6 lg:max-w-3xl">
      <PageHeader title={PROFILE_COPY.title} intro={PROFILE_COPY.intro} back={null} />
      <p role="status" className={notice ? "font-semibold text-ink" : "sr-only"}>{notice ?? ""}</p>

      {state.kind === "loading" && <p className="text-muted">{PROFILE_COPY.loading}</p>}
      {state.kind === "failed" && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="font-semibold text-danger">{state.message}</p>
          <Button variant="secondary" onClick={retry}>{PROFILE_COPY.tryAgain}</Button>
        </div>
      )}
      {state.kind === "ready" && (state.profile === null || replacing ? (
        <ResumeEditor initial={state.profile} onSave={saveDraft} onCancel={state.profile ? () => setReplacingTo(false) : undefined} />
      ) : (
        <SavedProfile profile={state.profile} onEdit={editTags} onFamilies={chooseFamilies} onReplace={() => setReplacingTo(true)} onDelete={deleteResume} />
      ))}
    </div>
  );
}

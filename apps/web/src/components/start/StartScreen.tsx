"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/components/profile/useProfile";
import { HOME_PATH } from "@/lib/auth/routes";
import { toggleFamily, toggleLevel } from "@/lib/profile/directions";
import { FAMILIES, LEVELS, type Family, type Level } from "@/lib/profile/roles";
import { editsOf, NO_EDITS, type TagEdits } from "@/lib/profile/tagEdits";
import { ok, type Profile, type Result } from "@/lib/profile/types";
import type { Step } from "@/lib/start/constants";
import { START_COPY, stepLine } from "@/lib/start/copy";
import { loadMark, storeMark } from "@/lib/start/mark";
import { checkFamilies, familiesDraft, levelsDraft, markAfter, resumeStep, type Mark } from "@/lib/start/steps";
import { ChoiceStep } from "./ChoiceStep";
import { FoundStep } from "./FoundStep";
import { ResumeStep, type Draft } from "./ResumeStep";
import { SkillsStep } from "./SkillsStep";
import { StepHead } from "./StepHead";

/** The steps' saves: each keeps the browser's mark of the step just saved, then moves on. */
function useStepSaves(go: (step: Step) => void) {
  const profile = useProfile();
  const { userId, save, pickFamilies, filterLevels } = profile;
  const after = (mark: Mark["step"], next: Step) => (result: Result<Profile>) => {
    if (result.ok && userId) storeMark(userId, markAfter(mark, result.value));
    if (result.ok) go(next);
    return result;
  };
  return {
    ...profile,
    saveSkills: (draft: Draft, edits: TagEdits) => save(draft, edits).then(after("skills", 3)),
    saveFamilies: (families: Family[]) => pickFamilies(families).then(after("directions", 4)),
    saveLevels: (levels: Level[]) => filterLevels(levels).then(after("levels", 5)),
  };
}

/** The first visit (`/start`): five steps, one question a screen, each saved before the next. It picks up where the
 *  person left off (lib/start/steps.ts); anyone with nothing left to answer goes to their matches. Moving to another
 *  step starts at the top of the page, with focus on the new heading; nothing else moves the page. */
export function StartScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step | "done" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const go = (next: Step) => setStep(next);
  const { state, userId, retry, withDb, saveSkills, saveFamilies, saveLevels } = useStepSaves(go);

  // Where to pick up, worked out once, when the profile has loaded (adjusted while rendering, as React recommends)
  if (step === null && state.kind === "ready" && userId) setStep(resumeStep(state.profile, loadMark(userId)));
  useEffect(() => {
    if (step === "done") router.replace(HOME_PATH);
    else if (step !== null) window.scrollTo({ top: 0 });
  }, [step, router]);

  if (state.kind === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="font-bold text-danger">{state.message}</p>
        <Button variant="secondary" onClick={retry}>{START_COPY.tryAgain}</Button>
      </div>
    );
  }
  if (state.kind !== "ready" || step === null || step === "done") return <p className="font-mono text-xs text-muted">{START_COPY.loading}</p>;

  const profile = state.profile;
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex min-h-10 items-center justify-between gap-4">
        <p className="font-mono text-xs text-ink tabular-nums">{stepLine(step)}</p>
        {step > 1 && <Button variant="ghost" onClick={() => go((step - 1) as Step)}>{START_COPY.back}</Button>}
      </div>
      <div key={step}>
        {step === 1 && <ResumeStep onRead={(read) => { setDraft(read); go(2); }} />}
        {step === 2 && <SkillsStep draft={draft ?? { text: profile?.resumeText ?? "", name: profile?.resumeName ?? null }} initialEdits={profile ? editsOf(profile) : NO_EDITS} onSave={saveSkills} />}
        {step === 3 && profile && <DirectionsStep profile={profile} onSave={saveFamilies} />}
        {step === 4 && profile && <LevelsStep profile={profile} onSave={saveLevels} />}
        {step === 5 && <FoundStep withDb={withDb} onWiden={() => go(3)} />}
      </div>
    </div>
  );
}

function DirectionsStep({ profile, onSave }: { profile: Profile; onSave: (families: Family[]) => Promise<Result<Profile>> }) {
  const { families, suggested } = familiesDraft(profile);
  return (
    <ChoiceStep<Family>
      head={<StepHead title={START_COPY.directionsHeading} line={START_COPY.directionsLine} shape="quarter" color="red" tile="mustard" />}
      options={FAMILIES}
      initial={families}
      suggestion={suggested ? START_COPY.suggestedFamilies : null}
      toggle={toggleFamily}
      check={checkFamilies}
      onSave={onSave}
    />
  );
}

function LevelsStep({ profile, onSave }: { profile: Profile; onSave: (levels: Level[]) => Promise<Result<Profile>> }) {
  const { levels, suggested } = levelsDraft(profile);
  return (
    <ChoiceStep<Level>
      head={<StepHead title={START_COPY.levelsHeading} shape="triangle" color="off" tile="cobalt" />}
      options={LEVELS}
      initial={levels}
      suggestion={suggested ? START_COPY.suggestedLevels : null}
      note={START_COPY.levelsNote}
      toggle={(picked, id) => ok(toggleLevel(picked, id))}
      check={() => null}
      onSave={onSave}
    />
  );
}

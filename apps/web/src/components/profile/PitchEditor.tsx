"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { PaperDialog } from "@/components/ui/PaperDialog";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasConsent, rememberConsent } from "@/lib/connector/consent";
import { CONSENT_LINES, DRAFT_COPY } from "@/lib/connector/copy";
import { requestPitch } from "@/lib/pitch/client";
import { PITCH_MAX } from "@/lib/profile/constants";
import { PROFILE_COPY } from "@/lib/profile/copy";
import type { Profile, Result } from "@/lib/profile/types";

/** The person's one line about themself (the drafts' harness, user 2026-11-21): every draft opens from it. "Suggest
 *  from my resume" fills the box with a first version for them to change; nothing is kept until they press Save.
 *  The suggestion sends their experience to Gemini, so it asks first, as a draft does. */
export function PitchEditor({ profile, userId, onSave }: { profile: Profile; userId: string | null; onSave: (pitch: string) => Promise<Result<Profile>> }) {
  const [text, setText] = useState(profile.pitch ?? "");
  const [busy, setBusy] = useState<"suggest" | "save" | null>(null);
  const [line, setLine] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const changed = text.trim() !== (profile.pitch ?? "");

  async function suggest() {
    setAsking(false);
    setBusy("suggest");
    setLine(null);
    const result = await requestPitch();
    setBusy(null);
    if (!result.ok) return setLine({ ok: false, text: result.message });
    setText(result.value);
    // A suggestion is not checked against the resume: the person reads it before it opens every message (review)
    setLine({ ok: true, text: PROFILE_COPY.pitchCheck });
  }
  const start = () => (hasConsent(userId) ? void suggest() : setAsking(true));
  async function save() {
    setBusy("save");
    setLine(null);
    const result = await onSave(text);
    setBusy(null);
    setLine(result.ok ? { ok: true, text: PROFILE_COPY.pitchSaved } : { ok: false, text: result.message });
  }

  return (
    <section aria-labelledby="pitch-title" className="flex flex-col gap-3">
      <SectionHeading id="pitch-title">{PROFILE_COPY.pitchTitle}</SectionHeading>
      <p className="font-mono text-xs leading-5 text-muted">{PROFILE_COPY.pitchIntro}</p>
      <label htmlFor="pitch" className="sr-only">{PROFILE_COPY.pitchLabel}</label>
      <TextArea id="pitch" rows={3} maxLength={PITCH_MAX} value={text} placeholder={PROFILE_COPY.pitchPlaceholder} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy !== null || !changed}>{PROFILE_COPY.pitchSave}</Button>
        <Button variant="secondary" onClick={start} disabled={busy !== null}>{busy === "suggest" ? PROFILE_COPY.pitchSuggesting : PROFILE_COPY.pitchSuggest}</Button>
        <span className="ml-auto font-mono text-[11px] text-muted tabular-nums">{text.length}/{PITCH_MAX}</span>
      </div>
      <p role={line && !line.ok ? "alert" : "status"} className={line ? `text-sm font-bold ${line.ok ? "text-ink" : "text-danger"}` : "sr-only"}>{line?.text ?? ""}</p>
      <PaperDialog open={asking} title={DRAFT_COPY.consentTitle} closeLabel={DRAFT_COPY.notNow} onClose={() => setAsking(false)}>
        <div className="flex flex-col items-start gap-4">
          <ul className="flex flex-col gap-2">{CONSENT_LINES.map((l) => <li key={l}>{l}</li>)}</ul>
          <Button onClick={() => { rememberConsent(userId); void suggest(); }}>{DRAFT_COPY.agree}</Button>
        </div>
      </PaperDialog>
    </section>
  );
}

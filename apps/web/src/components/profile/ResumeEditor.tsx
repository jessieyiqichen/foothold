"use client";

import { useDeferredValue, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { PDF_EXTENSION, PDF_MIME } from "@/lib/profile/constants";
import { charCountLine, PROFILE_COPY } from "@/lib/profile/copy";
import { extractPdfText } from "@/lib/profile/pdf";
import { checkPdfFile, checkResumeText, cleanResumeText } from "@/lib/profile/resumeText";
import { editsOf, effectiveTags } from "@/lib/profile/tagEdits";
import { resumeTags } from "@/lib/profile/tags";
import { fail, type Profile, type Result } from "@/lib/profile/types";
import { TagGroups } from "./TagGroups";

type Draft = { text: string; name: string | null };
type Save = (draft: Draft) => Promise<Result<Profile>>;

interface ResumeEditorProps {
  /** The saved profile when replacing it; null for a first resume. */
  initial: Profile | null;
  onSave: Save;
  /** Shown only when there is a saved profile to go back to. */
  onCancel?: () => void;
}

const FILE_INPUT =
  "block w-full cursor-pointer rounded-xl border-2 border-line bg-surface p-2 font-semibold text-ink " +
  "file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-wash file:px-4 file:font-display file:font-semibold file:text-ink " +
  "hover:file:bg-wash-strong focus-visible:border-ink focus-visible:outline-3 focus-visible:outline-focus aria-invalid:border-danger";

/** Reads the chosen file here in the browser. Nothing is sent anywhere: the result is only put in the text box. */
async function readPdf(file: File): Promise<Result<string>> {
  const problem = checkPdfFile(file);
  if (problem) return fail(problem);
  try {
    return await extractPdfText(await file.arrayBuffer());
  } catch (cause) {
    console.error("Foothold: the chosen file could not be opened", cause);
    return fail(PROFILE_COPY.unreadable);
  }
}

/** The draft being edited: its text, the file it came from, what is in progress, and one error per place it shows. */
function useResumeDraft(initial: Profile | null, onSave: Save) {
  const [draft, setDraft] = useState<Draft>({ text: initial?.resumeText ?? "", name: initial?.resumeName ?? null });
  const [busy, setBusy] = useState<"reading" | "saving" | null>(null);
  const [errors, setErrors] = useState<{ file?: string; text?: string; save?: string }>({});

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("reading");
    setErrors({});
    const result = await readPdf(file);
    setBusy(null);
    if (result.ok) setDraft({ text: result.value, name: file.name });
    else setErrors({ file: result.message });
  }

  function editText(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    // Emptied and typed afresh, the text no longer comes from the file
    setDraft((before) => ({ text, name: text.trim() === "" ? null : before.name }));
    setErrors((before) => ({ file: before.file }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = checkResumeText(draft.text, "typed");
    if (problem) return setErrors((before) => ({ file: before.file, text: problem }));
    setBusy("saving");
    setErrors({});
    const result = await onSave(draft);
    // On success the screen swaps to the saved profile and this form is gone
    if (!result.ok) {
      setBusy(null);
      setErrors({ save: result.message });
    }
  }

  return { text: draft.text, busy, errors, chooseFile, editText, submit };
}

/** Choose a PDF or paste text, check what was read, see the skills found, save. One column, one primary action. */
export function ResumeEditor({ initial, onSave, onCancel }: ResumeEditorProps) {
  const { text, busy, errors, chooseFile, editText, submit } = useResumeDraft(initial, onSave);
  // Tagging runs after typing settles, so a long resume never makes the keys lag
  const settled = useDeferredValue(text);
  const cleaned = useMemo(() => cleanResumeText(settled), [settled]);
  // When replacing, the skills the person added or took off before are laid over what the new text yields
  const tags = useMemo(() => effectiveTags(resumeTags(cleaned), editsOf(initial)), [cleaned, initial]);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Field id="resume-file" label={PROFILE_COPY.fileLabel} hint={PROFILE_COPY.fileHint} error={errors.file}>
        {(control) => (
          <input {...control} type="file" accept={`${PDF_MIME},${PDF_EXTENSION}`} onChange={chooseFile} disabled={busy !== null} className={FILE_INPUT} />
        )}
      </Field>
      <p role="status" className="-mt-4 min-h-6 text-sm font-semibold text-muted">{busy === "reading" ? PROFILE_COPY.reading : ""}</p>

      <Field id="resume-text" label={PROFILE_COPY.textLabel} hint={PROFILE_COPY.textHint} error={errors.text}>
        {(control) => (
          <TextArea {...control} value={text} onChange={editText} rows={14} spellCheck={false} disabled={busy === "reading"} className="min-h-72 resize-y" />
        )}
      </Field>
      <p className="-mt-4 text-sm text-muted">{charCountLine(cleaned.length)}</p>

      <TagGroups tags={tags} heading={PROFILE_COPY.tagsHeading} />
      <p className="-mt-3 text-sm text-muted">{PROFILE_COPY.tagsNote}</p>

      <div className="flex flex-col gap-3 border-t border-hairline pt-5">
        {errors.save && <p role="alert" className="font-semibold text-danger">{errors.save}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={busy !== null}>{busy === "saving" ? PROFILE_COPY.saving : PROFILE_COPY.save}</Button>
          {onCancel && <Button variant="ghost" onClick={onCancel} disabled={busy === "saving"}>{PROFILE_COPY.cancel}</Button>}
        </div>
        <p className="text-sm text-muted">{PROFILE_COPY.storedNote}</p>
      </div>
    </form>
  );
}

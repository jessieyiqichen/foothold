"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { PDF_EXTENSION, PDF_MIME } from "@/lib/profile/constants";
import { readPdfFile } from "@/lib/profile/pdf";
import { checkPdfFile, checkResumeText, cleanResumeText } from "@/lib/profile/resumeText";
import { START_COPY } from "@/lib/start/copy";
import { StepHead } from "./StepHead";

export type Draft = { text: string; name: string | null };

/** What step 1 holds: a chosen PDF, or pasted text, and the line to show when either cannot be used. */
function useResumeRead(onRead: (draft: Draft) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(chosen: File | undefined) {
    if (!chosen) return;
    const problem = checkPdfFile(chosen);
    setError(problem);
    setFile(problem ? null : chosen);
  }

  async function read() {
    if (pasting) {
      const problem = checkResumeText(text, "typed");
      return problem ? setError(problem) : onRead({ text: cleanResumeText(text), name: null });
    }
    if (!file) return setError(START_COPY.noFile);
    setReading(true);
    const result = await readPdfFile(file);
    setReading(false);
    if (result.ok) onRead({ text: result.value, name: file.name });
    else setError(result.message);
  }

  const type = (value: string) => { setText(value); setError(null); };
  const switchMode = () => { setPasting(!pasting); setError(null); };
  return { file, pasting, text, reading, error, choose, read, type, switchMode };
}

/** Step 1: drop a PDF (read here in the browser, never uploaded) or paste the text. "Read it" moves on with the text;
 *  nothing is saved until the skills are confirmed on step 2. */
export function ResumeStep({ onRead }: { onRead: (draft: Draft) => void }) {
  const { file, pasting, text, reading, error, choose, read, type, switchMode } = useResumeRead(onRead);
  const [dragging, setDragging] = useState(false);

  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHead title={START_COPY.resumeHeading} line={START_COPY.resumeLine} shape="square" color="cobalt" tile="off" />
      {pasting ? (
        <Field id="start-paste" label={START_COPY.pasteLabel} error={error ?? undefined}>
          {(control) => (
            <TextArea {...control} value={text} rows={12} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => type(event.target.value)} className="min-h-64 resize-y" />
          )}
        </Field>
      ) : (
        <DropZone file={file} dragging={dragging} error={error} onChoose={choose} onDrop={drop} onDragging={setDragging} />
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={read} disabled={reading}>{reading ? START_COPY.reading : START_COPY.readIt}</Button>
        <Button variant="ghost" onClick={switchMode}>
          {pasting ? START_COPY.pdfLink : START_COPY.pasteLink}
        </Button>
      </div>
    </div>
  );
}

interface DropZoneProps {
  file: File | null;
  dragging: boolean;
  error: string | null;
  onChoose: (file: File | undefined) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onDragging: (on: boolean) => void;
}

/** The drop zone is the file input's own label: a click, Enter or Space opens the picker, and a dropped file is
 *  checked like a chosen one. Straight and flat: it is a field, not a decoration. */
function DropZone({ file, dragging, error, onChoose, onDrop, onDragging }: DropZoneProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        onDragOver={(event) => { event.preventDefault(); onDragging(true); }}
        onDragLeave={() => onDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-ink px-4 py-8 text-center has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${dragging ? "bg-wash" : "bg-surface hover:bg-wash"}`}
      >
        <input type="file" accept={`${PDF_MIME},${PDF_EXTENSION}`} aria-invalid={error ? true : undefined} aria-describedby="start-drop-note" onChange={(event) => onChoose(event.target.files?.[0])} className="sr-only" />
        <span className="text-lg font-bold break-all text-ink">{file ? file.name : START_COPY.dropLabel}</span>
        <span id="start-drop-note" className="font-mono text-xs text-muted">{file ? START_COPY.chosen : START_COPY.dropHint}</span>
      </label>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}

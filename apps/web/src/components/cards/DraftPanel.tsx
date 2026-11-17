"use client";

import { useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { PaperDialog } from "@/components/ui/PaperDialog";
import { draftText, isEdited } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import { canWrite, type Shown } from "@/lib/connector/draftView";
import type { Draft } from "@/lib/connector/types";
import { Part } from "./CardParts";
import { useDraft } from "./useDraft";

/** The draft on a card: "Write a draft" until there is one, then the subject and message to edit, Copy and Write
 *  again, and the two quoted lines it rests on. Write again asks first when the person has changed the draft, since a
 *  new one replaces their changes; while it is written, and if it is refused, their text stays. A saved draft that
 *  couldn't load says so. Foothold never sends anything; the line under it says so. */
export function DraftPanel({ companyId, withDb }: { companyId: number; withDb: WithDb }) {
  const { view, write, edit } = useDraft(companyId, withDb);
  const { draft, shown, writing, error, unsaved, loaded, loadFailed } = view;
  const id = `draft-${companyId}`;
  const [asking, setAsking] = useState(false);

  const again = () => (draft && shown && isEdited(draft, shown) ? setAsking(true) : void write());
  return (
    <Part id={id} title={DRAFT_COPY.heading}>
      {draft && shown && <DraftEditor draft={draft} shown={shown} onChange={edit} id={id} />}
      {loadFailed && <p role="alert" className="text-sm font-bold text-danger">{DRAFT_COPY.loadFailed}</p>}
      <p role="status" className="font-mono text-xs text-ink">{writing ? DRAFT_COPY.writing : ""}</p>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      {unsaved && draft && <p role="alert" className="text-sm font-bold text-danger">{DRAFT_COPY.notKept}</p>}
      {loaded && (
        <Button variant={draft ? "ghost" : "secondary"} className="self-start" onClick={again} disabled={!canWrite(view)}>
          {draft ? DRAFT_COPY.again : DRAFT_COPY.write}
        </Button>
      )}
      <p className="font-mono text-[11px] leading-4 text-muted">{DRAFT_COPY.neverSends}</p>
      <PaperDialog open={asking} title={DRAFT_COPY.replaceTitle} closeLabel={DRAFT_COPY.keepEdits} onClose={() => setAsking(false)}>
        <div className="flex flex-col items-start gap-4">
          <p>{DRAFT_COPY.replaceBody}</p>
          <Button onClick={() => { setAsking(false); void write(); }}>{DRAFT_COPY.replace}</Button>
        </div>
      </PaperDialog>
    </Part>
  );
}

interface DraftEditorProps {
  draft: Draft;
  shown: Shown;
  onChange: (text: Shown) => void;
  id: string;
}

/** The draft as text the person edits and copies, with the two lines it rests on. Edits stay on the page. */
function DraftEditor({ draft, shown, onChange, id }: DraftEditorProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draftText(shown));
      setCopied(DRAFT_COPY.copied);
    } catch (cause) {
      console.error("Foothold drafts: the clipboard refused", cause);
      setCopied(DRAFT_COPY.copyFailed);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field id={`${id}-subject`} label={DRAFT_COPY.subject}>
        {(control) => <TextInput {...control} value={shown.subject} onChange={(event) => onChange({ ...shown, subject: event.target.value })} />}
      </Field>
      <Field id={`${id}-body`} label={DRAFT_COPY.body}>
        {(control) => <TextArea {...control} value={shown.body} rows={9} onChange={(event) => onChange({ ...shown, body: event.target.value })} className="resize-y" />}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={copy}>{DRAFT_COPY.copy}</Button>
        <p role="status" className="font-mono text-xs text-ink">{copied ?? ""}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs text-muted">{DRAFT_COPY.basedOn}</p>
        <dl className="flex flex-col gap-2">
          <Quote label={DRAFT_COPY.fromResume} text={draft.resumeQuote} />
          <Quote label={DRAFT_COPY.fromCompany} text={draft.companyQuote} />
        </dl>
      </div>
    </div>
  );
}

function Quote({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-4 border-tile-mustard bg-surface py-1 pl-3">
      <dt className="font-mono text-[11px] text-muted">{label}</dt>
      <dd><q className="text-[15px] text-ink">{text}</q></dd>
    </div>
  );
}

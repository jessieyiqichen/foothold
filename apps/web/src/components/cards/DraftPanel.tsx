"use client";

import { useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { PaperDialog } from "@/components/ui/PaperDialog";
import { draftText, isEdited } from "@/lib/connector/client";
import { hasConsent, rememberConsent } from "@/lib/connector/consent";
import { CONSENT_LINES, DRAFT_COPY } from "@/lib/connector/copy";
import { canWrite, type Shown } from "@/lib/connector/draftView";
import { Part } from "./CardParts";
import { useDraft } from "./useDraft";

/** The draft on a card: "Write a draft" until there is one, then the subject and message to edit, Copy and Write
 *  again. The two lines it rests on are checked before it is shown, not shown again (user, 2026-11-17). Write again asks first when the person has changed the draft, since a
 *  new one replaces their changes; while it is written, and if it is refused, their text stays. A saved draft that
 *  couldn't load says so. Before a person's first draft, a dialog says what is sent to Google Gemini and asks them to
 *  agree; a line under the button always says it. Foothold never sends anything; the line under it says so. */
export function DraftPanel({ companyId, userId, withDb, roleId = null, note }: { companyId: number; userId: string | null; withDb: WithDb; roleId?: number | null; note?: string }) {
  const { view, write, edit } = useDraft(companyId, withDb, roleId);
  const { draft, shown, writing, error, unsaved, loaded, loadFailed } = view;
  const id = `draft-${companyId}`;
  const [asking, setAsking] = useState<"replace" | "consent" | null>(null);

  // Asked at the moment of the click: the agreement lives in this browser's storage, read only here
  const start = () => (hasConsent(userId) ? void write() : setAsking("consent"));
  const again = () => (draft && shown && isEdited(draft, shown) ? setAsking("replace") : start());
  const agree = () => {
    rememberConsent(userId);
    setAsking(null);
    void write();
  };
  return (
    <Part id={id} title={DRAFT_COPY.heading}>
      {note && <p className="font-mono text-xs text-muted">{note}</p>}
      {draft && shown && <DraftEditor shown={shown} onChange={edit} id={id} />}
      {loadFailed && <p role="alert" className="text-sm font-bold text-danger">{DRAFT_COPY.loadFailed}</p>}
      <p role="status" className="font-mono text-xs text-ink">{writing ? DRAFT_COPY.writing : ""}</p>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      {unsaved && draft && <p role="alert" className="text-sm font-bold text-danger">{DRAFT_COPY.notKept}</p>}
      {loaded && (
        <Button variant={draft ? "ghost" : "secondary"} className="self-start" onClick={again} disabled={!canWrite(view)}>
          {draft ? DRAFT_COPY.again : DRAFT_COPY.write}
        </Button>
      )}
      <p className="font-mono text-[11px] leading-4 text-muted">{DRAFT_COPY.sendsLine}</p>
      <p className="font-mono text-[11px] leading-4 text-muted">{DRAFT_COPY.neverSends}</p>
      <PaperDialog open={asking === "replace"} title={DRAFT_COPY.replaceTitle} closeLabel={DRAFT_COPY.keepEdits} onClose={() => setAsking(null)}>
        <div className="flex flex-col items-start gap-4">
          <p>{DRAFT_COPY.replaceBody}</p>
          <Button onClick={() => { setAsking(null); start(); }}>{DRAFT_COPY.replace}</Button>
        </div>
      </PaperDialog>
      {/* Escape and the close key are "Not now": nothing is sent, nothing is kept */}
      <PaperDialog open={asking === "consent"} title={DRAFT_COPY.consentTitle} closeLabel={DRAFT_COPY.notNow} onClose={() => setAsking(null)}>
        <div className="flex flex-col items-start gap-4">
          <ul className="flex flex-col gap-2">{CONSENT_LINES.map((line) => <li key={line}>{line}</li>)}</ul>
          <Button onClick={agree}>{DRAFT_COPY.agree}</Button>
        </div>
      </PaperDialog>
    </Part>
  );
}

interface DraftEditorProps {
  shown: Shown;
  onChange: (text: Shown) => void;
  id: string;
}

/** The draft as text the person edits and copies. Edits stay on the page. */
function DraftEditor({ shown, onChange, id }: DraftEditorProps) {
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
    </div>
  );
}

"use client";

import { useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { draftText } from "@/lib/connector/client";
import { DRAFT_COPY } from "@/lib/connector/copy";
import type { Draft } from "@/lib/connector/types";
import { Part } from "./CardParts";
import { useDraft } from "./useDraft";

/** The draft on a card: "Write a draft" until there is one, then the subject and message to edit, Copy and Write
 *  again, and the two quoted lines it rests on. Foothold never sends anything; the line under it says so. */
export function DraftPanel({ companyId, withDb }: { companyId: number; withDb: WithDb }) {
  const { state, error, write } = useDraft(companyId, withDb);
  const id = `draft-${companyId}`;
  const draft = state.kind === "ready" ? state.draft : null;
  return (
    <Part id={id} title={DRAFT_COPY.heading}>
      {/* The new draft replaces the editor and its edits; keyed so the fields start from it */}
      {draft && <DraftEditor key={`${draft.subject}|${draft.body}`} draft={draft} id={id} />}
      <p role="status" className="font-mono text-xs text-ink">{state.kind === "writing" ? DRAFT_COPY.writing : ""}</p>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
      {state.kind !== "loading" && (
        <Button variant={draft ? "ghost" : "secondary"} className="self-start" onClick={write} disabled={state.kind === "writing"}>
          {draft ? DRAFT_COPY.again : DRAFT_COPY.write}
        </Button>
      )}
      <p className="font-mono text-[11px] leading-4 text-muted">{DRAFT_COPY.neverSends}</p>
    </Part>
  );
}

/** The draft as text the person edits and copies, with the two lines it rests on. Edits stay on the page. */
function DraftEditor({ draft, id }: { draft: Draft; id: string }) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draftText({ subject, body }));
      setCopied(DRAFT_COPY.copied);
    } catch (cause) {
      console.error("Foothold drafts: the clipboard refused", cause);
      setCopied(DRAFT_COPY.copyFailed);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field id={`${id}-subject`} label={DRAFT_COPY.subject}>
        {(control) => <TextInput {...control} value={subject} onChange={(event) => setSubject(event.target.value)} />}
      </Field>
      <Field id={`${id}-body`} label={DRAFT_COPY.body}>
        {(control) => <TextArea {...control} value={body} rows={9} onChange={(event) => setBody(event.target.value)} className="resize-y" />}
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

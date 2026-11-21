"use client";

import { useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clearEdits, loadEdits, type KeptEdit } from "@/lib/connector/edits";
import { PROFILE_COPY } from "@/lib/profile/copy";

type State = { kind: "loading" } | { kind: "failed"; message: string } | { kind: "ready"; edits: KeptEdit[] };

/** The edits Foothold kept from the person's drafts (the drafts' harness, user 2026-11-21): what was written and what
 *  they changed it to, the five newest, with Clear. Only they can read these. */
export function MemoryPanel({ userId, withDb }: { userId: string | null; withDb: WithDb }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    withDb(PROFILE_COPY.memoryFailed, (db) => loadEdits(db, userId)).then((r) => {
      if (live) setState(r.ok ? { kind: "ready", edits: r.value } : { kind: "failed", message: r.message });
    });
    return () => {
      live = false;
    };
  }, [userId, withDb]);

  async function clear() {
    if (!userId) return;
    setError(null);
    const r = await withDb(PROFILE_COPY.memoryClearFailed, (db) => clearEdits(db, userId));
    if (!r.ok) return setError(r.message);
    setState({ kind: "ready", edits: [] });
    setCleared(true);
  }

  return (
    <section aria-labelledby="memory-title" className="flex flex-col gap-3">
      <SectionHeading id="memory-title">{PROFILE_COPY.memoryTitle}</SectionHeading>
      <p className="font-mono text-xs leading-5 text-muted">{PROFILE_COPY.memoryIntro}</p>
      {state.kind === "failed" && <p role="alert" className="text-sm font-bold text-danger">{state.message}</p>}
      {state.kind === "ready" && state.edits.length === 0 && <p className="font-mono text-xs text-ink">{cleared ? PROFILE_COPY.memoryCleared : PROFILE_COPY.memoryEmpty}</p>}
      {state.kind === "ready" && state.edits.length > 0 && (
        <>
          <ol className="flex flex-col gap-3">
            {state.edits.map((e) => (
              <li key={e.id} className="grid gap-2 border-2 border-hairline p-3 text-sm sm:grid-cols-2">
                <div><p className="font-mono text-[11px] text-muted">{PROFILE_COPY.memoryBefore}</p><p className="whitespace-pre-line text-ink">{e.before.body}</p></div>
                <div><p className="font-mono text-[11px] text-muted">{PROFILE_COPY.memoryAfter}</p><p className="whitespace-pre-line text-ink">{e.after.body}</p></div>
              </li>
            ))}
          </ol>
          <Button variant="ghost" className="self-start" onClick={clear}>{PROFILE_COPY.memoryClear}</Button>
        </>
      )}
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
    </section>
  );
}

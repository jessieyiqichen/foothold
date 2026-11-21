import { Button } from "@/components/ui/Button";
import type { Decision } from "@/lib/cards/constants";
import { COMPANY_COPY } from "@/lib/company/copy";

/** The person's decision on the company, under its name: Save and I reached out; once saved or reached out, the state
 *  shows as a tile with Remove to take it back. A skipped company can be saved again. */
export function CompanyActions({ decision, busy, error, onDecide }: { decision: Decision | null; busy: boolean; error: string | null; onDecide: (decision: Decision | null) => void }) {
  const kept = decision === "saved" || decision === "reached_out";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {kept && (
          <span className="bg-tile-mustard px-2 py-1 font-mono text-xs text-ink">
            {decision === "saved" ? COMPANY_COPY.saved : COMPANY_COPY.markedReached}
          </span>
        )}
        {!kept && <Button onClick={() => onDecide("saved")} disabled={busy}>{busy ? COMPANY_COPY.deciding : COMPANY_COPY.save}</Button>}
        {decision !== "reached_out" && <Button variant="secondary" onClick={() => onDecide("reached_out")} disabled={busy}>{COMPANY_COPY.reachedOut}</Button>}
        {kept && <Button variant="ghost" onClick={() => onDecide(null)} disabled={busy}>{COMPANY_COPY.remove}</Button>}
      </div>
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}

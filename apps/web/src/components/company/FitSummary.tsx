import type { CardRole } from "@/lib/cards/types";
import type { FitWarning } from "@/lib/company/fit";
import { reasonSentence, topTags } from "@/lib/company/fit";

/** The top of the action card, as the mockup (user, 2026-11-23): one short line of why, from the role's shared
 *  skills, rarest first; then at most one warning, the most serious. `warnings` come from fitWarnings, so the posting
 *  marks the same sentence when it is read in full. */
export function FitSummary({ role, companyShared, warnings }: { role: CardRole | null; companyShared: readonly string[]; warnings: readonly FitWarning[] }) {
  const shared = role ? topTags(role.shared, companyShared) : [...companyShared];
  const top = warnings[0];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-base leading-snug text-ink">{reasonSentence(shared)}</p>
      {top && <p className="text-sm leading-snug font-bold text-danger">{top.label}</p>}
    </div>
  );
}

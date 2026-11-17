import { ScreenHeading } from "@/components/ui/ScreenHeading";
import { Button } from "@/components/ui/Button";
import { CARDS_COPY } from "@/lib/cards/copy";
import type { Decision } from "@/lib/cards/constants";
import type { CompanyCard } from "@/lib/cards/types";
import type { WithDb } from "@/components/auth/useSessionDb";
import { ContactPart, DoingPart, RolesPart, WhyPart } from "./CardParts";
import { DraftPanel } from "./DraftPanel";

interface CompanyCardViewProps {
  card: CompanyCard;
  busy: boolean;
  error: string | null;
  onDecide: (decision: Decision) => void;
  withDb: WithDb;
}

/** One company card: one company, one person, one message (docs/architecture.md). A straight sheet with a hard
 *  shadow, read top to bottom, ending in the three decisions: Save is the one primary key. Its heading takes focus
 *  when it appears. */
export function CompanyCardView({ card, busy, error, onDecide, withDb }: CompanyCardViewProps) {
  const id = (part: string) => `card-${card.companyId}-${part}`;
  return (
    <article aria-labelledby="today-card" className="flex flex-col gap-4 border-2 border-ink bg-surface p-5 shadow-[6px_6px_0_var(--color-ink)] sm:p-7">
      <div className="flex flex-col gap-1.5">
        <ScreenHeading id="today-card" className="text-3xl leading-tight font-black tracking-[-0.03em] break-words text-ink">{card.name}</ScreenHeading>
        {card.oneLiner && <p className="text-base text-ink">{card.oneLiner}</p>}
      </div>
      <WhyPart card={card} id={id("why")} />
      <DoingPart card={card} id={id("doing")} />
      <RolesPart card={card} id={id("roles")} />
      <ContactPart card={card} id={id("contact")} />
      <DraftPanel companyId={card.companyId} withDb={withDb} />
      <div className="flex flex-col gap-2 border-t-2 border-ink pt-4">
        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => onDecide("saved")} disabled={busy}>{busy ? CARDS_COPY.deciding : CARDS_COPY.save}</Button>
          <Button size="lg" variant="secondary" onClick={() => onDecide("reached_out")} disabled={busy}>{CARDS_COPY.reachedOut}</Button>
          <Button variant="ghost" onClick={() => onDecide("skipped")} disabled={busy}>{CARDS_COPY.skip}</Button>
        </div>
      </div>
    </article>
  );
}

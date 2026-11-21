import Link from "next/link";
import type { ReactNode } from "react";
import { roleTitle } from "@/lib/cards/copy";
import { leadSentence } from "@/lib/cards/trim";
import type { CompanyCard } from "@/lib/cards/types";
import { companyHref } from "@/lib/company/constants";
import { levelLabel } from "@/lib/matches/copy";
import { LEVEL_TILE_CLASS } from "@/lib/matches/tiles";

/** Skills a short card shows. */
const SKILLS_ON_SHORT_CARD = 3;
const SKILL = "bg-wash px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink";

/** A company in one screen-width block (user, 2026-11-21): its name, which opens its page, one sentence, three shared
 *  skills and its best role; the keys go in `children`. Everything else is on the company page. */
export function ShortCard({ card, tag, children }: { card: CompanyCard; tag?: ReactNode; children: ReactNode }) {
  const best = card.roles[0] ?? null;
  const href = companyHref(card.companyId, best?.id ?? null);
  return (
    <li className="flex flex-col gap-2.5 border-2 border-ink bg-surface p-4 shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl leading-tight font-black tracking-[-0.02em] break-words">
          <Link href={href} className="text-ink underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">{card.name}</Link>
        </h2>
        {tag}
      </div>
      {card.oneLiner && <p className="text-[15px] leading-snug text-ink">{leadSentence(card.oneLiner).lead}</p>}
      {card.shared.length > 0 && (
        <ul aria-label="Why it fits you" className="flex flex-wrap gap-1.5">
          {card.shared.slice(0, SKILLS_ON_SHORT_CARD).map((skill) => <li key={skill} className={SKILL}>{skill}</li>)}
        </ul>
      )}
      {best && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <span className="font-bold break-words"><span aria-hidden="true" className="font-normal">▸ </span>{roleTitle(best)}</span>
          <span className={LEVEL_TILE_CLASS}>{levelLabel(best.level)}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div>
    </li>
  );
}

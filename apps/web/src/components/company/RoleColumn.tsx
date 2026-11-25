"use client";

import Link from "next/link";
import { useState } from "react";
import { OutLink } from "@/components/cards/CardParts";
import { Blurb } from "@/components/cards/Expandable";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { roleTitle } from "@/lib/cards/copy";
import type { CardRole, CompanyCard } from "@/lib/cards/types";
import { askBullets } from "@/lib/company/asks";
import { factRows } from "@/lib/company/facts";
import type { GlanceCell } from "@/lib/company/glance";
import { aboutCompanyLine, ROLE_PAGE_COPY } from "@/lib/company/pageCopy";
import { highlight } from "@/lib/company/posting";
import { roleChips, salaryHeadline, similarRolesHref } from "@/lib/company/roleHeader";
import { LineIcon } from "./Icons";
import type { PostingState } from "./usePosting";

const TOGGLE = "self-start font-mono text-xs text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
const LINK = "text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** The quiet tag on the Jobs rows: a wash tile, no edge. */
const CHIP = "bg-wash px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink";
const SECTION = "flex flex-col gap-3 border-t border-hairline pt-4";
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** The top of the left column (user, 2026-11-23): a small company line, the role's title, the pay in one line, then up
 *  to three quiet chips. With no open role, the company's name leads instead. */
export function RoleHeader({ card, role, location, titleId, postingLink = false }: { card: CompanyCard; role: CardRole | null; location: string | null; titleId: string; postingLink?: boolean }) {
  const pay = salaryHeadline(role?.signals);
  const chips = role ? roleChips(location, role.level) : [];
  return (
    <header className="flex flex-col gap-2">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted">
        {role && <span className="text-sm font-bold text-ink">{card.name}</span>}
        {card.website && <OutLink href={card.website}>{hostOf(card.website)} ↗</OutLink>}
        {postingLink && role && <OutLink href={role.url}>{ROLE_PAGE_COPY.original} ↗</OutLink>}
      </p>
      <h1 id={titleId} className="text-3xl leading-tight font-black tracking-[-0.03em] break-words text-ink sm:text-4xl">{role ? roleTitle(role) : card.name}</h1>
      {pay && <p className="text-lg font-bold text-ink">{pay}</p>}
      {chips.length > 0 && <ul className="flex flex-wrap gap-1.5">{chips.map((chip) => <li key={chip} className={CHIP}>{chip}</li>)}</ul>}
    </header>
  );
}

/** "At a glance": what the posting says (glanceCells), short words in two columns, no quotes. */
export function GlanceSection({ id, cells }: { id: string; cells: readonly GlanceCell[] }) {
  return (
    <section aria-labelledby={id} className={SECTION}>
      <SectionHeading id={id}>{ROLE_PAGE_COPY.atGlance}</SectionHeading>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
        {cells.map((cell) => <li key={cell.key} className="flex items-center gap-2 text-sm text-ink"><LineIcon name={cell.key} />{cell.label}</li>)}
      </ul>
    </section>
  );
}

/** "What they ask for": up to three one-line asks from the posting's requirements; then the full posting in place
 *  (the warning's sentence marked) and the original. Without a requirements section, only the two links. */
export function AsksSection({ id, role, state, quote, onRetry }: { id: string; role: CardRole; state: PostingState; quote: string | null; onRetry: () => void }) {
  const [open, setOpen] = useState(false);
  const text = state.kind === "ready" ? state.posting?.text.trim() ?? "" : "";
  const asks = askBullets(text);
  return (
    <section aria-labelledby={asks.length > 0 ? id : undefined} aria-label={asks.length > 0 ? undefined : ROLE_PAGE_COPY.readFull} className={SECTION}>
      {asks.length > 0 && <SectionHeading id={id}>{ROLE_PAGE_COPY.asksTitle}</SectionHeading>}
      {state.kind === "loading" && <p role="status" className="font-mono text-xs text-muted">{ROLE_PAGE_COPY.postingLoading}</p>}
      {state.kind === "failed" && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm font-bold text-danger">{state.message}</p>
          <Button variant="secondary" onClick={onRetry}>{ROLE_PAGE_COPY.tryAgain}</Button>
        </div>
      )}
      {asks.length > 0 && <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-6 text-ink marker:text-muted">{asks.map((ask) => <li key={ask}>{ask}</li>)}</ul>}
      {open && <FullText id={`${id}-full`} text={text} quote={quote} />}
      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
        {text && <button type="button" aria-expanded={open} aria-controls={`${id}-full`} onClick={() => setOpen(!open)} className={TOGGLE}>{open ? ROLE_PAGE_COPY.showLess : ROLE_PAGE_COPY.readFull}</button>}
        <OutLink href={role.url}>{ROLE_PAGE_COPY.original} ↗</OutLink>
      </p>
    </section>
  );
}

function FullText({ id, text, quote }: { id: string; text: string; quote: string | null }) {
  return (
    <p id={id} className="border-l-2 border-hairline pl-3 text-[15px] leading-6 break-words whitespace-pre-line text-ink">
      {highlight(text, quote).map((piece, index) => (piece.marked
        ? <mark key={index} className="bg-danger-wash px-0.5 text-ink">{piece.text}</mark>
        : <span key={index}>{piece.text}</span>))}
    </p>
  );
}

/** "About {company}": its one line, then a label left and the value right, thin rows, only rows with data. */
export function FactsSection({ id, card }: { id: string; card: CompanyCard }) {
  const rows = factRows(card);
  return (
    <section aria-labelledby={id} className={SECTION}>
      <SectionHeading id={id}>{aboutCompanyLine(card.name)}</SectionHeading>
      {card.oneLiner && <Blurb text={card.oneLiner} className="text-[15px] leading-6 text-ink" />}
      {rows.length === 0 ? <p className="font-mono text-xs text-muted">{ROLE_PAGE_COPY.littleKnown}</p> : (
        <dl aria-label={ROLE_PAGE_COPY.facts} className="flex flex-col">
          {rows.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5 last:border-b-0">
              <dt className="shrink-0 font-mono text-xs text-muted">{row.label}</dt>
              <dd className="min-w-0 text-right text-sm font-bold break-words text-ink">
                {row.href ? <OutLink href={row.href}>{row.value}</OutLink> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** Under the other roles: Jobs with this role's kind of work and level picked. */
export function SimilarLink({ role }: { role: CardRole }) {
  return <Link href={similarRolesHref(role)} className={`${LINK} self-start font-mono text-xs`}>{ROLE_PAGE_COPY.similar} →</Link>;
}

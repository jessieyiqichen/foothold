"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { OutLink } from "@/components/cards/CardParts";
import { DraftPanel } from "@/components/cards/DraftPanel";
import { SignInKey } from "@/components/public/SignInPrompt";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { contactWays } from "@/lib/cards/contact";
import { personName, roleTitle, sourceLine } from "@/lib/cards/copy";
import type { CardRole, CompanyCard } from "@/lib/cards/types";
import { aboutLine, COMPANY_COPY } from "@/lib/company/copy";
import type { FitWarning } from "@/lib/company/fit";
import { reachOutLine, ROLE_PAGE_COPY } from "@/lib/company/pageCopy";
import { similarRolesHref } from "@/lib/company/roleHeader";
import type { CompanyPage } from "@/lib/company/types";
import { CompanyActions } from "./CompanyActions";
import { FitSummary } from "./FitSummary";
import { LineIcon } from "./Icons";

/** The one heavy-edged block on the page (Tape & Tile's sheet with its ink shadow): sticky beside the content from
 *  `lg`, scrolling inside itself when taller than the window. */
const CARD = "flex flex-col gap-4 border-2 border-ink bg-surface p-5 shadow-[6px_6px_0_var(--color-ink)] lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto";
const LINK = "text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
const RULE = "flex flex-col gap-2 border-t border-hairline pt-3";

interface ActionCardProps {
  page: CompanyPage;
  role: CardRole | null;
  warnings: readonly FitWarning[];
  busy: boolean;
  error: string | null;
  onDecide: Parameters<typeof CompanyActions>[0]["onDecide"];
  userId: string | null;
  withDb: WithDb;
}

/** "Reach out to {company}", as the mockup (user, 2026-11-23): why it fits in a line, one primary key, how it works
 *  in three steps and similar roles. The key swaps the card to the first message, who to contact and the decision
 *  keys (and Back); the letter never shows until asked for. The draft panel is mounted from the start, hidden, so the
 *  key can say "Open your draft" when one is saved (drafts are kept one per company). */
export function ActionCard({ page, role, warnings, busy, error, onDecide, userId, withDb }: ActionCardProps) {
  const { card } = page;
  const id = `company-${card.companyId}-card`;
  const [drafting, setDrafting] = useState(false);
  const [saved, setSaved] = useState(false);
  const openKey = useRef<HTMLButtonElement>(null);
  const backKey = useRef<HTMLButtonElement>(null);
  const swap = (to: boolean) => {
    setDrafting(to);
    requestAnimationFrame(() => (to ? backKey : openKey).current?.focus());
  };
  return (
    <aside aria-labelledby={`${id}-title`} className={CARD}>
      <SectionHeading id={`${id}-title`}>{reachOutLine(card.name)}</SectionHeading>
      <div hidden={drafting} className="flex flex-col gap-4">
        <FitSummary role={role} companyShared={card.shared} warnings={warnings} />
        <Button ref={openKey} size="lg" className="w-full" onClick={() => swap(true)}>{saved ? ROLE_PAGE_COPY.openDraft : ROLE_PAGE_COPY.writeFirst}</Button>
        <HowItWorks />
        {role && <NotRight role={role} />}
      </div>
      <div hidden={!drafting} className="flex flex-col gap-3">
        <button ref={backKey} type="button" onClick={() => swap(false)} className={`${LINK} self-start font-mono text-xs`}>← {ROLE_PAGE_COPY.back}</button>
        <DraftPanel
          companyId={card.companyId} userId={userId} withDb={withDb} roleId={role ? Number(role.id) : null} onDraft={setSaved}
          note={role ? aboutLine(roleTitle(role)) : COMPANY_COPY.noRoleChosen}
        />
        <ContactRow card={card} />
        <CompanyActions decision={page.decision} busy={busy} error={error} onDecide={onDecide} quiet />
      </div>
    </aside>
  );
}

/** The same card for a signed-out visitor: the reason area asks them to sign in, the key is Clerk's sign-in (back to
 *  this page after), and How it works stays. */
export function LockedActionCard({ card, role }: { card: CompanyCard; role: CardRole | null }) {
  const id = `company-${card.companyId}-card`;
  return (
    <aside aria-labelledby={`${id}-title`} className={CARD}>
      <SectionHeading id={`${id}-title`}>{reachOutLine(card.name)}</SectionHeading>
      <p className="text-base leading-snug text-ink">{ROLE_PAGE_COPY.signInWhy}</p>
      <SignInKey label={ROLE_PAGE_COPY.signInWrite} />
      <HowItWorks />
      {role && <NotRight role={role} />}
    </aside>
  );
}

/** Who to contact in a line, with where they were found; the company's website or founders' page beside. */
function ContactRow({ card }: { card: CompanyCard }) {
  const { person } = card;
  const ways = contactWays(card);
  return (
    <div className={RULE}>
      <p className="text-sm leading-snug break-words text-ink">
        <span className="font-mono text-xs text-muted">{ROLE_PAGE_COPY.whoToContact}</span>{" "}
        {person ? (
          <>
            <span className="font-bold">{personName(person)}</span>{person.role && <span className="text-muted"> · {person.role}</span>}
            {" · "}<OutLink href={person.href}>{person.contact}</OutLink>
          </>
        ) : ROLE_PAGE_COPY.noneFound}
      </p>
      {person && <p className="font-mono text-[11px] leading-4 text-muted">{sourceLine(person.source, person.seenAt)}</p>}
      <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
        {ways.founders && <OutLink href={ways.founders}>{ROLE_PAGE_COPY.foundersYc} ↗</OutLink>}
        {card.website && <OutLink href={card.website}>{ROLE_PAGE_COPY.website} ↗</OutLink>}
      </p>
    </div>
  );
}

function HowItWorks() {
  const icons = ["fit", "write", "contact"] as const;
  return (
    <div className={RULE}>
      <p className="font-mono text-xs text-muted">{ROLE_PAGE_COPY.howItWorks}</p>
      <ol className="flex flex-col gap-2 text-sm text-ink">
        {ROLE_PAGE_COPY.howSteps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-2">
            <LineIcon name={icons[index]} />
            <span className="flex flex-col"><span className="font-bold">{step.title}</span><span className="text-xs text-muted">{step.line}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotRight({ role }: { role: CardRole }) {
  return (
    <p className="border-t border-hairline pt-3 font-mono text-xs text-muted">
      {ROLE_PAGE_COPY.notRight} <Link href={similarRolesHref(role)} className={LINK}>{ROLE_PAGE_COPY.similar}</Link>
    </p>
  );
}

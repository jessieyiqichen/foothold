"use client";

import { useState } from "react";
import { useSessionDb } from "@/components/auth/useSessionDb";
import { ContactPart, DoingPart, OutLink, WhyPart } from "@/components/cards/CardParts";
import { DraftPanel } from "@/components/cards/DraftPanel";
import { Blurb } from "@/components/cards/Expandable";
import { Button } from "@/components/ui/Button";
import { roleTitle } from "@/lib/cards/copy";
import { aboutLine, COMPANY_COPY } from "@/lib/company/copy";
import { startingRole } from "@/lib/company/roles";
import type { CompanyBy, CompanyPage } from "@/lib/company/types";
import { CompanyActions } from "./CompanyActions";
import { RolePicker } from "./RolePicker";
import { useCompany } from "./useCompany";

/** One company's page (`/companies/[id]`, or `/roles/[id]` with that role chosen): Today, All roles and Saved all lead
 *  here, and saving and writing happen here (user, 2026-11-21). The decision keys sit under the name; then why it
 *  fits, the open roles with one chosen, the message about that role, who to contact and how the company is doing. */
export function CompanyScreen({ by, askedRole }: { by: CompanyBy; askedRole: string | null }) {
  const { isLoaded, userId, withDb } = useSessionDb();
  const { state, busy, error, retry, setDecision } = useCompany(by, withDb, isLoaded && userId !== null);

  if (state.kind === "loading") return <p className="font-mono text-xs text-muted">{COMPANY_COPY.loading}</p>;
  if (state.kind === "failed") return <Failed message={state.message} onRetry={retry} />;
  if (state.kind === "missing") return <Missing byRole={"role" in by} postingUrl={state.postingUrl} />;
  return (
    <CompanyView page={state.page} askedRole={askedRole} busy={busy} error={error} onDecide={setDecision} userId={userId} withDb={withDb} />
  );
}

interface ViewProps {
  page: CompanyPage;
  askedRole: string | null;
  busy: boolean;
  error: string | null;
  onDecide: Parameters<typeof CompanyActions>[0]["onDecide"];
  userId: string | null;
  withDb: ReturnType<typeof useSessionDb>["withDb"];
}

function CompanyView({ page, askedRole, busy, error, onDecide, userId, withDb }: ViewProps) {
  const { card } = page;
  const [chosen, setChosen] = useState(() => startingRole(card.roles, askedRole, page.bestRole));
  const role = card.roles.find((r) => r.id === chosen) ?? null;
  const id = (part: string) => `company-${card.companyId}-${part}`;
  return (
    <article aria-labelledby={id("name")} className="flex w-full max-w-2xl flex-col gap-4 border-2 border-ink bg-surface p-5 shadow-[6px_6px_0_var(--color-ink)] sm:p-7">
      <div className="flex flex-col gap-2">
        <h1 id={id("name")} className="text-3xl leading-tight font-black tracking-[-0.03em] break-words text-ink">{card.name}</h1>
        {card.oneLiner && <Blurb text={card.oneLiner} className="text-base text-ink" />}
        {card.website && <OutLink href={card.website} className="self-start font-mono text-xs">{card.website.replace(/^https:\/\/(www\.)?/, "")}</OutLink>}
      </div>
      <CompanyActions decision={page.decision} busy={busy} error={error} onDecide={onDecide} />
      <WhyPart card={card} id={id("why")} />
      {card.roles.length > 0 && <RolePicker id={id("roles")} roles={card.roles} chosen={chosen} best={page.bestRole} onChoose={setChosen} />}
      <DraftPanel
        companyId={card.companyId} userId={userId} withDb={withDb}
        roleId={role ? Number(role.id) : null} note={role ? aboutLine(roleTitle(role)) : COMPANY_COPY.noRoleChosen}
      />
      <ContactPart card={card} id={id("contact")} />
      <DoingPart card={card} id={id("doing")} />
    </article>
  );
}

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-bold text-danger">{message}</p>
      <Button variant="secondary" onClick={onRetry}>{COMPANY_COPY.tryAgain}</Button>
    </div>
  );
}

function Missing({ byRole, postingUrl }: { byRole: boolean; postingUrl: string | null }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="font-bold text-ink">{byRole ? COMPANY_COPY.roleNoPage : COMPANY_COPY.notFound}</p>
      {byRole && postingUrl && <OutLink href={postingUrl}>{COMPANY_COPY.openPosting}</OutLink>}
    </div>
  );
}

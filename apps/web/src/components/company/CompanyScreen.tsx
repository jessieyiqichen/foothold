"use client";

import { useSessionDb } from "@/components/auth/useSessionDb";
import { OutLink } from "@/components/cards/CardParts";
import { Button } from "@/components/ui/Button";
import { COMPANY_COPY } from "@/lib/company/copy";
import { fitWarnings } from "@/lib/company/fit";
import { glanceCells } from "@/lib/company/glance";
import { startingRole } from "@/lib/company/roles";
import type { CompanyBy, CompanyPage } from "@/lib/company/types";
import { ActionCard, LockedActionCard } from "./ActionCard";
import { CompanyActions } from "./CompanyActions";
import { RoleLayout } from "./RoleLayout";
import { MoreRoles } from "./MoreRoles";
import { AsksSection, FactsSection, GlanceSection, RoleHeader } from "./RoleColumn";
import { useCompany } from "./useCompany";
import { usePosting } from "./usePosting";

/** One company's page (`/companies/[id]` about its best role, or `/roles/[id]` about that role): Today, All roles and Saved all lead
 *  here, and saving and writing happen here (user, 2026-11-21). Since 2026-11-23 the chosen role leads, with an
 *  action card beside it: is it a fit, the first message about that role, and reaching out. */
export function CompanyScreen({ by, askedRole }: { by: CompanyBy; askedRole: string | null }) {
  const { userId } = useSessionDb();
  // A new mode (signing in or out on this page) starts the page afresh, so one mode's data never shows in the other
  return <CompanyBody key={userId ? "mine" : "public"} by={by} askedRole={askedRole} />;
}

function CompanyBody({ by, askedRole }: { by: CompanyBy; askedRole: string | null }) {
  const { isLoaded, userId, withDb } = useSessionDb();
  const mode = userId ? "mine" : "public";
  const { state, busy, error, retry, setDecision } = useCompany(by, withDb, isLoaded, mode);

  if (state.kind === "loading") return <p className="font-mono text-xs text-muted">{COMPANY_COPY.loading}</p>;
  if (state.kind === "failed") return <Failed message={state.message} onRetry={retry} />;
  if (state.kind === "missing") return <Missing byRole={"role" in by} postingUrl={state.postingUrl} />;
  if (mode === "public") return <PublicCompanyView page={state.page} askedRole={askedRole} />;
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

/** The page in two columns from `lg` (user, 2026-11-23, after Clera's role page, in Tape & Tile): the role leads on
 *  the left with what the posting says at a glance, what it asks for and the company's other roles; the action card
 *  on the right, sticky, with the company's facts under it. One page is one role: the role asked for, else the best
 *  fit; another role is another page. */
function CompanyView({ page, askedRole, busy, error, onDecide, userId, withDb }: ViewProps) {
  const { card } = page;
  const role = card.roles.find((r) => r.id === startingRole(card.roles, askedRole, page.bestRole)) ?? null;
  const { state: posting, retry } = usePosting(role?.id ?? null, withDb);
  const warnings = fitWarnings({ signals: role?.signals });
  const cells = role ? glanceCells(role.signals, role.postedAt) : [];
  const id = (part: string) => `company-${card.companyId}-${part}`;
  const location = posting.kind === "ready" ? posting.posting?.location ?? null : null;
  return (
    <RoleLayout
      labelledBy={id("title")}
      header={<RoleHeader card={card} role={role} location={location} titleId={id("title")} />}
      card={<ActionCard page={page} role={role} warnings={warnings} busy={busy} error={error} onDecide={onDecide} userId={userId} withDb={withDb} />}
      glance={cells.length > 0 && <GlanceSection id={id("glance")} cells={cells} />}
      asks={role && <AsksSection key={role.id} id={id("asks")} role={role} state={posting} quote={warnings[0]?.quote ?? null} onRetry={retry} />}
      roles={<MoreRoles id={id("roles")} companyName={card.name} roles={card.roles} current={role} mode="mine" />}
      about={<FactsSection id={id("facts")} card={card} />}
      aboutPhone={<FactsSection id={id("facts-phone")} card={card} />}
    />
  );
}

/** A company page for a signed-out visitor (user, 2026-11-21; this layout 2026-11-23): the role, what its posting says
 *  at a glance, the company's facts and every open role are open; the card asks them to sign in for why it fits and
 *  the first message, which brings them back here. The posting's text is not readable signed out, so there is no
 *  "What they ask for" and the header links to the original. */
function PublicCompanyView({ page, askedRole }: { page: CompanyPage; askedRole: string | null }) {
  const { card } = page;
  const role = card.roles.find((r) => r.id === startingRole(card.roles, askedRole, null)) ?? null;
  const cells = role ? glanceCells(role.signals, role.postedAt) : [];
  const id = (part: string) => `company-${card.companyId}-${part}`;
  return (
    <RoleLayout
      labelledBy={id("title")}
      header={<RoleHeader card={card} role={role} location={null} titleId={id("title")} postingLink />}
      card={<LockedActionCard card={card} role={role} />}
      glance={cells.length > 0 && <GlanceSection id={id("glance")} cells={cells} />}
      roles={<MoreRoles id={id("roles")} companyName={card.name} roles={card.roles} current={role} mode="public" />}
      about={<FactsSection id={id("facts")} card={card} />}
      aboutPhone={<FactsSection id={id("facts-phone")} card={card} />}
    />
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

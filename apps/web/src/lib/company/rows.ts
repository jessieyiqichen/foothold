// One company's page, as fh_company answers it (supabase/migrations/20261121100000_foothold_company_page.sql): the
// card's fields with every open role, the role that fits best, and the person's own decision on the company.
import { DECISIONS, type Decision } from "../cards/constants";
import { rowToCard } from "../cards/rows";
import { MAX_ROLES_ON_PAGE } from "./constants";
import type { CompanyPage } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isDecision = (value: unknown): value is Decision => typeof value === "string" && (DECISIONS as readonly string[]).includes(value);

/** The page from fh_company's answer, or null when there is no such company or its row cannot be read. */
export function readCompany(data: unknown): CompanyPage | null {
  if (!Array.isArray(data) || !isRecord(data[0])) return null;
  const row = data[0];
  const card = rowToCard(row, MAX_ROLES_ON_PAGE);
  const { best_role: best, decision, decided_at: decidedAt } = row;
  if (!card) return null;
  if (!(best === null || best === undefined || typeof best === "number" || (typeof best === "string" && /^\d+$/.test(best)))) return null;
  if (!(decision === null || decision === undefined || isDecision(decision))) return null;
  if (!(decidedAt === null || decidedAt === undefined || (typeof decidedAt === "string" && !Number.isNaN(Date.parse(decidedAt))))) return null;
  return {
    card,
    bestRole: best === null || best === undefined ? null : String(best),
    decision: decision ?? null,
    decidedAt: decidedAt ?? null,
  };
}

// Step one of a draft (the harness, user 2026-11-21): the model plans before it writes. The plan names the role, the
// one resume line closest to that role's work, the phrase in the posting that line answers and a phrase about the
// company, each copied word for word; code checks every quote against its source before step two may use it. The
// person never sees the plan, only the email written from it.
import { quotedIn } from "./verify";

export interface Plan {
  roleTitle: string | null;
  resumeQuote: string;
  postingQuote: string | null;
  companyQuote: string;
  angle: string;
}

export interface PlanSources {
  resume: string;
  company: string;
  /** The chosen role's posting text, when there is one. */
  posting: string | null;
  roles: readonly string[];
  /** A resume line the person asked to move away from ("Try another angle"). */
  avoid: string | null;
}

const ANGLE_MAX = 300;

export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    role_title: { type: "string" }, resume_quote: { type: "string" }, posting_quote: { type: "string" },
    company_quote: { type: "string" }, angle: { type: "string" },
  },
  required: ["role_title", "resume_quote", "posting_quote", "company_quote", "angle"],
};

const text = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null);
const same = (a: string, b: string) => a.toLowerCase().replace(/\s+/g, " ").trim() === b.toLowerCase().replace(/\s+/g, " ").trim();

/** The plan from the model's reply, or null when a field is missing. Empty strings mean "none" for the role and the
 *  posting quote. */
export function readPlan(json: unknown): Plan | null {
  const r = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const [role, resume, posting, company, angle] = [text(r.role_title), text(r.resume_quote), text(r.posting_quote), text(r.company_quote), text(r.angle)];
  if (role === null || resume === null || posting === null || company === null || angle === null) return null;
  return { roleTitle: role || null, resumeQuote: resume, postingQuote: posting || null, companyQuote: company, angle };
}

/** Every problem with a plan, in a fixed order; empty means step two may write from it. */
export function checkPlan(plan: Plan, s: PlanSources): string[] {
  const problems: string[] = [];
  if (s.roles.length > 0 && !(plan.roleTitle && s.roles.some((role) => same(role, plan.roleTitle!)))) {
    problems.push(`role_title must be one of: ${s.roles.map((r) => `"${r}"`).join("; ")}`);
  }
  if (!quotedIn(plan.resumeQuote, s.resume)) problems.push("resume_quote is not word for word in the RESUME");
  if (s.avoid && (quotedIn(plan.resumeQuote, s.avoid) || quotedIn(s.avoid, plan.resumeQuote) || same(plan.resumeQuote, s.avoid))) {
    problems.push("resume_quote is the line the person asked to move away from; pick another one");
  }
  if (s.posting && !(plan.postingQuote && quotedIn(plan.postingQuote, s.posting))) problems.push("posting_quote is not word for word in the POSTING");
  if (!quotedIn(plan.companyQuote, s.company)) problems.push("company_quote is not word for word under About in COMPANY");
  if (plan.angle.length === 0 || plan.angle.length > ANGLE_MAX) problems.push(`angle must be one sentence under ${ANGLE_MAX} characters`);
  return problems;
}

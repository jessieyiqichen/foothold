/** One company's page: Today, All roles and Saved all lead here; saving and writing happen here (user, 2026-11-21). */
export const COMPANY_RPC = "fh_company";
/** /companies/[id] opens a company; /roles/[id] opens the company of that role, with the role chosen. */
export const COMPANIES_PATH = "/companies";
export const ROLES_PATH = "/roles";
/** The most roles a page lists; fh_company returns at most 30. */
export const MAX_ROLES_ON_PAGE = 30;

export const companyHref = (companyId: number, roleId?: string | null): string =>
  roleId ? `${COMPANIES_PATH}/${companyId}?role=${encodeURIComponent(roleId)}` : `${COMPANIES_PATH}/${companyId}`;
export const roleHref = (roleId: string): string => `${ROLES_PATH}/${encodeURIComponent(roleId)}`;

/** A page id from the address: a positive whole number, or null. */
export function idFromPath(value: string | undefined | null): number | null {
  if (!value || !/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

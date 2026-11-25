// Which role a company page is about, and how many of its other roles show before "See all".
import type { CardRole } from "../cards/types";

/** Other roles shown before "See all N". */
export const ROLES_SHOWN = 5;

/** The role a page starts with: the one asked for (from All roles), else the best fit, else the first; null when the
 *  company lists no open role. A role asked for that is not listed falls back the same way. */
export function startingRole(roles: readonly CardRole[], asked: string | null, best: string | null): string | null {
  const has = (id: string | null) => id !== null && roles.some((role) => role.id === id);
  if (has(asked)) return asked;
  if (has(best)) return best;
  return roles[0]?.id ?? null;
}

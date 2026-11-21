// Which role a company page starts with, and which roles its picker shows before "+N more".
import type { CardRole } from "../cards/types";

/** Roles the picker shows before "+N more". */
export const ROLES_SHOWN = 5;

/** The role a page starts with: the one asked for (from All roles), else the best fit, else the first; null when the
 *  company lists no open role. A role asked for that is not listed falls back the same way. */
export function startingRole(roles: readonly CardRole[], asked: string | null, best: string | null): string | null {
  const has = (id: string | null) => id !== null && roles.some((role) => role.id === id);
  if (has(asked)) return asked;
  if (has(best)) return best;
  return roles[0]?.id ?? null;
}

/** The roles shown: all when opened, else the first ROLES_SHOWN with the chosen one kept in; and how many are left. */
export function pickerRoles(roles: readonly CardRole[], chosen: string | null, open: boolean): { shown: CardRole[]; more: number } {
  if (open || roles.length <= ROLES_SHOWN) return { shown: [...roles], more: 0 };
  const first = roles.slice(0, ROLES_SHOWN);
  const picked = roles.find((role) => role.id === chosen);
  const shown = picked && !first.includes(picked) ? [...first.slice(0, ROLES_SHOWN - 1), picked] : first;
  return { shown, more: roles.length - shown.length };
}

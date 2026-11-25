"use client";

import Link from "next/link";
import { useState } from "react";
import { Part } from "@/components/cards/CardParts";
import type { CardRole } from "@/lib/cards/types";
import { COMPANY_COPY } from "@/lib/company/copy";
import { moreRoleRows, shownRows, type MoreRoleRow } from "@/lib/company/moreRoles";
import { moreRolesTitle, ROLE_PAGE_COPY, seeAllLine } from "@/lib/company/pageCopy";
import { SimilarLink } from "./RoleColumn";

const TOGGLE = "self-start font-mono text-xs text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
const ROW_LINK = "flex min-w-0 items-baseline justify-between gap-3 py-2.5 text-ink hover:text-link focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** "More roles at {company} (N)" (user, 2026-11-23): one page is one role, so each other role is a plain link to its
 *  own page (the address changes, Back works). One line each: the title, then at most two muted words, kind and age.
 *  The first five, then "See all N" in place; "See similar roles" under them. The same list signed in or out:
 *  best fit first for a signed-in person, newest first for a visitor. */
export function MoreRoles({ id, companyName, roles, current, mode }: { id: string; companyName: string; roles: readonly CardRole[]; current: CardRole | null; mode: "mine" | "public" }) {
  const [open, setOpen] = useState(false);
  const rows = moreRoleRows(roles, current?.id ?? null, mode);
  const { shown, hidden } = shownRows(rows, open);
  if (!current) {
    return <Part id={id} title={ROLE_PAGE_COPY.openRoles} level="h2"><p className="font-mono text-xs text-muted">{COMPANY_COPY.noRoles}</p></Part>;
  }
  if (rows.length === 0) return <SimilarLink role={current} />;
  // "See all" goes once every role shows: focus moves to the first role that was hidden, not to the page
  const showAll = () => {
    setOpen(true);
    requestAnimationFrame(() => document.getElementById(`${id}-${rows[shown.length]?.id}`)?.focus());
  };
  return (
    <Part id={id} title={moreRolesTitle(companyName, rows.length)} level="h2">
      <ul className="flex flex-col">
        {shown.map((row) => <RoleRow key={row.id} row={row} linkId={`${id}-${row.id}`} />)}
      </ul>
      {hidden > 0 && <button type="button" onClick={showAll} className={TOGGLE}>{seeAllLine(rows.length)}</button>}
      <SimilarLink role={current} />
    </Part>
  );
}

function RoleRow({ row, linkId }: { row: MoreRoleRow; linkId: string }) {
  const words = [row.kind, row.age].filter(Boolean).join(" · ");
  return (
    <li className="border-b border-hairline last:border-b-0">
      <Link id={linkId} href={row.href} className={ROW_LINK}>
        <span className="min-w-0 truncate text-base font-bold">{row.title}</span>
        {words && <span className="shrink-0 font-mono text-xs text-muted">{words}</span>}
      </Link>
    </li>
  );
}

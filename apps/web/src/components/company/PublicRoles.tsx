"use client";

import { useState } from "react";
import { OutLink, Part } from "@/components/cards/CardParts";
import { ageLine } from "@/lib/cards/age";
import { roleTitle } from "@/lib/cards/copy";
import type { CardRole } from "@/lib/cards/types";
import { COMPANY_COPY, moreRolesLine } from "@/lib/company/copy";
import { ROLES_SHOWN } from "@/lib/company/roles";
import { levelLabel } from "@/lib/matches/copy";
import { LEVEL_TILE_CLASS } from "@/lib/matches/tiles";

const TOGGLE = "self-start font-mono text-xs text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** The open roles on a signed-out visitor's company page: the first few, the one they came from first, the rest one
 *  tap away, as on the signed-in page (2026-11-22: thirty in a row made the page long again). Each opens its posting. */
export function PublicRoles({ id, roles }: { id: string; roles: CardRole[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? roles : roles.slice(0, ROLES_SHOWN);
  const more = roles.length - shown.length;
  return (
    <Part id={id} title={COMPANY_COPY.roles}>
      {roles.length === 0 ? <p className="font-mono text-xs text-muted">{COMPANY_COPY.noRoles}</p> : (
        <ul className="flex flex-col gap-3">
          {shown.map((role) => {
            const age = ageLine(role.postedAt);
            return (
              <li key={role.id} className="flex flex-col gap-1">
                <OutLink href={role.url} className="text-base font-bold">{roleTitle(role)}</OutLink>
                <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                  <span className={LEVEL_TILE_CLASS}>{levelLabel(role.level)}</span>
                  {age && <span>Posted {age}</span>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {more > 0 && <button type="button" onClick={() => setOpen(true)} className={TOGGLE}>{moreRolesLine(more)}</button>}
    </Part>
  );
}

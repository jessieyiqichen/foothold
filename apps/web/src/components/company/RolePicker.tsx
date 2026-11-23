"use client";

import { useState } from "react";
import { ageLine } from "@/lib/cards/age";
import { roleTitle } from "@/lib/cards/copy";
import type { CardRole } from "@/lib/cards/types";
import { COMPANY_COPY, moreRolesLine } from "@/lib/company/copy";
import { levelLabel } from "@/lib/matches/copy";
import { LEVEL_TILE_CLASS } from "@/lib/matches/tiles";
import { OutLink, Part } from "@/components/cards/CardParts";
import { pickerRoles } from "@/lib/company/roles";
import { SignalLine } from "@/components/roles/SignalLine";

const TOGGLE = "self-start font-mono text-xs text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Every open role at the company, one of them chosen: the message below is about the chosen one. The first few show,
 *  the chosen one always among them; the rest are one tap away. */
export function RolePicker({ id, roles, chosen, best, onChoose }: { id: string; roles: CardRole[]; chosen: string | null; best: string | null; onChoose: (roleId: string) => void }) {
  const [open, setOpen] = useState(false);
  const { shown, more } = pickerRoles(roles, chosen, open);
  // The button goes once every role shows: focus moves to the first role that was hidden, not to the page (review)
  const showAll = (from: number) => {
    setOpen(true);
    requestAnimationFrame(() => {
      const next = roles.find((role) => !shown.includes(role)) ?? roles[from];
      if (next) document.getElementById(`${id}-${next.id}`)?.focus();
    });
  };
  return (
    <Part id={id} title={COMPANY_COPY.roles}>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-mono text-xs text-muted">{COMPANY_COPY.pickRole}</legend>
        {shown.map((role) => <RoleChoice key={role.id} role={role} name={id} checked={role.id === chosen} best={role.id === best} onChoose={onChoose} />)}
      </fieldset>
      {more > 0 && <button type="button" onClick={() => showAll(shown.length)} className={TOGGLE}>{moreRolesLine(more)}</button>}
    </Part>
  );
}

function RoleChoice({ role, name, checked, best, onChoose }: { role: CardRole; name: string; checked: boolean; best: boolean; onChoose: (roleId: string) => void }) {
  const age = ageLine(role.postedAt);
  return (
    <div className={`flex items-start gap-3 border-2 px-3 py-2.5 ${checked ? "border-ink bg-wash" : "border-transparent"}`}>
      <input
        type="radio" id={`${name}-${role.id}`} name={name} checked={checked} onChange={() => onChoose(role.id)} aria-describedby={`${name}-${role.id}-about`}
        className="mt-1 size-4 shrink-0 accent-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={`${name}-${role.id}`} className="cursor-pointer text-base leading-snug font-bold break-words text-ink">{roleTitle(role)}</label>
        <SignalLine signals={role.signals} />
        <p id={`${name}-${role.id}-about`} className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
          {best && <span className="bg-tile-mustard px-1.5 py-0.5 text-[11px] leading-4 text-ink">{COMPANY_COPY.bestFit}</span>}
          <span className={LEVEL_TILE_CLASS}>{levelLabel(role.level)}</span>
          {age && <span>Posted {age}</span>}
          <OutLink href={role.url}>{COMPANY_COPY.posting} ↗</OutLink>
        </p>
      </div>
    </div>
  );
}

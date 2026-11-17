"use client";

import { useState } from "react";
import { CARDS_COPY, moreSkillsLine } from "@/lib/cards/copy";
import { leadSentence, someSkills } from "@/lib/cards/trim";

const TOGGLE = "font-mono text-xs text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** The company in one sentence; More shows the whole description in place. */
export function Blurb({ text, className }: { text: string; className: string }) {
  const [open, setOpen] = useState(false);
  const { lead, more } = leadSentence(text);
  return (
    <p className={className}>
      {open || !more ? text : lead}
      {more && (
        <>
          {" "}
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={TOGGLE}>{open ? CARDS_COPY.less : CARDS_COPY.more}</button>
        </>
      )}
    </p>
  );
}

/** The first few shared skills; the "+N more" tile shows the rest. */
export function SkillList({ skills, label, itemClass }: { skills: readonly string[]; label: string; itemClass: string }) {
  const [open, setOpen] = useState(false);
  const { shown, more } = someSkills(skills);
  return (
    <ul aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {(open ? skills : shown).map((skill) => <li key={skill} className={itemClass}>{skill}</li>)}
      {more > 0 && !open && (
        <li><button type="button" aria-expanded={false} onClick={() => setOpen(true)} className={TOGGLE}>{moreSkillsLine(more)}</button></li>
      )}
    </ul>
  );
}

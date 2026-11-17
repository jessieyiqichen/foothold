"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface FilterMenuProps {
  label: string;
  /** Pressed in when the filter narrows anything. */
  pressed: boolean;
  /** The panel opens under the trigger, from its left or its right edge. */
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}

const TRIGGER =
  "keycap inline-flex min-h-10 items-center gap-1.5 border-2 border-line px-3 text-sm font-bold text-ink " +
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus";

/** One filter's dropdown: a key that shows how many are picked and opens a panel under it. The key says whether it is
 *  open (aria-expanded); focus moves into the panel when it opens, and Escape or a click outside closes it, with focus
 *  back on the key. */
export function FilterMenu({ label, pressed, align = "left", children }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // Counts closes made from inside (Escape, a panel's Show key), each sending focus back to the key
  const [closed, setClosed] = useState(0);
  const close = () => {
    setOpen(false);
    setClosed((n) => n + 1);
  };
  useEffect(() => {
    if (closed > 0) trigger.current?.focus();
  }, [closed]);

  useEffect(() => {
    if (!open) return;
    wrap.current?.querySelector<HTMLElement>(`[id="${panelId}"] input, [id="${panelId}"] button`)?.focus();
    const outside = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open, panelId]);

  return (
    <div ref={wrap} className="relative" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); close(); } }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={panelId} aria-pressed={pressed}
        onClick={() => setOpen(!open)} className={`${TRIGGER} ${pressed ? "bg-primary" : "bg-surface hover:bg-wash"}`}>
        {label}
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <div id={panelId} className={`absolute top-full z-30 mt-2 w-72 border-2 border-ink bg-surface p-3 shadow-[4px_4px_0_var(--color-ink)] ${align === "right" ? "right-0" : "left-0"}`}>
          {children(close)}
        </div>
      )}
    </div>
  );
}

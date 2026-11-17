"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ROLES_COPY, showRoles } from "@/lib/roles/copy";
import { kindPanel, levelPanel, placePanel, postedPanel, type ControlsProps } from "./FilterControls";

/** On a phone, the four filters in one sheet from the bottom of the screen, each change applied at once. The browser's
 *  own dialog: focus moves in, Escape or Done closes it, and focus goes back to the Filters button. */
export function FilterSheet({ label, pressed, total, ...props }: ControlsProps & { label: string; pressed: boolean; total?: number | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const none = () => {};
  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-pressed={pressed} onClick={() => setOpen(true)}
        className={`keycap inline-flex min-h-10 items-center border-2 border-line px-3 text-sm font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus ${pressed ? "bg-primary" : "bg-surface"}`}>
        {label}
      </button>
      <dialog ref={ref} aria-labelledby={titleId} onClose={() => setOpen(false)}
        className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto border-t-2 border-ink bg-surface p-4 text-ink backdrop:bg-ink/50">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-condensed text-2xl font-bold uppercase">{ROLES_COPY.filtersTitle}</h2>
          <Button variant="secondary" onClick={() => setOpen(false)}>{ROLES_COPY.done}</Button>
        </div>
        {open && (
          <div className="flex flex-col gap-4 divide-y divide-hairline">
            {kindPanel(props, true, none)}
            <div className="pt-4">{levelPanel(props, true, none)}</div>
            <div className="pt-4">{postedPanel(props, true, none, "roles-sheet-posted")}</div>
            <div className="pt-4">{placePanel(props, true, none, "roles-sheet-place")}</div>
            <div className="pt-4"><Button className="w-full" onClick={() => setOpen(false)}>{showRoles(total ?? null)}</Button></div>
          </div>
        )}
      </dialog>
    </>
  );
}

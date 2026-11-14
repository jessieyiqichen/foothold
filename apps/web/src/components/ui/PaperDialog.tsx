"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { Tape } from "./art/Tape";

interface PaperDialogProps {
  open: boolean;
  title: string;
  /** The words on the close key, e.g. "Keep it". */
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

/** A sheet of paper taped over the page, from Builder's Board (Tape & Tile), for a choice made without leaving it:
 *  the delete confirm. The browser's own dialog: Esc closes it, focus stays inside and goes back to the button that
 *  opened it, and the page behind is inert. */
export function PaperDialog({ open, title, closeLabel, onClose, children }: PaperDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,32rem)] overflow-visible border-2 border-ink bg-surface p-0 text-[15px] leading-6 text-ink shadow-[-14px_22px_30px_-12px_rgb(10_10_40/0.6)] backdrop:bg-ink/60 open:-rotate-[0.4deg]"
    >
      <Tape className="-top-3 -left-5 -rotate-[38deg]" />
      <Tape className="-top-3 -right-5 rotate-[38deg]" />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
          <Button variant="secondary" onClick={onClose}>{closeLabel}</Button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}

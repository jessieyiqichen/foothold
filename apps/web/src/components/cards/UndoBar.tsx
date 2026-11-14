"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { UNDO_MS } from "@/lib/cards/constants";
import { CARDS_COPY } from "@/lib/cards/copy";
import { pausableTimer, type PausableTimer } from "@/lib/timer";

interface UndoBarProps {
  /** What was just done; null hides the bar. */
  message: string | null;
  onUndo: () => void;
  onClose: () => void;
}

/** A sheet along the foot of the screen saying what was just done, with Undo for a few seconds. It waits while the
 *  pointer is on it or focus is inside it, so Undo can always be reached in time (WCAG 2.2.1). Fixed in place, so it
 *  never moves the page. */
export function UndoBar({ message, onUndo, onClose }: UndoBarProps) {
  const timer = useRef<PausableTimer | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = pausableTimer(UNDO_MS, onClose);
    timer.current = t;
    return () => t.cancel();
  }, [message, onClose]);
  const pause = () => timer.current?.pause();
  const resume = () => timer.current?.resume();

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      {message && (
        <div
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) resume(); }}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 border-2 border-ink bg-surface px-4 py-2 shadow-[4px_4px_0_var(--color-ink)]"
        >
          <span className="min-w-0 font-mono text-xs break-words text-ink">{message}</span>
          <Button variant="secondary" onClick={onUndo}>{CARDS_COPY.undo}</Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { pausableTimer, type PausableTimer } from "@/lib/timer";
import { Button } from "./Button";

export const TOAST_MS = 8000;

interface ToastProps {
  message: string | null;
  onUndo?: () => void;
  onClose: () => void;
  /** Lifted above the week's shelf, which is fixed at the foot of a phone screen on Today. */
  raised?: boolean;
}

/** A short confirmation at the bottom of the screen, with an optional Undo. It leaves after 8 seconds, but waits while
 *  the pointer is on it or keyboard focus is inside it, so Undo can always be reached in time (course week 3, WCAG
 *  "enough time"; it used to leave on schedule even while someone was on it). */
export function Toast({
  message,
  onUndo,
  onClose,
  raised = false,
}: ToastProps) {
  const timer = useRef<PausableTimer | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = pausableTimer(TOAST_MS, onClose);
    timer.current = t;
    return () => t.cancel();
  }, [message, onClose]);
  const pause = () => timer.current?.pause();
  const resume = () => timer.current?.resume();

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 ${raised ? "bottom-28 sm:bottom-4" : "bottom-4"}`}
    >
      {message && (
        <div
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) resume();
          }}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-2 font-bold text-surface shadow-lg"
        >
          <span>{message}</span>
          {onUndo && (
            <Button
              variant="ghost"
              className="text-surface decoration-surface hover:decoration-reward"
              onClick={onUndo}
            >
              Undo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

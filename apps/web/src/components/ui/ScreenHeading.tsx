"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The h1 of a screen that replaces another in place (first visit steps, after Start, done).
 * Focus moves to it on mount, so keyboard and screen reader users land on the new content.
 */
export function ScreenHeading({ id, className, children }: { id: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: false });
  }, []);
  return (
    <h1 id={id} ref={ref} tabIndex={-1} className={`${className} focus:outline-none`}>
      {children}
    </h1>
  );
}

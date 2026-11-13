import type { ComponentProps, ReactNode } from "react";
import { Button } from "./Button";

/** One choice that is on or off, among several that can be on together: a white clay button, pale green with a tick
 *  when on (as the Search | Saved switch on Jobs), so it never rests on colour alone. */
export function ToggleChip({ on, children, ...props }: { on: boolean; children: ReactNode } & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <Button variant="secondary" aria-pressed={on} className={on ? "bg-primary-soft [--lip:var(--color-lip)]" : ""} {...props}>
      {on && <span aria-hidden="true">✓</span>}
      {children}
    </Button>
  );
}

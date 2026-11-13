import type { ComponentProps, ReactNode } from "react";
import { Button } from "./Button";

/** One choice that is on or off, among several that can be on together. On: the accent edge and tint, with a tick,
 *  so it never rests on colour alone. Used for directions, levels and skills alike. */
export function ToggleChip({ on, children, ...props }: { on: boolean; children: ReactNode } & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <Button variant={on ? "chosen" : "secondary"} aria-pressed={on} {...props}>
      {on && <span aria-hidden="true">✓</span>}
      {children}
    </Button>
  );
}

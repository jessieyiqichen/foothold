import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "chosen" | "ghost" | "danger" | "choice";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 font-bold " +
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:opacity-50";
/** A key on its own edge (Tape & Tile): a 2px ink border, square, sinking when pressed or switched on. */
const KEY = "keycap border-2 border-line";

/** Keycaps (Tape & Tile, user 2026-11-13). The primary key is the one mustard block on the screen; secondary is the
 *  sheet's colour; chosen is a key switched on, mustard and pressed in (ToggleChip); ghost is a cobalt link word.
 *  Hover only shifts the fill a step. */
const variants: Record<Variant, string> = {
  primary: `${KEY} bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed`,
  secondary: `${KEY} bg-surface text-ink hover:bg-wash active:bg-wash-strong`,
  chosen: `${KEY} bg-primary text-on-primary hover:bg-primary-hover`,
  ghost: "font-medium text-link underline decoration-1 underline-offset-4 hover:text-ink",
  danger: `${KEY} bg-surface text-danger hover:bg-danger-wash active:bg-danger-wash`,
  /** One of several options to pick from (first visit): the label left, an arrow right. */
  choice: `${KEY} bg-surface text-ink hover:bg-wash active:bg-wash-strong`,
};

const sizes: Record<Size, string> = {
  md: "min-h-10 px-3 text-sm",
  lg: "min-h-12 px-5 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function buttonClass({ variant = "primary", size = "md", className = "" }: Omit<StyleProps, "children">) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({ variant, size, className, ...props }: StyleProps & ComponentProps<"button">) {
  return <button type="button" className={buttonClass({ variant, size, className })} {...props} />;
}

/** A link styled as a button. External links open in a new tab. */
export function ButtonLink({
  variant,
  size,
  className,
  href,
  external = false,
  children,
}: StyleProps & { href: string; external?: boolean }) {
  const cls = buttonClass({ variant, size, className });
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

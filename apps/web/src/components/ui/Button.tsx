import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "chosen" | "ghost" | "danger" | "choice";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/** Flat buttons, one pixel of edge and no shadow (Foothold's minimal look, user 2026-11-12). The primary one is the
 *  only filled block on the screen; secondary is white with a quiet edge; chosen is a secondary that is switched on
 *  (ToggleChip); ghost is a link-coloured word. Hover and press only shift the fill a step. */
const variants: Record<Variant, string> = {
  primary: "border border-transparent bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed",
  secondary: "border border-line bg-page text-ink hover:bg-wash active:bg-wash-strong",
  chosen: "border border-primary bg-primary-soft text-primary hover:text-primary-hover active:text-primary-pressed",
  ghost: "text-primary underline decoration-1 underline-offset-4 hover:text-primary-hover active:text-primary-pressed",
  danger: "border border-danger bg-page text-danger hover:bg-danger-wash active:bg-danger-wash",
  /** One of several options to pick from (first visit): the label left, an arrow right. */
  choice: "border border-line bg-page text-ink hover:bg-wash active:bg-wash-strong",
};

const sizes: Record<Size, string> = {
  md: "min-h-9 px-3 text-sm",
  lg: "min-h-11 px-5 text-base",
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

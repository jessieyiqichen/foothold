import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "choice";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-display font-semibold " +
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/** Clay buttons: the primary one is the only saturated block on the screen and sits on a deep green lip; white
 *  clay for secondary and choice buttons; ghost is an underlined word. Pressing sinks a clay button onto its lip. */
const variants: Record<Variant, string> = {
  primary: "clay clay-press [--lip:var(--color-lip)] bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "clay clay-press bg-surface text-ink hover:bg-wash",
  ghost: "text-ink underline decoration-2 underline-offset-4 decoration-line hover:decoration-ink active:text-muted",
  danger: "border-2 border-danger bg-surface text-danger hover:bg-danger-wash active:bg-danger-wash",
  /** One of several options to pick from (first visit): white clay, the label left, an arrow right. */
  choice: "clay clay-press bg-surface text-ink hover:bg-wash",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-base",
  lg: "min-h-14 px-6 text-xl",
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

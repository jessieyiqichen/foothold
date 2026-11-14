import type { ReactNode } from "react";

/** A section heading in Tape & Tile's condensed capitals. Section headings only: names and numbers take the grotesk,
 *  labels the mono. */
export function SectionHeading({ id, children, level = "h2" }: { id?: string; children: ReactNode; level?: "h2" | "h3" }) {
  const Heading = level;
  return <Heading id={id} className="font-condensed text-2xl leading-none font-bold tracking-[0.01em] text-ink uppercase">{children}</Heading>;
}

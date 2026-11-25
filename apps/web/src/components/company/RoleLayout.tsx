import type { ReactNode } from "react";

/** The role page's frame (user, 2026-11-23, Clera's layout in Tape & Tile). On a phone the parts read in this order:
 *  header, card, at a glance, what they ask for, more roles, about the company. From `lg` two columns: the header and
 *  then the rest on the left; the card with "About" right under it on the right, so About never waits for the left
 *  column to end (2026-11-23: a sticky card left a tall gap above it). About is rendered twice, once per layout, each
 *  shown at its own width only, with its own ids (`about`, `aboutPhone`). */
export function RoleLayout({ labelledBy, header, card, glance, asks, roles, about, aboutPhone }: {
  labelledBy: string;
  header: ReactNode;
  card: ReactNode;
  glance?: ReactNode;
  asks?: ReactNode;
  roles: ReactNode;
  about: ReactNode;
  aboutPhone: ReactNode;
}) {
  return (
    <article
      aria-labelledby={labelledBy}
      className="flex w-full flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6"
    >
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{header}</div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {card}
        <div className="hidden lg:block">{about}</div>
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-2">
        {glance}
        {asks}
        {roles}
      </div>
      <div className="min-w-0 lg:hidden">{aboutPhone}</div>
    </article>
  );
}

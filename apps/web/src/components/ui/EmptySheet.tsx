import type { ReactNode } from "react";
import { Shape, type ShapeName, type TileColor } from "./art/Shape";
import { Tape } from "./art/Tape";

interface EmptySheetProps {
  shape: ShapeName;
  color: TileColor;
  tile: TileColor;
  children: ReactNode;
}

/** An empty state as a sheet taped to the page with its shape (Tape & Tile, front-facing parts only): no resume yet,
 *  no matches. Tilted a little, like a note pinned by hand; the words and the one action sit on it. */
export function EmptySheet({ shape, color, tile, children }: EmptySheetProps) {
  return (
    <div className="relative mt-3 flex max-w-lg -rotate-[0.8deg] items-start gap-4 border-2 border-ink bg-surface p-5 shadow-[-10px_16px_22px_-12px_rgb(10_10_40/0.45)]">
      <Tape className="-top-3 left-6 -rotate-[6deg]" />
      <Shape shape={shape} color={color} tile={tile} size={44} className="shrink-0" />
      <div className="flex min-w-0 flex-col items-start gap-3">{children}</div>
    </div>
  );
}

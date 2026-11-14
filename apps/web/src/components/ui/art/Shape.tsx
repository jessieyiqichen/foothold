/** The tile colours as fills (the same values as the --color-tile-* tokens in globals.css). */
export const FILL = {
  red: "#d8503a",
  cobalt: "#2547c7",
  mustard: "#e2b04a",
  green: "#1f3d39",
  navy: "#1b1a2c",
  off: "#f4f1ea",
} as const;
export type TileColor = keyof typeof FILL;
export type ShapeName = "quarter" | "half" | "square" | "circle" | "triangle" | "arch";

/** Each shape in a 100×100 tile, touching its edges. A circle carries a dot off centre and the square sits in a
 *  corner, so a quarter turn can be seen (Tape & Tile, from Builder's Board). */
const PATH: Record<ShapeName, string> = {
  quarter: "M0 0 H100 A100 100 0 0 1 0 100 Z",
  half: "M0 100 A50 50 0 0 1 100 100 Z",
  square: "M0 0 H58 V58 H0 Z",
  circle: "M50 0 A50 50 0 1 1 49.9 0 Z",
  triangle: "M50 0 L100 100 H0 Z",
  arch: "M0 100 V50 A50 50 0 0 1 100 50 V100 Z",
};

interface ShapeProps {
  shape: ShapeName;
  color: TileColor;
  /** The tile behind the shape; none leaves the shape on the page. */
  tile?: TileColor;
  size: number;
  className?: string;
}

/** A flat Bauhaus shape on its tile. Decoration only, so hidden from assistive technology; front-facing parts only. */
export function Shape({ shape, color, tile, size, className }: ShapeProps) {
  const dot = color === "off" || color === "mustard" ? FILL.navy : FILL.off;
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 100 100" className={className} preserveAspectRatio="none">
      {tile && <rect width="100" height="100" fill={FILL[tile]} />}
      <path d={PATH[shape]} fill={FILL[color]} />
      {shape === "circle" && <circle cx="70" cy="30" r="7" fill={dot} />}
    </svg>
  );
}

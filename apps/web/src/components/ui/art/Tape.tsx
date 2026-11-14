/** A strip of translucent tape holding a sheet to the wall (Tape & Tile). Front-facing parts only: the sign-in card,
 *  the header's wordmark, empty states, the first visit and the paper dialog; never a list row or a field. */
/** `small` is the header's strip: a class string cannot override the default size, since Tailwind does not order
 *  two height classes by where they appear, so the size is chosen here (2026-11-13: the default size covered the
 *  wordmark). */
export function Tape({ className, small = false }: { className: string; small?: boolean }) {
  return <span aria-hidden className={`pointer-events-none absolute z-10 ${small ? "h-3 w-10" : "h-7 w-24"} bg-tile-off/70 shadow-[0_1px_2px_rgb(0_0_0/0.15)] ${className}`} />;
}

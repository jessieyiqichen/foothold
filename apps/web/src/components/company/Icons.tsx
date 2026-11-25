import type { GlanceKey } from "@/lib/company/glance";

/** Small line icons for the role page: ink strokes, square ends, 16px, always beside words that say the same. */
const PATHS: Record<GlanceKey | "fit" | "write" | "contact", string> = {
  years: "M3 6h10v7H3zM6 6V4h4v2",
  visa: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12",
  equity: "M8 2v6h6A6 6 0 1 1 8 2z",
  k401: "M3 13V7l5-4 5 4v6zM6 13v-3h4v3",
  posted: "M3 4h10v9H3zM3 7h10M6 2v3M10 2v3",
  fit: "M3 8l3 3 7-7",
  write: "M3 13l1-3 7-7 2 2-7 7zM10 4l2 2",
  contact: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14c1-3 3-4 6-4s5 1 6 4",
};

export function LineIcon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-ink stroke-[1.5]" strokeLinecap="square">
      <path d={PATHS[name]} />
    </svg>
  );
}

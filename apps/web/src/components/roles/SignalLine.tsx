"use client";

import { useId, useState, type PointerEvent } from "react";
import { quoteLine, signalItems, signalTone } from "@/lib/signals/format";
import { SIGNALS_COPY } from "@/lib/signals/copy";
import type { SignalKey, Signals } from "@/lib/signals/types";

const ITEM =
  "-my-1 py-1 text-left underline decoration-dotted decoration-1 underline-offset-4 hover:text-ink aria-expanded:text-ink " +
  "aria-expanded:decoration-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** What the posting's own text says, as one compact mono line under a role's title: "Needs 4+ years · $120k–$160k ·
 *  Sponsors visas". Each item is a key: tapping it (or hovering with a mouse) shows the sentence it was read from,
 *  under the line, so every judgment quotes its source. A role that needs years takes the muted warning tone (the
 *  words say it too, so colour is never the only sign); preferred years are plain. No signals: nothing at all. */
export function SignalLine({ signals }: { signals?: Signals | null }) {
  const quoteId = useId();
  const [open, setOpen] = useState<SignalKey | null>(null);
  const [hover, setHover] = useState<SignalKey | null>(null);
  const items = signalItems(signals);
  if (items.length === 0) return null;
  const shown = items.find((item) => item.key === (hover ?? open)) ?? null;
  // A touch also fires pointer events: only a mouse previews on hover, so a second tap can close the quote
  const mouse = (event: PointerEvent, key: SignalKey | null) => {
    if (event.pointerType === "mouse") setHover(key);
  };
  return (
    <div className="flex min-w-0 flex-col gap-1" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(null); } }}>
      <ul aria-label={SIGNALS_COPY.lineLabel}
        className={`flex flex-wrap items-center gap-x-1.5 font-mono text-xs leading-5 ${signalTone(signals) === "warn" ? "text-danger" : "text-muted"}`}>
        {items.map((item, index) => (
          <li key={item.key} className="inline-flex items-center gap-x-1.5">
            {index > 0 && <span aria-hidden="true">·</span>}
            <button type="button" aria-expanded={open === item.key} aria-controls={quoteId}
              onClick={() => setOpen(open === item.key ? null : item.key)}
              onPointerEnter={(event) => mouse(event, item.key)} onPointerLeave={(event) => mouse(event, null)}
              className={ITEM}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <p id={quoteId} aria-live="polite" className={shown ? "border-l-2 border-hairline pl-2 text-[13px] leading-snug break-words text-ink" : "sr-only"}>
        {shown ? quoteLine(shown.quote) : ""}
      </p>
    </div>
  );
}

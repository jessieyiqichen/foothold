"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { ScreenHeading } from "@/components/ui/ScreenHeading";
import { Shape } from "@/components/ui/art/Shape";
import { Tape } from "@/components/ui/art/Tape";
import { SAVED_PATH } from "@/lib/cards/constants";
import { CARDS_COPY } from "@/lib/cards/copy";
import { doneLine, type Tally } from "@/lib/cards/day";
import { MATCHES_PATH } from "@/lib/matches/constants";
import { useCountUp } from "@/lib/useCountUp";

/** The reward after each five, in Nudge's form: a sheet taped up as it arrives, one big number, one sentence, one
 *  primary key. The number is the outreach (saved and reached out), or the companies looked at when there was none.
 *  Still for people who ask for reduced motion. */
export function DoneSheet({ tally, onFiveMore }: { tally: Tally; onFiveMore: () => void }) {
  const outreach = tally.saved + tally.reached_out;
  const shown = useCountUp(outreach > 0 ? outreach : tally.total);
  return (
    <div className="flex flex-col items-start gap-6">
      <div aria-hidden className="reveal relative mt-4 border-2 border-ink bg-tile-mustard px-8 py-5 shadow-[-14px_22px_30px_-12px_rgb(10_10_40/0.5)] [--tilt:-1.5deg]">
        <Tape className="-top-3 -left-5 -rotate-[30deg]" />
        <Tape className="-right-5 -bottom-3 -rotate-[30deg]" />
        <Shape shape="circle" color="off" tile="green" size={48} className="absolute -top-px -right-px" />
        <span className="block text-[clamp(72px,18vw,140px)] leading-none font-black tracking-[-0.04em] text-ink tabular-nums">{shown}</span>
        <span className="block font-mono text-xs text-ink">{outreach > 0 ? CARDS_COPY.doneOutreach : CARDS_COPY.doneLooked}</span>
      </div>
      <ScreenHeading id="today-card" className="text-3xl leading-tight font-black tracking-[-0.03em] text-ink">{doneLine(tally)}</ScreenHeading>
      <div className="flex flex-wrap items-center gap-4">
        <ButtonLink size="lg" href={SAVED_PATH}>{CARDS_COPY.seeSaved}</ButtonLink>
        <Button variant="ghost" onClick={onFiveMore}>{CARDS_COPY.fiveMore}</Button>
      </div>
      <ButtonLink variant="ghost" href={MATCHES_PATH}>{CARDS_COPY.allRoles}</ButtonLink>
    </div>
  );
}

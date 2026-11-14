"use client";

import { useEffect, useState } from "react";
import type { WithDb } from "@/components/auth/useSessionDb";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScreenHeading } from "@/components/ui/ScreenHeading";
import { Shape } from "@/components/ui/art/Shape";
import { Tape } from "@/components/ui/art/Tape";
import { HOME_PATH } from "@/lib/auth/routes";
import { loadMatches } from "@/lib/matches/remote";
import { START_COPY } from "@/lib/start/copy";
import { foundResult } from "@/lib/start/steps";
import { useCountUp } from "@/lib/useCountUp";

type Count = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; total: number };

/** Step 5, the reward: how many roles were found with the saved directions and levels, one big number on a sheet
 *  taped up as it arrives. None found: a line and a way back to the kinds of work. */
export function FoundStep({ withDb, onWiden }: { withDb: WithDb; onWiden: () => void }) {
  const [count, setCount] = useState<Count>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    withDb(START_COPY.countFailed, (db) => loadMatches(db, 0)).then((result) => {
      if (live) setCount(result.ok ? { kind: "ready", total: result.value.total } : { kind: "failed" });
    });
    return () => {
      live = false;
    };
  }, [withDb, attempt]);

  if (count.kind === "loading") return <ScreenHeading id="start-step" className="text-3xl font-black tracking-[-0.03em] text-ink">{START_COPY.counting}</ScreenHeading>;
  if (count.kind === "failed") {
    return (
      <div className="flex flex-col items-start gap-4">
        <ScreenHeading id="start-step" className="text-3xl font-black tracking-[-0.03em] text-ink">{START_COPY.counting}</ScreenHeading>
        <p role="alert" className="font-bold text-danger">{START_COPY.countFailed}</p>
        <Button variant="secondary" onClick={() => { setCount({ kind: "loading" }); setAttempt((n) => n + 1); }}>{START_COPY.tryAgain}</Button>
      </div>
    );
  }
  const result = foundResult(count.total);
  return (
    <div className="flex flex-col items-start gap-6">
      {result.kind === "found" && <BigNumber total={result.total} />}
      <ScreenHeading id="start-step" className="text-3xl leading-tight font-black tracking-[-0.03em] text-ink">{result.heading}</ScreenHeading>
      <p className="font-mono text-xs leading-5 text-muted">{result.kind === "found" ? START_COPY.foundLine : START_COPY.zeroLine}</p>
      {result.kind === "found"
        ? <ButtonLink size="lg" href={HOME_PATH}>{START_COPY.seeFive}</ButtonLink>
        : <Button size="lg" onClick={onWiden}>{START_COPY.widen}</Button>}
    </div>
  );
}

/** The number, on a mustard sheet taped up at a tilt, counting up as it arrives. Read out by the heading under it, so
 *  hidden here. Still for people who ask for reduced motion. */
function BigNumber({ total }: { total: number }) {
  const shown = useCountUp(total);
  return (
    <div aria-hidden className="reveal relative mt-4 border-2 border-ink bg-tile-mustard px-8 py-5 shadow-[-14px_22px_30px_-12px_rgb(10_10_40/0.5)] [--tilt:-1.5deg]">
      <Tape className="-top-3 -left-5 -rotate-[30deg]" />
      <Tape className="-right-5 -bottom-3 -rotate-[30deg]" />
      <Shape shape="quarter" color="red" size={56} className="absolute -top-px -right-px" />
      <span className="block text-[clamp(72px,18vw,140px)] leading-none font-black tracking-[-0.04em] text-ink tabular-nums">{shown.toLocaleString("en-US")}</span>
    </div>
  );
}
